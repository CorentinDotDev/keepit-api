import { Router } from "express";
import { login, register, refresh, verifyAuth } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints d'authentification
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "motdepasse123"
 *     responses:
 *       200:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               message: "Inscription réussie"
 *       500:
 *         description: Erreur d'inscription (email déjà utilisé)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email déjà utilisé"
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "7c4a8d09ca3762af61e59520943dc26494f8941b"
 *               expiresIn: "24h"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Utilisateur non trouvé"
 *       401:
 *         description: Mot de passe invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Mot de passe invalide"
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renouveler les tokens d'authentification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           example:
 *             refreshToken: "7c4a8d09ca3762af61e59520943dc26494f8941b"
 *     responses:
 *       200:
 *         description: Tokens renouvelés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "9f2b7e1ac4d83f5a6e8b9c7d2f1a0e3b4c5d6e7f"
 *               expiresIn: "24h"
 *       400:
 *         description: Refresh token manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Refresh token requis"
 *       401:
 *         description: Refresh token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Refresh token invalide ou expiré"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Refresh token invalide ou expiré"
 */

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Vérifier l'authentification
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       401:
 *         description: Token invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token invalide"
 */

router.post("/", (req, res) => res.status(400).end());
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/verify", authenticate, verifyAuth);

export default router;
