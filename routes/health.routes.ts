import { Router } from "express";
import { getHealthStatus } from "../controllers/health.controller";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get KeepIt server health status and information
 *     description: Returns server health status, version, and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "KeepIt Server"
 *                 version:
 *                   type: string
 *                   example: "1.1.0"
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "production"
 *                 documentation:
 *                   type: string
 *                   example: "https://api.keepit.com/api-docs"
 *                 legal:
 *                   type: object
 *                   properties:
 *                     termsOfService:
 *                       type: string
 *                     privacyPolicy:
 *                       type: string
 *                     legalNotice:
 *                       type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                     notes:
 *                       type: string
 *                     webhooks:
 *                       type: string
 *                     apiKeys:
 *                       type: string
 *                     templates:
 *                       type: string
 *                     invitations:
 *                       type: string
 */
router.get("/", getHealthStatus);

export default router;