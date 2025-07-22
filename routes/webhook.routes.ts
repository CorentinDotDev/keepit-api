import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { addWebhook, getWebhooks } from "../controllers/webhook.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Gestion des webhooks (authentification requise)
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
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get("/", getWebhooks);
router.post("/", addWebhook);

export default router;
