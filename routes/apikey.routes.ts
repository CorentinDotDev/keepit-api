import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { 
  createApiKey, 
  getApiKeys, 
  deleteApiKey, 
  getAvailablePermissions 
} from "../controllers/apikey.controller";

const router = Router();

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Créer une nouvelle clé API
 *     description: Crée une nouvelle clé API avec les permissions spécifiées. Nécessite une authentification JWT.
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, permissions]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom descriptif de la clé API
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [create_notes, read_notes, update_notes, delete_notes, share_notes]
 *                 description: Liste des permissions accordées à cette clé
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'expiration optionnelle de la clé
 *           example:
 *             name: "Clé pour application mobile"
 *             permissions: ["read_notes", "create_notes"]
 *             expiresAt: "2024-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Clé API créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 apiKey:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     key:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.post("/", authenticate, createApiKey);

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: Récupérer les clés API de l'utilisateur
 *     description: Retourne toutes les clés API de l'utilisateur connecté avec leurs informations (clé tronquée pour sécurité)
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clés API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                         description: Clé tronquée pour sécurité
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       lastUsedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/", authenticate, getApiKeys);

/**
 * @swagger
 * /api-keys/{keyId}:
 *   delete:
 *     summary: Supprimer une clé API
 *     description: Supprime définitivement une clé API. Cette action est irréversible.
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la clé API à supprimer
 *     responses:
 *       200:
 *         description: Clé API supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Clé API non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.delete("/:keyId", authenticate, deleteApiKey);

/**
 * @swagger
 * /api-keys/permissions:
 *   get:
 *     summary: Obtenir les permissions disponibles
 *     description: Retourne la liste de toutes les permissions disponibles pour les clés API
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des permissions disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         description: Clé de la permission
 *                       label:
 *                         type: string
 *                         description: Libellé lisible de la permission
 */
router.get("/permissions", authenticate, getAvailablePermissions);

export default router;