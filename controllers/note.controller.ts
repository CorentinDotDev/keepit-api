import { Request, Response } from "express";
import { NoteService } from "../services/note.service";
import { triggerWebhook } from "../utils/triggerWebhook";

export async function getNotes(req: Request, res: Response) {
  const notes = await NoteService.findNotesByUserId((req as any).user.id);
  res.json(notes);
}

export async function getNoteById(req: Request, res: Response) {
  const note = await NoteService.findNoteById(Number(req.params.id));
  res.json(note);
}

export async function createNote(req: Request, res: Response) {
  const { title, content, color, isPinned, checkboxes } = req.body;
  const userId = (req as any).user.id;

  try {
    const note = await NoteService.createNote({
      title,
      content,
      color,
      isPinned,
      userId,
      checkboxes
    });

    await triggerWebhook(userId, "note_created", note);
    res.json(note);
  } catch {
    res.status(500).json({ error: "Erreur lors de la création" });
  }
}

export async function updateNote(req: Request, res: Response) {
  const { title, content, color, isPinned, isShared } = req.body;
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    const note = await NoteService.updateNote(Number(id), {
      title,
      content,
      color,
      isPinned,
      isShared
    });

    await triggerWebhook(userId, "note_updated", note);
    res.json(note);
  } catch {
    res.status(500).json({ error: "Erreur mise à jour" });
  }
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user.id;
  
  try {
    await NoteService.deleteNote(Number(id));
    await triggerWebhook(userId, "note_deleted", { id });
    res.json({ message: "Supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur suppression" });
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
      return res.status(404).json({ error: "Checkbox non trouvée" });
    }

    const updatedCheckbox = await NoteService.updateCheckbox(Number(checkboxId), checked);
    
    // Déclencher le webhook pour la mise à jour de la note
    await triggerWebhook(userId, "note_updated", { 
      id: checkbox.note.id, 
      checkboxUpdated: { id: checkboxId, checked }
    });

    res.json(updatedCheckbox);
  } catch (error) {
    res.status(500).json({ error: "Erreur mise à jour checkbox" });
  }
}
