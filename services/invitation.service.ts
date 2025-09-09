import prisma from "../prisma/client";
import crypto from "crypto";
import { InvitationStatus, InvitationPermission, AccessPermission } from "../types/invitation.types";

export class InvitationService {

  // === CRÉATION D'INVITATIONS ===

  static async createInvitation(
    noteId: number,
    invitedEmail: string,
    invitedById: number,
    permission: InvitationPermission = InvitationPermission.READ,
    message?: string,
    expiresInDays: number = 7
  ) {
    // Vérifier que l'utilisateur est propriétaire de la note
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note || note.userId !== invitedById) {
      throw new Error("Note non trouvée ou accès non autorisé");
    }

    // Vérifier que l'email invité n'est pas le propriétaire
    const noteOwner = await prisma.user.findUnique({
      where: { id: invitedById }
    });

    if (noteOwner?.email === invitedEmail) {
      throw new Error("Impossible de s'inviter soi-même");
    }

    // Vérifier s'il existe déjà une invitation
    const existingInvitation = await prisma.noteInvitation.findUnique({
      where: {
        noteId_invitedEmail: {
          noteId,
          invitedEmail
        }
      }
    });

    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.PENDING) {
        throw new Error("Une invitation est déjà en cours pour cet utilisateur");
      }
      
      // Pour les autres statuts (ACCEPTED, DECLINED, etc.), vérifier si l'utilisateur a un accès actuel
      const invitedUser = await prisma.user.findUnique({
        where: { email: invitedEmail }
      });
      
      if (invitedUser) {
        const currentAccess = await prisma.noteAccess.findUnique({
          where: {
            noteId_userId: {
              noteId,
              userId: invitedUser.id
            }
          }
        });
        
        if (currentAccess) {
          throw new Error("L'utilisateur a déjà accès à cette note");
        }
        
        // L'utilisateur n'a pas d'accès actuel, on peut créer une nouvelle invitation
        // Supprimer l'ancienne invitation pour respecter la contrainte unique
        await prisma.noteInvitation.delete({
          where: { id: existingInvitation.id }
        });
      }
    }

    // Cette vérification est maintenant faite ci-dessus dans le cas ACCEPTED

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Supprimer les anciennes invitations (déclinées, expirées, révoquées)
    // Note: on ne supprime que les invitations qui ne sont pas PENDING ou ACCEPTED
    // car elles sont déjà gérées dans les vérifications ci-dessus
    await prisma.noteInvitation.deleteMany({
      where: {
        noteId,
        invitedEmail,
        status: {
          in: [InvitationStatus.DECLINED, InvitationStatus.EXPIRED, InvitationStatus.REVOKED]
        }
      }
    });

    // Créer l'invitation
    const invitation = await prisma.noteInvitation.create({
      data: {
        noteId,
        invitedEmail,
        invitedById,
        permission,
        token,
        message,
        expiresAt
      },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            content: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Marquer la note comme partagée
    await prisma.note.update({
      where: { id: noteId },
      data: { isShared: true }
    });

    return invitation;
  }

  // === GESTION DES INVITATIONS ===

  static async acceptInvitation(token: string, acceptedById: number) {
    const invitation = await prisma.noteInvitation.findUnique({
      where: { token },
      include: {
        note: true,
        invitedBy: {
          select: { id: true, email: true }
        }
      }
    });

    if (!invitation) {
      throw new Error("Invitation non trouvée");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Cette invitation n'est plus valide");
    }

    if (invitation.expiresAt < new Date()) {
      await this.expireInvitation(invitation.id);
      throw new Error("Cette invitation a expiré");
    }

    // Vérifier que l'utilisateur qui accepte correspond à l'email invité
    const acceptingUser = await prisma.user.findUnique({
      where: { id: acceptedById }
    });

    if (!acceptingUser || acceptingUser.email !== invitation.invitedEmail) {
      throw new Error("Cette invitation n'est pas pour vous");
    }

    // Créer l'accès et mettre à jour l'invitation en transaction
    return await prisma.$transaction(async (tx) => {
      // Créer l'accès
      const access = await tx.noteAccess.create({
        data: {
          noteId: invitation.noteId,
          userId: acceptedById,
          permission: invitation.permission as AccessPermission,
          grantedBy: invitation.invitedById
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              color: true
            }
          },
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      // Mettre à jour l'invitation
      await tx.noteInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById
        }
      });

      return access;
    });
  }

  static async declineInvitation(token: string, userId: number) {
    const invitation = await prisma.noteInvitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      throw new Error("Invitation non trouvée");
    }

    // Vérifier que l'utilisateur qui décline correspond à l'email invité
    const decliningUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!decliningUser || decliningUser.email !== invitation.invitedEmail) {
      throw new Error("Cette invitation n'est pas pour vous");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Cette invitation n'est plus valide");
    }

    await prisma.noteInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.DECLINED,
        updatedAt: new Date()
      }
    });

    return true;
  }

  static async revokeInvitation(invitationId: number, userId: number) {
    const invitation = await prisma.noteInvitation.findUnique({
      where: { id: invitationId },
      include: { note: true }
    });

    if (!invitation) {
      throw new Error("Invitation non trouvée");
    }

    // Vérifier que l'utilisateur est le propriétaire de la note
    if (invitation.note.userId !== userId) {
      throw new Error("Seul le propriétaire de la note peut révoquer une invitation");
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new Error("Impossible de révoquer une invitation acceptée. Retirez l'accès directement.");
    }

    await prisma.noteInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REVOKED,
        updatedAt: new Date()
      }
    });

    return true;
  }

  // === RÉCUPÉRATION D'INVITATIONS ===

  static async getInvitationByToken(token: string) {
    const invitation = await prisma.noteInvitation.findUnique({
      where: { token },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            content: true,
            color: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      throw new Error("Invitation non trouvée");
    }

    // Vérifier l'expiration
    if (invitation.expiresAt < new Date() && invitation.status === InvitationStatus.PENDING) {
      await this.expireInvitation(invitation.id);
      throw new Error("Cette invitation a expiré");
    }

    return invitation;
  }

  static async getPendingInvitations(userEmail: string) {
    return await prisma.noteInvitation.findMany({
      where: {
        invitedEmail: userEmail,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            color: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getSentInvitations(userId: number) {
    return await prisma.noteInvitation.findMany({
      where: {
        invitedById: userId
      },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getNoteInvitations(noteId: number, userId: number) {
    // Vérifier que l'utilisateur est propriétaire de la note
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note || note.userId !== userId) {
      throw new Error("Note non trouvée ou accès non autorisé");
    }

    // Récupérer toutes les invitations pour cette note
    const invitations = await prisma.noteInvitation.findMany({
      where: { noteId },
      include: {
        acceptedBy: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Récupérer les accès actuels pour enrichir les données
    const currentAccesses = await prisma.noteAccess.findMany({
      where: { noteId },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Enrichir les invitations acceptées avec l'info d'accès actuel
    return invitations.map(invitation => {
      let hasCurrentAccess = false;
      let currentPermission = null;

      if (invitation.status === InvitationStatus.ACCEPTED && invitation.acceptedBy) {
        const access = currentAccesses.find(a => a.userId === invitation.acceptedBy?.id);
        hasCurrentAccess = !!access;
        currentPermission = access?.permission || null;
      }

      return {
        ...invitation,
        hasCurrentAccess,
        currentPermission
      };
    });
  }

  // === GESTION DES ACCÈS ===

  static async getUserNotesWithAccess(userId: number) {
    const accessRights = await prisma.noteAccess.findMany({
      where: { userId },
      include: {
        note: {
          include: {
            checkboxes: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { grantedAt: 'desc' }
    });

    return accessRights.map(access => ({
      ...access.note,
      sharedBy: access.note.user,
      permission: access.permission,
      sharedAt: access.grantedAt
    }));
  }

  static async removeAccess(noteId: number, userId: number, removedBy: number) {
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error("Note non trouvée");
    }

    // Vérifier les permissions : propriétaire OU l'utilisateur se retire lui-même
    const isOwner = note.userId === removedBy;
    const isSelfRemoval = userId === removedBy;

    if (!isOwner && !isSelfRemoval) {
      throw new Error("Vous ne pouvez retirer l'accès que pour vous-même ou si vous êtes propriétaire");
    }

    const access = await prisma.noteAccess.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId
        }
      }
    });

    if (!access) {
      throw new Error("L'utilisateur n'a pas accès à cette note");
    }

    await prisma.noteAccess.delete({
      where: {
        noteId_userId: {
          noteId,
          userId
        }
      }
    });

    // Vérifier s'il reste des accès
    const remainingAccess = await prisma.noteAccess.count({
      where: { noteId }
    });

    // Si plus d'accès, marquer la note comme non partagée
    if (remainingAccess === 0) {
      await prisma.note.update({
        where: { id: noteId },
        data: { isShared: false }
      });
    }

    return true;
  }

  static async hasAccessToNote(noteId: number, userId: number) {
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) return false;

    // L'utilisateur est le propriétaire
    if (note.userId === userId) return { hasAccess: true, permission: AccessPermission.ADMIN };

    // L'utilisateur a un accès partagé
    const access = await prisma.noteAccess.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId
        }
      }
    });

    if (access) {
      return { hasAccess: true, permission: access.permission };
    }

    return { hasAccess: false };
  }

  // === UTILITAIRES ===

  private static async expireInvitation(invitationId: number) {
    await prisma.noteInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.EXPIRED,
        updatedAt: new Date()
      }
    });
  }

  static async cleanupExpiredInvitations() {
    const result = await prisma.noteInvitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: InvitationStatus.EXPIRED,
        updatedAt: new Date()
      }
    });

    return result.count;
  }

  static async getInvitationStats(userId: number) {
    const [sent, received, pending] = await Promise.all([
      prisma.noteInvitation.count({
        where: { invitedById: userId }
      }),
      prisma.noteInvitation.count({
        where: { 
          invitedBy: { email: (await prisma.user.findUnique({ where: { id: userId } }))?.email }
        }
      }),
      prisma.noteInvitation.count({
        where: {
          invitedBy: { email: (await prisma.user.findUnique({ where: { id: userId } }))?.email },
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() }
        }
      })
    ]);

    return { sent, received, pending };
  }
}