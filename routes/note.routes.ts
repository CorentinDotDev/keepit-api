import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
  updateCheckbox,
  shareNote,
  getSharedNotes,
  unshareNote,
  unshareNoteFromEmail,
  leaveSharedNote,
  toggleNotePin
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

/**
 * @swagger
 * /notes/{id}/share:
 *   post:
 *     summary: Partager une note avec des utilisateurs
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note à partager
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emails]
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Liste des adresses emails avec qui partager la note
 *           example:
 *             emails: ["user1@example.com", "user2@example.com"]
 *     responses:
 *       200:
 *         description: Note partagée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note partagée avec succès"
 *                 shares:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       noteId:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Liste d'emails requise"
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       500:
 *         description: Erreur lors du partage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur lors du partage"
 */

/**
 * @swagger
 * /notes/shared:
 *   get:
 *     summary: Récupérer les notes partagées avec l'utilisateur
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes partagées
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Note'
 *                   - type: object
 *                     properties:
 *                       sharedBy:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                       sharedAt:
 *                         type: string
 *                         format: date-time
 *             example:
 *               - id: 1
 *                 title: "Note partagée"
 *                 content: "Contenu de la note partagée"
 *                 color: "#ffffff"
 *                 isPinned: false
 *                 isShared: true
 *                 userId: 2
 *                 checkboxes: []
 *                 sharedBy:
 *                   id: 2
 *                   email: "owner@example.com"
 *                 sharedAt: "2023-12-01T10:00:00.000Z"
 *       500:
 *         description: Erreur lors de la récupération
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur lors de la récupération des notes partagées"
 */

/**
 * @swagger
 * /notes/{id}/share:
 *   delete:
 *     summary: Retirer tout le partage d'une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note dont retirer le partage
 *     responses:
 *       200:
 *         description: Partage retiré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Partage retiré avec succès"
 *                 remainingShares:
 *                   type: integer
 *                   example: 0
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       403:
 *         description: Seul le propriétaire peut retirer le partage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Accès non autorisé"
 */

/**
 * @swagger
 * /notes/{id}/share/{email}:
 *   delete:
 *     summary: Retirer le partage d'une note pour un email spécifique
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
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email de l'utilisateur à qui retirer l'accès
 *     responses:
 *       200:
 *         description: Partage retiré pour cet email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Partage retiré pour cet email"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 remainingShares:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       403:
 *         description: Seul le propriétaire peut retirer le partage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Accès non autorisé"
 */

/**
 * @swagger
 * /notes/{id}/leave:
 *   delete:
 *     summary: Se retirer du partage d'une note
 *     description: Permet à un utilisateur de se retirer d'une note qui lui a été partagée. Seuls les utilisateurs ayant accès via un partage peuvent utiliser cet endpoint.
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note dont se retirer
 *     responses:
 *       200:
 *         description: L'utilisateur s'est retiré du partage avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vous avez quitté le partage de cette note"
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Note non trouvée"
 *       403:
 *         description: Cette note n'est pas partagée avec l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Cette note n'est pas partagée avec vous"
 *       500:
 *         description: Erreur lors de la sortie du partage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur lors de la sortie du partage"
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

router.get("/", getNotes);
router.get("/shared", getSharedNotes);
router.get("/:id", getNoteById);
router.post("/", createNote);
router.post("/:id/share", shareNote);
router.patch("/:id", updateNote);
router.patch("/:id/pin", toggleNotePin);
router.patch("/checkbox/:checkboxId", updateCheckbox);
router.delete("/:id", deleteNote);
router.delete("/:id/share", unshareNote);
router.delete("/:id/share/:email", unshareNoteFromEmail);
router.delete("/:id/leave", leaveSharedNote);

export default router;
