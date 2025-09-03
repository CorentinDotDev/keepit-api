import { Request, Response } from "express";
import { NoteService } from "../services/note.service";
import { triggerWebhook } from "../utils/triggerWebhook";
import { isValidTitle, isValidContent, isValidColor } from "../utils/validation";
import { WEBHOOK_ACTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from "../constants";

export async function getTemplates(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const templates = await NoteService.findTemplatesByUserId(userId);
    res.json(templates);
  } catch (error) {
    console.error("Erreur lors de la récupération des templates:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la récupération des templates" 
    });
  }
}

export async function getTemplateById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const template = await NoteService.findTemplateById(Number(id));
    
    if (!template) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: "Template non trouvé" 
      });
    }
    
    // Vérifier que l'utilisateur a accès au template
    if (template.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: "Accès non autorisé" 
      });
    }
    
    res.json(template);
  } catch (error) {
    console.error("Erreur lors de la récupération du template:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la récupération du template" 
    });
  }
}

export async function createTemplate(req: Request, res: Response) {
  try {
    const { title, content, color, checkboxes } = req.body;
    const userId = req.user.id;

    if (!isValidTitle(title)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Titre invalide (1-200 caractères)" 
      });
    }

    if (!isValidContent(content)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Contenu trop long (max 10000 caractères)" 
      });
    }

    if (color && !isValidColor(color)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Couleur invalide" 
      });
    }

    const template = await NoteService.createNote({
      title,
      content,
      color,
      isPinned: false,
      isTemplate: true, // Marquer comme template
      userId,
      checkboxes
    });

    res.status(HTTP_STATUS.CREATED).json(template);
  } catch (error) {
    console.error("Erreur lors de la création du template:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la création du template" 
    });
  }
}

export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, color, checkboxes } = req.body;
    const userId = req.user.id;

    // Vérifier que le template existe et appartient à l'utilisateur
    const existingTemplate = await NoteService.findTemplateById(Number(id));
    if (!existingTemplate) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: "Template non trouvé" 
      });
    }

    if (existingTemplate.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: "Accès non autorisé" 
      });
    }

    // Validation des données
    if (title !== undefined && !isValidTitle(title)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Titre invalide (1-200 caractères)" 
      });
    }

    if (content !== undefined && !isValidContent(content)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Contenu trop long (max 10000 caractères)" 
      });
    }

    if (color && !isValidColor(color)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Couleur invalide" 
      });
    }

    const updatedTemplate = await NoteService.updateNote(Number(id), {
      title,
      content,
      color,
      checkboxes,
      isTemplate: true // S'assurer que ça reste un template
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du template:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la mise à jour du template" 
    });
  }
}

export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que le template existe et appartient à l'utilisateur
    const existingTemplate = await NoteService.findTemplateById(Number(id));
    if (!existingTemplate) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: "Template non trouvé" 
      });
    }

    if (existingTemplate.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: "Accès non autorisé" 
      });
    }

    await NoteService.deleteNote(Number(id));
    res.json({ message: "Template supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du template:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la suppression du template" 
    });
  }
}

export async function createNoteFromTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const { title, content, color } = req.body;
    const userId = req.user.id;

    // Validation des overrides optionnels
    if (title && !isValidTitle(title)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Titre invalide (1-200 caractères)" 
      });
    }

    if (content && !isValidContent(content)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Contenu trop long (max 10000 caractères)" 
      });
    }

    if (color && !isValidColor(color)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Couleur invalide" 
      });
    }

    const note = await NoteService.createNoteFromTemplate(
      Number(templateId), 
      userId, 
      { title, content, color }
    );

    // Déclencher les webhooks pour la création de note
    await triggerWebhook(userId, WEBHOOK_ACTIONS.NOTE_CREATED, note);

    res.status(HTTP_STATUS.CREATED).json(note);
  } catch (error: any) {
    console.error("Erreur lors de la création de note depuis template:", error);
    
    if (error.message === 'Template non trouvé' || error.message === 'Accès non autorisé au template') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: error.message 
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la création de note depuis template" 
    });
  }
}

export async function convertNoteToTemplate(req: Request, res: Response) {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const template = await NoteService.convertNoteToTemplate(Number(noteId), userId);
    res.json(template);
  } catch (error: any) {
    console.error("Erreur lors de la conversion en template:", error);
    
    if (error.message === 'Note non trouvée ou accès non autorisé') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: error.message 
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la conversion en template" 
    });
  }
}

export async function convertTemplateToNote(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    const note = await NoteService.convertTemplateToNote(Number(templateId), userId);
    res.json(note);
  } catch (error: any) {
    console.error("Erreur lors de la conversion en note:", error);
    
    if (error.message === 'Template non trouvé ou accès non autorisé') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: error.message 
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la conversion en note" 
    });
  }
}