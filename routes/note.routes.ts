import { Router } from "express";
import { authenticateJwtOrApiKey, requirePermission } from "../middleware/apikey.middleware";
import { ApiKeyPermission } from "../services/apikey.service";
import { checkNotesLimit, checkStorageLimit, checkFeatureEnabled } from "../middleware/limits.middleware";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
  updateCheckbox,
  toggleNotePin,
  reorderNotes
} from "../controllers/note.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Gestion des notes (authentification JWT ou clé API requise)
 */

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Récupérer toutes les notes de l'utilisateur
 *     description: Nécessite la permission 'read_notes' si utilisation d'une clé API
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *             example:
 *               - id: 1
 *                 title: "Ma première note"
 *                 content: "Contenu de la note"
 *                 color: "#ffffff"
 *                 isPinned: false
 *                 isShared: false
 *                 userId: 1
 *                 checkboxes: []
 *                 createdAt: "2023-12-01T10:00:00.000Z"
 *                 updatedAt: "2023-12-01T10:00:00.000Z"
 *       401:
 *         description: Token d'authentification manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Récupérer une note par son ID
 *     description: Nécessite la permission 'read_notes' si utilisation d'une clé API
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note
 *     responses:
 *       200:
 *         description: Note trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *             example:
 *               id: 1
 *               title: "Ma première note"
 *               content: "Contenu de la note"
 *               color: "#ffffff"
 *               isPinned: false
 *               isShared: false
 *               userId: 1
 *               checkboxes: []
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Créer une nouvelle note
 *     description: Nécessite la permission 'create_notes' si utilisation d'une clé API
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteRequest'
 *           examples:
 *             with_checkboxes:
 *               summary: "Note avec checkboxes"
 *               value:
 *                 title: "Nouvelle note avec tâches"
 *                 content: "Contenu avec liste de tâches"
 *                 color: "#ffcc00"
 *                 isPinned: true
 *                 checkboxes:
 *                   - label: "Tâche 1"
 *                     checked: false
 *                   - label: "Tâche 2"
 *                     checked: true
 *             simple_note:
 *               summary: "Note simple sans checkboxes"
 *               value:
 *                 title: "Note simple"
 *                 content: "Juste une note de texte simple"
 *                 color: "#ffffff"
 *                 isPinned: false
 *     responses:
 *       200:
 *         description: Note créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       500:
 *         description: Erreur lors de la création
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur lors de la création"
 */

/**
 * @swagger
 * /notes/{id}:
 *   patch:
 *     summary: Mettre à jour une note
 *     description: Nécessite la permission 'update_notes' si utilisation d'une clé API
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteUpdateRequest'
 *           examples:
 *             simple_update:
 *               summary: "Mise à jour simple sans checkboxes"
 *               value:
 *                 title: "Titre modifié"
 *                 content: "Contenu modifié"
 *                 isPinned: true
 *                 isShared: false
 *             with_checkboxes:
 *               summary: "Mise à jour avec checkboxes"
 *               value:
 *                 title: "Note avec nouvelles tâches"
 *                 content: "Contenu mis à jour"
 *                 color: "#ff6b6b"
 *                 isPinned: false
 *                 isShared: true
 *                 checkboxes:
 *                   - label: "Nouvelle tâche 1"
 *                     checked: false
 *                   - label: "Nouvelle tâche 2"
 *                     checked: true
 *     responses:
 *       200:
 *         description: Note mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       500:
 *         description: Erreur lors de la mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur mise à jour"
 */

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: Supprimer une note
 *     description: Nécessite la permission 'delete_notes' si utilisation d'une clé API
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note à supprimer
 *     responses:
 *       200:
 *         description: Note supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               message: "Supprimé"
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       500:
 *         description: Erreur lors de la suppression
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur suppression"
 */

/**
 * @swagger
 * /notes/checkbox/{checkboxId}:
 *   patch:
 *     summary: Mettre à jour l'état d'une checkbox
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkboxId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la checkbox à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checked]
 *             properties:
 *               checked:
 *                 type: boolean
 *                 description: Nouvel état de la checkbox (coché ou décoché)
 *           examples:
 *             check:
 *               summary: "Cocher la checkbox"
 *               value:
 *                 checked: true
 *             uncheck:
 *               summary: "Décocher la checkbox"
 *               value:
 *                 checked: false
 *     responses:
 *       200:
 *         description: Checkbox mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Checkbox'
 *             example:
 *               id: 1
 *               label: "Tâche importante"
 *               checked: true
 *               noteId: 5
 *       404:
 *         description: Checkbox non trouvée ou n'appartient pas à l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Checkbox non trouvée"
 *       500:
 *         description: Erreur lors de la mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur mise à jour checkbox"
 */






/**
 * @swagger
 * /notes/{id}/pin:
 *   patch:
 *     summary: Basculer l'épinglage d'une note
 *     description: Inverse automatiquement l'état d'épinglage d'une note (épinglée → désépinglée ou vice versa) sans modifier la date de modification (updatedAt). Aucun body requis.
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note dont basculer l'épinglage
 *     responses:
 *       200:
 *         description: Statut d'épinglage basculé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *             examples:
 *               pinned_to_unpinned:
 *                 summary: "Note désépinglée"
 *                 value:
 *                   id: 1
 *                   title: "Ma note"
 *                   content: "Contenu"
 *                   isPinned: false
 *                   updatedAt: "2023-12-01T10:00:00.000Z"
 *               unpinned_to_pinned:
 *                 summary: "Note épinglée"
 *                 value:
 *                   id: 1
 *                   title: "Ma note"
 *                   content: "Contenu"
 *                   isPinned: true
 *                   updatedAt: "2023-12-01T10:00:00.000Z"
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       403:
 *         description: Accès non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Accès non autorisé"
 *       500:
 *         description: Erreur lors de la modification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur mise à jour"
 */

/**
 * @swagger
 * /notes/reorder:
 *   patch:
 *     summary: Réorganiser l'ordre des notes
 *     description: Met à jour l'ordre de plusieurs notes en une seule opération. Prend une liste d'IDs de notes dans l'ordre souhaité. Toutes les notes doivent appartenir à l'utilisateur connecté. Nécessite la permission 'update_notes' si utilisation d'une clé API.
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [noteIds]
 *             properties:
 *               noteIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Liste des IDs de notes dans l'ordre souhaité (index 0 = ordre 0, index 1 = ordre 1, etc.)
 *           example:
 *             noteIds: [3, 1, 5, 2]
 *     responses:
 *       200:
 *         description: Ordre des notes mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ordre des notes mis à jour avec succès"
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Liste d'IDs de notes requise"
 *       403:
 *         description: Une ou plusieurs notes n'appartiennent pas à l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Une ou plusieurs notes n'appartiennent pas à cet utilisateur"
 *       500:
 *         description: Erreur lors du réordonnancement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur lors du réordonnancement"
 */

router.get("/", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.READ_NOTES), getNotes);
router.get("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.READ_NOTES), getNoteById);
router.post("/", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.CREATE_NOTES), checkNotesLimit(), checkStorageLimit(), createNote);
router.patch("/reorder", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.UPDATE_NOTES), reorderNotes);
router.patch("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.UPDATE_NOTES), updateNote);
router.patch("/:id/pin", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.UPDATE_NOTES), toggleNotePin);
router.patch("/checkbox/:checkboxId", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.UPDATE_NOTES), updateCheckbox);
router.delete("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.DELETE_NOTES), deleteNote);

export default router;
