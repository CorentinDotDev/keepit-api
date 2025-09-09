import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger.config";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import noteRoutes from "./routes/note.routes";
import webhookRoutes from "./routes/webhook.routes";
import apiKeyRoutes from "./routes/apikey.routes";
import templateRoutes from "./routes/template.routes";
import invitationRoutes from "./routes/invitation.routes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Notes API Documentation",
}));

app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/templates", templateRoutes);
app.use("/invitations", invitationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API Notes",
    documentation: "http://localhost:3000/api-docs"
  });
});

// Middleware de gestion d'erreurs (doit être en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  logger.info("API Notes lancée sur http://localhost:3000");
  logger.info("Documentation Swagger disponible sur http://localhost:3000/api-docs");
});
