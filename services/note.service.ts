import prisma from "../prisma/client";

export class NoteService {
  static async findNotesByUserId(userId: number) {
    return await prisma.note.findMany({
      where: { 
        userId,
        isTemplate: false // Exclure les templates des requêtes classiques
      },
      include: { 
        checkboxes: true
      },
    });
  }

  static async findNoteById(id: number) {
    return await prisma.note.findUnique({
      where: { id },
      include: { 
        checkboxes: true
      },
    });
  }

  static async createNote(noteData: {
    title: string;
    content: string;
    color?: string;
    isPinned?: boolean;
    isTemplate?: boolean;
    userId: number;
    checkboxes?: Array<{ label: string; checked: boolean }>;
  }) {
    const { checkboxes, ...data } = noteData;

    return await prisma.note.create({
      data: {
        ...data,
        checkboxes: {
          create:
            checkboxes?.map((cb) => ({
              label: cb.label,
              checked: cb.checked,
            })) || [],
        },
      },
      include: { checkboxes: true },
    });
  }

  static async updateNote(
    id: number,
    noteData: {
      title?: string;
      content?: string;
      color?: string;
      isPinned?: boolean;
      isShared?: boolean;
      isTemplate?: boolean;
      checkboxes?: Array<{ id?: number; label: string; checked: boolean }>;
    }
  ) {
    const { checkboxes, ...data } = noteData;

    return await prisma.note.update({
      where: { id },
      data: {
        ...data,
        ...(checkboxes && {
          checkboxes: {
            deleteMany: { noteId: id },
            create: checkboxes.map((cb) => ({
              label: cb.label,
              checked: cb.checked,
            })),
          },
        }),
      },
      include: { checkboxes: true },
    });
  }

  static async updateNotePinnedStatus(id: number, isPinned: boolean) {
    // Utiliser une transaction pour mettre à jour sans modifier updatedAt
    return await prisma.$transaction(async (tx) => {
      const currentNote = await tx.note.findUnique({ where: { id } });
      if (!currentNote) throw new Error('Note not found');
      
      // Mettre à jour avec la date originale pour éviter le changement d'updatedAt
      return await tx.note.update({
        where: { id },
        data: { 
          isPinned,
          updatedAt: currentNote.updatedAt // Préserver la date originale
        }
      });
    });
  }

  static async deleteNote(id: number) {
    await prisma.checkbox.deleteMany({ where: { noteId: id } });
    return await prisma.note.delete({ where: { id } });
  }

  static async updateCheckbox(checkboxId: number, checked: boolean) {
    return await prisma.checkbox.update({
      where: { id: checkboxId },
      data: { checked },
    });
  }

  static async findCheckboxById(checkboxId: number) {
    return await prisma.checkbox.findUnique({
      where: { id: checkboxId },
      include: { note: true },
    });
  }

  // DEPRECATED: Remplacé par le système d'invitations
  static async shareNote(noteId: number, emails: string[]) {
    throw new Error("Cette méthode a été remplacée par le système d'invitations");
  }

  // DEPRECATED: Remplacé par le système d'invitations
  static async findSharedNotesByEmail(email: string) {
    throw new Error("Cette méthode a été remplacée par le système d'invitations");
  }

  static async hasAccessToNote(noteId: number, userId: number, userEmail: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) return false;

    // L'utilisateur est le propriétaire
    if (note.userId === userId) return true;

    // Vérifier l'accès via le nouveau système d'invitations
    const access = await prisma.noteAccess.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId
        }
      }
    });

    return !!access;
  }

  // DEPRECATED: Remplacé par le système d'invitations
  static async unshareNote(noteId: number, email?: string) {
    throw new Error("Cette méthode a été remplacée par le système d'invitations");
  }

  // DEPRECATED: Remplacé par le système d'invitations
  static async leaveSharedNote(noteId: number, userEmail: string) {
    throw new Error("Cette méthode a été remplacée par le système d'invitations");
  }

  static async reorderNotes(userId: number, noteIds: number[]) {
    // Vérifier que toutes les notes appartiennent à l'utilisateur
    const userNotes = await prisma.note.findMany({
      where: { 
        userId,
        id: { in: noteIds }
      },
      select: { id: true }
    });

    if (userNotes.length !== noteIds.length) {
      throw new Error('Une ou plusieurs notes n\'appartiennent pas à cet utilisateur');
    }

    // Mettre à jour l'ordre des notes en transaction
    return await prisma.$transaction(async (tx) => {
      const updates = noteIds.map((noteId, index) =>
        tx.note.update({
          where: { id: noteId },
          data: { order: index }
        })
      );
      
      return await Promise.all(updates);
    });
  }

  // === MÉTHODES POUR LES TEMPLATES ===

  static async findTemplatesByUserId(userId: number) {
    return await prisma.note.findMany({
      where: { 
        userId,
        isTemplate: true // Seulement les templates
      },
      include: { 
        checkboxes: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findTemplateById(id: number) {
    return await prisma.note.findUnique({
      where: { 
        id,
        isTemplate: true // Vérifier que c'est bien un template
      },
      include: { 
        checkboxes: true
      },
    });
  }

  static async createNoteFromTemplate(templateId: number, userId: number, overrides: {
    title?: string;
    content?: string;
    color?: string;
  } = {}) {
    const template = await this.findTemplateById(templateId);
    
    if (!template) {
      throw new Error('Template non trouvé');
    }

    // Vérifier que l'utilisateur a accès au template
    if (template.userId !== userId) {
      throw new Error('Accès non autorisé au template');
    }

    // Créer une nouvelle note basée sur le template
    const noteData = {
      title: overrides.title || template.title,
      content: overrides.content || template.content,
      color: overrides.color || template.color || undefined,
      isPinned: false, // Les notes créées depuis un template ne sont pas épinglées par défaut
      isTemplate: false, // Ce n'est pas un template
      userId: userId,
      checkboxes: template.checkboxes.map(cb => ({
        label: cb.label,
        checked: cb.checked
      }))
    };

    return await this.createNote(noteData);
  }

  static async convertNoteToTemplate(noteId: number, userId: number) {
    // Vérifier que la note appartient à l'utilisateur
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note || note.userId !== userId) {
      throw new Error('Note non trouvée ou accès non autorisé');
    }

    // Utiliser une transaction pour garantir la cohérence
    return await prisma.$transaction(async (tx) => {
      // Supprimer tous les accès existants (nouveau système)
      await tx.noteAccess.deleteMany({
        where: { noteId: noteId }
      });

      // Convertir en template
      return await tx.note.update({
        where: { id: noteId },
        data: { 
          isTemplate: true,
          isShared: false, // Un template ne peut pas être partagé
          isPinned: false  // Un template ne peut pas être épinglé
        }
      });
    });
  }

  static async convertTemplateToNote(templateId: number, userId: number) {
    // Vérifier que le template appartient à l'utilisateur
    const template = await this.findTemplateById(templateId);

    if (!template || template.userId !== userId) {
      throw new Error('Template non trouvé ou accès non autorisé');
    }

    // Convertir en note normale
    return await prisma.note.update({
      where: { id: templateId },
      data: { isTemplate: false }
    });
  }
}
