import { Request, Response } from "express";
import { WebhookService } from "../services/webhook.service";
import { isValidUrl } from "../utils/validation";
import { VALID_WEBHOOK_ACTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, BLOCKED_NETWORKS } from "../constants";

export async function getWebhooks(req: Request, res: Response) {
  const webhooks = await WebhookService.findWebhooksByUserId((req as any).user.id);
  res.json(webhooks);
}

export async function addWebhook(req: Request, res: Response) {
  const { action, url } = req.body;

  if (!action || !url) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.ACTION_URL_REQUIRED });
  }

  if (!VALID_WEBHOOK_ACTIONS.includes(action)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_ACTION });
  }

  if (!isValidUrl(url)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_URL });
  }

  // Vérifier que l'URL n'est pas une adresse interne
  if (BLOCKED_NETWORKS.some(network => url.includes(network))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INTERNAL_URL_FORBIDDEN });
  }

  try {
    const webhook = await WebhookService.createWebhook({
      action,
      url,
      userId: (req as any).user.id
    });
    res.json(webhook);
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.WEBHOOK_CREATION_ERROR });
  }
}

export async function deleteWebhook(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Vérifier que l'ID est un nombre valide
  const webhookId = Number(id);
  if (isNaN(webhookId)) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.WEBHOOK_NOT_FOUND });
  }

  try {
    const existingWebhook = await WebhookService.findWebhookById(webhookId);
    
    if (!existingWebhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.WEBHOOK_NOT_FOUND });
    }
    
    if (existingWebhook.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
    }

    await WebhookService.deleteWebhook(webhookId);
    res.json({ message: SUCCESS_MESSAGES.WEBHOOK_DELETED });
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.DELETE_ERROR });
  }
}
