import prisma from "../prisma/client";

export async function triggerWebhook(userId: number, action: string, payload: any) {
  const webhooks = await prisma.webhook.findMany({
    where: { userId, action }
  });

  for (const webhook of webhooks) {
    if (!webhook.url) continue;
    
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(`Webhook failed: ${webhook.url}`, (err as Error).message);
    }
  }
}
