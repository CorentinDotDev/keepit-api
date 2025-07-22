import { Request, Response } from "express";
import { WebhookService } from "../services/webhook.service";

export async function getWebhooks(req: Request, res: Response) {
  const webhooks = await WebhookService.findWebhooksByUserId((req as any).user.id);
  res.json(webhooks);
}

export async function addWebhook(req: Request, res: Response) {
  const { action, url } = req.body;
  const webhook = await WebhookService.createWebhook({
    action,
    url,
    userId: (req as any).user.id
  });
  res.json(webhook);
}
