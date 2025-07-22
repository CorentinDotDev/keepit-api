import express from "express";
import cors from "cors";
import authRoutes from "../routes/auth.routes";
import noteRoutes from "../routes/note.routes";
import webhookRoutes from "../routes/webhook.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);
app.use("/webhooks", webhookRoutes);

export default app;