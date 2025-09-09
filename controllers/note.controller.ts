import { Request, Response } from "express";
import { NoteService } from "../services/note.service";
import { triggerWebhook } from "../utils/triggerWebhook";
import { isValidTitle, isValidContent, isValidColor, sanitizeString, sanitizeCheckboxes } from "../utils/validation";
import { WEBHOOK_ACTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from "../constants";

// Fonction utilitaire pour formater une note (legacy support)
function formatNoteWithShares(note: any) {
  return {
    ...note,
    sharedWith: [] // Migration vers le nouveau système d'invitations
  };
}

export async function getNotes(req: Request, res: Response) {
  const notes = await NoteService.findNotesByUserId(req.user.id);
  const formattedNotes = notes.map(formatNoteWithShares);
  res.json(formattedNotes);
}

export async function getNoteById(req: Request, res: Response) {
  const noteId = Number(req.params.id);
  const userId = req.user.id;
  const userEmail = req.user.email;

  const note = await NoteService.findNoteById(noteId);
  
  if (!note) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
  }
  
  // Vérifier si l'utilisateur a accès à la note (propriétaire ou partagée)
  const hasAccess = await NoteService.hasAccessToNote(noteId, userId, userEmail);
  if (!hasAccess) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }
  
  // Note: Le système de partage a migré vers les invitations
  // Pour l'instant, on retourne simplement la note
  res.json(formatNoteWithShares(note));
}

export async function createNote(req: Request, res: Response) {
  const { title, content, color, isPinned, checkboxes } = req.body;
  const userId = req.user.id;

  if (!isValidTitle(title)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_TITLE });
  }

  if (!isValidContent(content)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.CONTENT_TOO_LONG });
  }

  if (!isValidColor(color)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_COLOR });
  }

  try {
    const note = await NoteService.createNote({
      title: sanitizeString(title),
      content: sanitizeString(content),
      color,
      isPinned,
      userId,
      checkboxes: sanitizeCheckboxes(checkboxes)
    });

    await triggerWebhook(userId, WEBHOOK_ACTIONS.NOTE_CREATED, note);
    res.json(note);
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.CREATION_ERROR });
  }
}

export async function updateNote(req: Request, res: Response) {
  const { title, content, color, isPinned, isShared, checkboxes } = req.body;
  const { id } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const existingNote = await NoteService.findNoteById(Number(id));
    
    if (!existingNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
    }
    
    // Vérifier si l'utilisateur a accès à la note (propriétaire ou partagée)
    const hasAccess = await NoteService.hasAccessToNote(Number(id), userId, userEmail);
    if (!hasAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
    }

    const note = await NoteService.updateNote(Number(id), {
      title: title ? sanitizeString(title) : undefined,
      content: content ? sanitizeString(content) : undefined,
      color,
      isPinned,
      isShared,
      checkboxes: sanitizeCheckboxes(checkboxes)
    });

    // Déclencher le webhook pour le propriétaire original de la note
    await triggerWebhook(existingNote.userId, WEBHOOK_ACTIONS.NOTE_UPDATED, note);
    res.json(note);
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.UPDATE_ERROR });
  }
}

export async function toggleNotePin(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const existingNote = await NoteService.findNoteById(Number(id));
    
    if (!existingNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
    }
    
    // Vérifier si l'utilisateur a accès à la note (propriétaire ou partagée)
    const hasAccess = await NoteService.hasAccessToNote(Number(id), userId, userEmail);
    if (!hasAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
    }

    // Inverser le statut d'épinglage actuel
    const newPinnedStatus = !existingNote.isPinned;
    
    // Mettre à jour uniquement le statut d'épinglage sans modifier updatedAt
    await NoteService.updateNotePinnedStatus(Number(id), newPinnedStatus);
    
    // Récupérer la note complète avec les relations pour la réponse
    const noteWithRelations = await NoteService.findNoteById(Number(id));
    res.json(noteWithRelations);
  } catch (error) {
    console.error('Pin toggle error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.UPDATE_ERROR });
  }
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const existingNote = await NoteService.findNoteById(Number(id));
    
    if (!existingNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
    }
    
    if (existingNote.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
    }

    await NoteService.deleteNote(Number(id));
    await triggerWebhook(userId, WEBHOOK_ACTIONS.NOTE_DELETED, { id });
    res.json({ message: SUCCESS_MESSAGES.NOTE_DELETED });
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.DELETE_ERROR });
  }
}

export async function updateCheckbox(req: Request, res: Response) {
  const { checkboxId } = req.params;
  const { checked } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    // Vérifier que la checkbox appartient à une note accessible à l'utilisateur
    const checkbox = await NoteService.findCheckboxById(Number(checkboxId));
    
    if (!checkbox) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.CHECKBOX_NOT_FOUND });
    }

    // Vérifier si l'utilisateur a accès à la note (propriétaire ou partagée)
    const hasAccess = await NoteService.hasAccessToNote(checkbox.note.id, userId, userEmail);
    if (!hasAccess) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.CHECKBOX_NOT_FOUND });
    }

    const updatedCheckbox = await NoteService.updateCheckbox(Number(checkboxId), checked);
    
    // Déclencher le webhook pour le propriétaire original de la note
    await triggerWebhook(checkbox.note.userId, WEBHOOK_ACTIONS.NOTE_UPDATED, { 
      id: checkbox.note.id, 
      checkboxUpdated: { id: checkboxId, checked }
    });

    res.json(updatedCheckbox);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.CHECKBOX_UPDATE_ERROR });
  }
}


export async function reorderNotes(req: Request, res: Response) {
  const { noteIds } = req.body;
  const userId = req.user.id;

  if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Liste d'IDs de notes requise" });
  }

  try {
    await NoteService.reorderNotes(userId, noteIds);
    res.json({ message: "Ordre des notes mis à jour avec succès" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("n'appartiennent pas")) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Erreur lors du réordonnancement" });
  }
}
