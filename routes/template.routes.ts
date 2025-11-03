import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authenticateJwtOrApiKey, requirePermission } from "../middleware/apikey.middleware";
import { ApiKeyPermission } from "../services/apikey.service";
import { checkTemplatesLimit, checkNotesLimit, checkFeatureEnabled } from "../middleware/limits.middleware";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createNoteFromTemplate,
  convertNoteToTemplate,
  convertTemplateToNote
} from "../controllers/template.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Gestion des templates de notes (authentification JWT ou clé API requise)
 */

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Récupérer tous les templates de l'utilisateur
 *     description: Nécessite la permission 'read_templates' si utilisation d'une clé API
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Liste des templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 *       401:
 *         description: Token d'authentification manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.READ_TEMPLATES), getTemplates);

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Récupérer un template par son ID
 *     description: Nécessite la permission 'read_templates' si utilisation d'une clé API
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template
 *     responses:
 *       200:
 *         description: Template trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.READ_TEMPLATES), getTemplateById);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Créer un nouveau template
 *     description: Nécessite la permission 'create_templates' si utilisation d'une clé API
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateRequest'
 *           example:
 *             title: "Template réunion hebdomadaire"
 *             content: "Ordre du jour:\n- Point 1\n- Point 2\n- Actions"
 *             color: "#e3f2fd"
 *             checkboxes:
 *               - label: "Préparer présentation"
 *                 checked: false
 *               - label: "Envoyer compte-rendu"
 *                 checked: false
 *     responses:
 *       201:
 *         description: Template créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.CREATE_TEMPLATES), checkFeatureEnabled('templatesEnabled'), checkTemplatesLimit(), createTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   patch:
 *     summary: Mettre à jour un template
 *     description: Nécessite la permission 'update_templates' si utilisation d'une clé API
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateUpdateRequest'
 *     responses:
 *       200:
 *         description: Template mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.UPDATE_TEMPLATES), updateTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: Supprimer un template
 *     description: Nécessite la permission 'delete_templates' si utilisation d'une clé API
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template
 *     responses:
 *       200:
 *         description: Template supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Template non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.DELETE_TEMPLATES), deleteTemplate);

/**
 * @swagger
 * /templates/{templateId}/use:
 *   post:
 *     summary: Créer une note à partir d'un template
 *     description: Crée une nouvelle note en utilisant un template comme base. Les propriétés peuvent être surchargées. Nécessite la permission 'use_templates' si utilisation d'une clé API.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template à utiliser
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre personnalisé (sinon utilise celui du template)
 *               content:
 *                 type: string
 *                 description: Contenu personnalisé (sinon utilise celui du template)
 *               color:
 *                 type: string
 *                 description: Couleur personnalisée (sinon utilise celle du template)
 *           example:
 *             title: "Réunion équipe - 15/12/2023"
 *             content: "Ordre du jour:\n- Bilan sprint\n- Planning prochain sprint\n- Points divers"
 *     responses:
 *       201:
 *         description: Note créée avec succès à partir du template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Template non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:templateId/use", authenticateJwtOrApiKey, requirePermission(ApiKeyPermission.USE_TEMPLATES), checkNotesLimit(), createNoteFromTemplate);

/**
 * @swagger
 * /templates/convert/from-note/{noteId}:
 *   post:
 *     summary: Convertir une note en template
 *     description: Convertit une note existante en template. La note ne sera plus visible dans les listes de notes normales. JWT uniquement (pas accessible via clé API).
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note à convertir
 *     responses:
 *       200:
 *         description: Note convertie en template avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Note non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/convert/from-note/:noteId", authenticate, checkFeatureEnabled('templatesEnabled'), checkTemplatesLimit(), convertNoteToTemplate);

/**
 * @swagger
 * /templates/convert/to-note/{templateId}:
 *   post:
 *     summary: Convertir un template en note
 *     description: Convertit un template en note normale. Le template sera visible dans les listes de notes normales. JWT uniquement (pas accessible via clé API).
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template à convertir
 *     responses:
 *       200:
 *         description: Template converti en note avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Template non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/convert/to-note/:templateId", authenticate, convertTemplateToNote);

export default router;