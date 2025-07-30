import { Request, Response } from "express";
import { NoteService } from "../services/note.service";
import { triggerWebhook } from "../utils/triggerWebhook";
import { isValidTitle, isValidContent, isValidColor, sanitizeString } from "../utils/validation";
import { WEBHOOK_ACTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from "../constants";

export async function getNotes(req: Request, res: Response) {
  const notes = await NoteService.findNotesByUserId((req as any).user.id);
  res.json(notes);
}

export async function getNoteById(req: Request, res: Response) {
  const note = await NoteService.findNoteById(Number(req.params.id));
  
  if (!note) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
  }
  
  if (note.userId !== (req as any).user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }
  
  res.json(note);
}

export async function createNote(req: Request, res: Response) {
  const { title, content, color, isPinned, checkboxes } = req.body;
  const userId = (req as any).user.id;

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
      checkboxes
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
  const userId = (req as any).user.id;

  try {
    const existingNote = await NoteService.findNoteById(Number(id));
    
    if (!existingNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.NOTE_NOT_FOUND });
    }
    
    if (existingNote.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
    }

    const note = await NoteService.updateNote(Number(id), {
      title,
      content,
      color,
      isPinned,
      isShared,
      checkboxes
    });

    await triggerWebhook(userId, WEBHOOK_ACTIONS.NOTE_UPDATED, note);
    res.json(note);
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.UPDATE_ERROR });
  }
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user.id;
  
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
  const userId = (req as any).user.id;

  try {
    // Vérifier que la checkbox appartient à une note de l'utilisateur
    const checkbox = await NoteService.findCheckboxById(Number(checkboxId));
    
    if (!checkbox || checkbox.note.userId !== userId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.CHECKBOX_NOT_FOUND });
    }

    const updatedCheckbox = await NoteService.updateCheckbox(Number(checkboxId), checked);
    
    // Déclencher le webhook pour la mise à jour de la note
    await triggerWebhook(userId, WEBHOOK_ACTIONS.NOTE_UPDATED, { 
      id: checkbox.note.id, 
      checkboxUpdated: { id: checkboxId, checked }
    });

    res.json(updatedCheckbox);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.CHECKBOX_UPDATE_ERROR });
  }
}
