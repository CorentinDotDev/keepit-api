/// <reference path="./global.d.ts" />
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger.config";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { rateLimitMiddleware } from "./middleware/limits.middleware";

import authRoutes from "./routes/auth.routes";
import noteRoutes from "./routes/note.routes";
import webhookRoutes from "./routes/webhook.routes";
import apiKeyRoutes from "./routes/apikey.routes";
import templateRoutes from "./routes/template.routes";
import invitationRoutes from "./routes/invitation.routes";
import healthRoutes from "./routes/health.routes";
import { getInstanceInfo } from "./controllers/health.controller";
import { InstanceConfigManager } from "./config/instance.config";

dotenv.config();
console.log("✅ Environment loaded");

const app = express();
console.log("✅ Express app created");

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(cors());
app.use(express.json());

// Apply rate limiting
app.use(rateLimitMiddleware());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Notes API Documentation",
  })
);

app.use("/health", healthRoutes);
app.get("/instance", getInstanceInfo);
app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/templates", templateRoutes);
app.use("/invitations", invitationRoutes);

app.get("/", (req, res) => {
  const baseUrl =
    NODE_ENV === "production"
      ? `https://${req.get("host")}`
      : `http://localhost:${PORT}`;

  const configManager = InstanceConfigManager.getInstance();
  const config = configManager.getConfig();

  res.json({
    message: "Bienvenue sur KeepIt API",
    name: config.branding?.name || config.instanceName || "KeepIt Server",
    version: "1.1.0",
    owner: config.adminContact?.name || "Unknown",
    ownerEmail: config.adminContact?.email || "",
    documentation: `${baseUrl}/api-docs`,
    health: `${baseUrl}/health`,
    environment: NODE_ENV,
  });
});

// Middleware de gestion d'erreurs (doit être en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Notes lancée sur http://localhost:${PORT}`);
  console.log(
    `Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`
  );
  console.log(`Environnement: ${NODE_ENV}`);
});
