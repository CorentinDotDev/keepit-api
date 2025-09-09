import prisma from "../prisma/client";
import { SECURITY_CONFIG } from "../constants";
import { logger } from "./logger";

const webhookCache = new Map<string, number>();

export async function triggerWebhook(
  userId: number,
  action: string,
  payload: any
) {
  const webhooks = await prisma.webhook.findMany({
    where: { userId, action },
  });

  for (const webhook of webhooks) {
    if (!webhook.url) continue;

    // Rate limiting simple par webhook
    const cacheKey = `${userId}-${webhook.url}`;
    const lastCall = webhookCache.get(cacheKey);
    const now = Date.now();

    if (lastCall && now - lastCall < SECURITY_CONFIG.WEBHOOK_RATE_LIMIT_MS) {
      logger.warn(`Webhook rate limited: ${webhook.url}`, { userId });
      continue;
    }

    webhookCache.set(cacheKey, now);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        SECURITY_CONFIG.WEBHOOK_TIMEOUT_MS
      ); // Timeout 5s
      logger.debug(`Triggering webhook: ${webhook.url}`);
      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (err) {
      logger.error(`Webhook failed for user ${userId}`, {
        error: err instanceof Error ? err.message : 'Unknown error',
        webhookUrl: webhook.url,
        userId
      });
    }
  }
}
