import { Request, Response } from "express";
import { InvitationService } from "../services/invitation.service";
import { isValidEmail } from "../utils/validation";
import { HTTP_STATUS } from "../constants";
import { InvitationPermission } from "../types/invitation.types";

// === CRÉATION D'INVITATIONS ===

export async function createInvitation(req: Request, res: Response) {
  try {
    const { noteId } = req.params;
    const { email, permission = InvitationPermission.READ, message, expiresInDays = 7 } = req.body;
    const userId = req.user.id;

    // Validation
    if (!email || !isValidEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Email invalide"
      });
    }

    if (!Object.values(InvitationPermission).includes(permission)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Permission invalide"
      });
    }

    if (expiresInDays < 1 || expiresInDays > 30) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "La durée d'expiration doit être entre 1 et 30 jours"
      });
    }

    const invitation = await InvitationService.createInvitation(
      Number(noteId),
      email,
      userId,
      permission,
      message,
      expiresInDays
    );

    res.status(HTTP_STATUS.CREATED).json({
      message: "Invitation créée avec succès",
      invitation: {
        id: invitation.id,
        invitedEmail: invitation.invitedEmail,
        permission: invitation.permission,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        token: invitation.token, // Nécessaire pour l'envoi par email
        note: invitation.note,
        invitedBy: invitation.invitedBy
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'invitation:", error);
    
    if (error.message.includes("Note non trouvée") || 
        error.message.includes("accès non autorisé") ||
        error.message.includes("s'inviter soi-même") ||
        error.message.includes("invitation est déjà en cours") ||
        error.message.includes("a déjà accès")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la création de l'invitation"
    });
  }
}

// === RÉPONSE AUX INVITATIONS ===

export async function getInvitationByToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Token d'invitation requis"
      });
    }

    const invitation = await InvitationService.getInvitationByToken(token);

    res.json({
      invitation: {
        id: invitation.id,
        invitedEmail: invitation.invitedEmail,
        permission: invitation.permission,
        message: invitation.message,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        note: invitation.note,
        invitedBy: invitation.invitedBy
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'invitation:", error);
    
    if (error.message.includes("non trouvée") || error.message.includes("expiré")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération de l'invitation"
    });
  }
}

export async function acceptInvitation(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Token d'invitation requis"
      });
    }

    const access = await InvitationService.acceptInvitation(token, userId);

    res.json({
      message: "Invitation acceptée avec succès",
      access: {
        noteId: access.noteId,
        permission: access.permission,
        grantedAt: access.grantedAt,
        note: access.note,
        sharedBy: access.user
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de l'acceptation de l'invitation:", error);
    
    if (error.message.includes("non trouvée") || 
        error.message.includes("plus valide") ||
        error.message.includes("expiré") ||
        error.message.includes("pas pour vous")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de l'acceptation de l'invitation"
    });
  }
}

export async function declineInvitation(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Token d'invitation requis"
      });
    }

    await InvitationService.declineInvitation(token, userId);

    res.json({
      message: "Invitation déclinée avec succès"
    });
  } catch (error: any) {
    console.error("Erreur lors du refus de l'invitation:", error);
    
    if (error.message.includes("non trouvée") || 
        error.message.includes("plus valide") ||
        error.message.includes("pas pour vous")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors du refus de l'invitation"
    });
  }
}

// === GESTION DES INVITATIONS ===

export async function getPendingInvitations(req: Request, res: Response) {
  try {
    const userEmail = req.user.email;
    const invitations = await InvitationService.getPendingInvitations(userEmail);

    res.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        token: inv.token,
        permission: inv.permission,
        message: inv.message,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        note: inv.note,
        invitedBy: inv.invitedBy
      }))
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des invitations en attente:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération des invitations en attente"
    });
  }
}

export async function getSentInvitations(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const invitations = await InvitationService.getSentInvitations(userId);

    res.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        invitedEmail: inv.invitedEmail,
        permission: inv.permission,
        message: inv.message,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        acceptedAt: inv.acceptedAt,
        note: inv.note
      }))
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des invitations envoyées:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération des invitations envoyées"
    });
  }
}

export async function getNoteInvitations(req: Request, res: Response) {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    if (!noteId || isNaN(Number(noteId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "ID de note invalide"
      });
    }

    const invitations = await InvitationService.getNoteInvitations(Number(noteId), userId);

    res.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        invitedEmail: inv.invitedEmail,
        permission: inv.permission,
        message: inv.message,
        status: inv.status,
        token: inv.status === 'PENDING' ? inv.token : undefined, // Token seulement si en attente
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        acceptedAt: inv.acceptedAt,
        acceptedBy: inv.acceptedBy,
        hasCurrentAccess: inv.hasCurrentAccess,
        currentPermission: inv.currentPermission
      }))
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des invitations de la note:", error);
    
    if (error.message.includes("Note non trouvée") || error.message.includes("accès non autorisé")) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: "Vous n'êtes pas autorisé à voir les invitations de cette note"
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération des invitations de la note"
    });
  }
}

export async function revokeInvitation(req: Request, res: Response) {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    if (!invitationId || isNaN(Number(invitationId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "ID d'invitation invalide"
      });
    }

    await InvitationService.revokeInvitation(Number(invitationId), userId);

    res.json({
      message: "Invitation révoquée avec succès"
    });
  } catch (error: any) {
    console.error("Erreur lors de la révocation de l'invitation:", error);
    
    if (error.message.includes("non trouvée") || 
        error.message.includes("propriétaire") ||
        error.message.includes("Impossible de révoquer")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la révocation de l'invitation"
    });
  }
}

// === GESTION DES ACCÈS ===

export async function getSharedNotes(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const sharedNotes = await InvitationService.getUserNotesWithAccess(userId);

    res.json({
      sharedNotes: sharedNotes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        checkboxes: note.checkboxes,
        permission: note.permission,
        sharedBy: note.sharedBy,
        sharedAt: note.sharedAt
      }))
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des notes partagées:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération des notes partagées"
    });
  }
}

export async function removeAccess(req: Request, res: Response) {
  try {
    const { noteId, userId: targetUserId } = req.params;
    const userId = req.user.id;

    if (!noteId || isNaN(Number(noteId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "ID de note invalide"
      });
    }

    if (!targetUserId || isNaN(Number(targetUserId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "ID d'utilisateur invalide"
      });
    }

    await InvitationService.removeAccess(Number(noteId), Number(targetUserId), userId);

    res.json({
      message: "Accès retiré avec succès"
    });
  } catch (error: any) {
    console.error("Erreur lors du retrait d'accès:", error);
    
    if (error.message.includes("propriétaire") || error.message.includes("pas accès")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: error.message
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors du retrait d'accès"
    });
  }
}

export async function leaveSharedNote(req: Request, res: Response) {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    if (!noteId || isNaN(Number(noteId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "ID de note invalide"
      });
    }

    await InvitationService.removeAccess(Number(noteId), userId, userId);

    res.json({
      message: "Vous avez quitté cette note partagée"
    });
  } catch (error: any) {
    console.error("Erreur lors de la sortie de la note partagée:", error);
    
    if (error.message.includes("pas accès")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Vous n'avez pas accès à cette note"
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la sortie de la note partagée"
    });
  }
}

// === STATISTIQUES ===

export async function getInvitationStats(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const stats = await InvitationService.getInvitationStats(userId);

    res.json(stats);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Erreur lors de la récupération des statistiques"
    });
  }
}