import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  getSentInvitations,
  revokeInvitation,
  getSharedNotes,
  removeAccess,
  leaveSharedNote,
  getInvitationStats
} from "../controllers/invitation.controller";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InvitationPermission:
 *       type: string
 *       enum: [READ, WRITE, ADMIN]
 *       description: Niveau de permission pour l'invitation
 *     
 *     InvitationStatus:
 *       type: string
 *       enum: [PENDING, ACCEPTED, DECLINED, EXPIRED, REVOKED]
 *       description: Statut de l'invitation
 *     
 *     CreateInvitationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email de la personne à inviter
 *         permission:
 *           $ref: '#/components/schemas/InvitationPermission'
 *           default: READ
 *         message:
 *           type: string
 *           description: Message personnalisé pour l'invitation
 *         expiresInDays:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *           description: Durée de validité en jours
 *     
 *     Invitation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         invitedEmail:
 *           type: string
 *           format: email
 *         permission:
 *           $ref: '#/components/schemas/InvitationPermission'
 *         message:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/InvitationStatus'
 *         token:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *         note:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             title:
 *               type: string
 *             color:
 *               type: string
 *         invitedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *     
 *     SharedNote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         color:
 *           type: string
 *         checkboxes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Checkbox'
 *         permission:
 *           $ref: '#/components/schemas/InvitationPermission'
 *         sharedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *         sharedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /invitations/notes/{noteId}:
 *   post:
 *     summary: Créer une invitation pour partager une note
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvitationRequest'
 *     responses:
 *       201:
 *         description: Invitation créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Erreur de validation ou invitation impossible
 *       404:
 *         description: Note non trouvée
 */
router.post("/notes/:noteId", authenticate, createInvitation);

/**
 * @swagger
 * /invitations/{token}/accept:
 *   post:
 *     summary: Accepter une invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation acceptée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 access:
 *                   type: object
 *                   properties:
 *                     noteId:
 *                       type: integer
 *                     permission:
 *                       type: string
 *                     grantedAt:
 *                       type: string
 *                       format: date-time
 *                     note:
 *                       type: object
 *                     sharedBy:
 *                       type: object
 *       400:
 *         description: Invitation invalide, expirée ou non destinée à cet utilisateur
 */
router.post("/:token/accept", authenticate, acceptInvitation);

/**
 * @swagger
 * /invitations/{token}/decline:
 *   post:
 *     summary: Décliner une invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation déclinée avec succès
 *       400:
 *         description: Invitation invalide ou non destinée à cet utilisateur
 */
router.post("/:token/decline", authenticate, declineInvitation);

/**
 * @swagger
 * /invitations/pending:
 *   get:
 *     summary: Récupérer les invitations en attente pour l'utilisateur connecté
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des invitations en attente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invitation'
 */
router.get("/pending", authenticate, getPendingInvitations);

/**
 * @swagger
 * /invitations/sent:
 *   get:
 *     summary: Récupérer les invitations envoyées par l'utilisateur connecté
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des invitations envoyées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invitation'
 */
router.get("/sent", authenticate, getSentInvitations);

/**
 * @swagger
 * /invitations/{invitationId}/revoke:
 *   delete:
 *     summary: Révoquer une invitation envoyée
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: invitationId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invitation révoquée avec succès
 *       400:
 *         description: Invitation non trouvée ou impossible à révoquer
 */
router.delete("/:invitationId/revoke", authenticate, revokeInvitation);

/**
 * @swagger
 * /invitations/shared-notes:
 *   get:
 *     summary: Récupérer les notes partagées avec l'utilisateur connecté
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes partagées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sharedNotes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SharedNote'
 */
router.get("/shared-notes", authenticate, getSharedNotes);

/**
 * @swagger
 * /invitations/access/{noteId}/{userId}:
 *   delete:
 *     summary: Retirer l'accès d'un utilisateur à une note (propriétaire seulement)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Accès retiré avec succès
 *       400:
 *         description: Erreur de validation ou accès non autorisé
 */
router.delete("/access/:noteId/:userId", authenticate, removeAccess);

/**
 * @swagger
 * /invitations/leave/{noteId}:
 *   delete:
 *     summary: Quitter une note partagée
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note quittée avec succès
 *       400:
 *         description: Utilisateur n'a pas accès à cette note
 */
router.delete("/leave/:noteId", authenticate, leaveSharedNote);

/**
 * @swagger
 * /invitations/stats:
 *   get:
 *     summary: Récupérer les statistiques d'invitations
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques d'invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sent:
 *                   type: integer
 *                   description: Nombre d'invitations envoyées
 *                 received:
 *                   type: integer
 *                   description: Nombre d'invitations reçues
 *                 pending:
 *                   type: integer
 *                   description: Nombre d'invitations en attente
 */
router.get("/stats", authenticate, getInvitationStats);

/**
 * @swagger
 * /invitations/{token}:
 *   get:
 *     summary: Récupérer une invitation par son token
 *     tags: [Invitations]
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       404:
 *         description: Invitation non trouvée ou expirée
 */
router.get("/:token", getInvitationByToken);

export default router;