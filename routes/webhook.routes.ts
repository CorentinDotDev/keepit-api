import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { addWebhook, getWebhooks, deleteWebhook } from "../controllers/webhook.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: |
 *     Gestion des webhooks (authentification requise)
 *     
 *     Les webhooks permettent de recevoir des notifications HTTP lorsque certaines actions sont effectuées sur les notes:
 *     - `note_created`: Déclenché lors de la création d'une note
 *     - `note_updated`: Déclenché lors de la modification d'une note
 *     - `note_deleted`: Déclenché lors de la suppression d'une note
 *     
 *     **Sécurité**: Les URLs internes (localhost, 127.0.0.1, réseaux privés) sont bloquées pour éviter les attaques SSRF.
 *     
 *     **Rate Limiting**: Maximum 1 appel par seconde et par webhook. Timeout de 5 secondes.
 *     
 *     **Payload**: Le webhook recevra un POST avec un payload de type `WebhookPayload` contenant les données de la note concernée.
 */

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Récupérer tous les webhooks de l'utilisateur
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Webhook'
 *             example:
 *               - id: 1
 *                 action: "note_created"
 *                 url: "https://example.com/webhook"
 *                 userId: 1
 *               - id: 2
 *                 action: "note_updated"
 *                 url: "https://api.example.com/notify"
 *                 userId: 1
 *       401:
 *         description: Token d'authentification manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Créer un nouveau webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookRequest'
 *           example:
 *             action: "note_created"
 *             url: "https://example.com/webhook"
 *     responses:
 *       200:
 *         description: Webhook créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Webhook'
 *             example:
 *               id: 1
 *               action: "note_created"
 *               url: "https://example.com/webhook"
 *               userId: 1
 *       400:
 *         description: Données invalides (action/URL manquante, action invalide, URL invalide, URL interne interdite)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_fields:
 *                 summary: "Champs manquants"
 *                 value:
 *                   error: "Action et URL requis"
 *               invalid_action:
 *                 summary: "Action invalide"
 *                 value:
 *                   error: "Action invalide"
 *               invalid_url:
 *                 summary: "URL invalide"
 *                 value:
 *                   error: "URL invalide"
 *               internal_url:
 *                 summary: "URL interne interdite"
 *                 value:
 *                   error: "URL interne non autorisée"
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur lors de la création du webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur création webhook"
 */

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Supprimer un webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du webhook à supprimer
 *     responses:
 *       200:
 *         description: Webhook supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               message: "Webhook supprimé"
 *       404:
 *         description: Webhook non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Webhook non trouvé"
 *       403:
 *         description: Accès non autorisé (webhook n'appartient pas à l'utilisateur)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Accès non autorisé"
 *       401:
 *         description: Token d'authentification manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur lors de la suppression
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erreur suppression"
 */

router.get("/", getWebhooks);
router.post("/", addWebhook);
router.delete("/:id", deleteWebhook);

export default router;
