import prisma from "../prisma/client";
import { SECURITY_CONFIG } from "../constants";

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
      // Max 1 appel par seconde
      console.warn(`Webhook rate limited: ${webhook.url}`);
      continue;
    }

    webhookCache.set(cacheKey, now);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        SECURITY_CONFIG.WEBHOOK_TIMEOUT_MS
      ); // Timeout 5s
      if (SECURITY_CONFIG.ENABLE_WEBHOOK_LOGS) {
        console.log(`Triggering webhook: ${webhook.url}`);
      }
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
      if (err instanceof Error) {
        console.error(`Webhook failed for user ${userId}:`, err.message);
      }
    }
  }
}
