import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
  updateCheckbox
} from "../controllers/note.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Gestion des notes (authentification requise)
 */

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Récupérer toutes les notes de l'utilisateur
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
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

router.get("/", getNotes);
router.get("/:id", getNoteById);
router.post("/", createNote);
router.patch("/:id", updateNote);
router.patch("/checkbox/:checkboxId", updateCheckbox);
router.delete("/:id", deleteNote);

export default router;
