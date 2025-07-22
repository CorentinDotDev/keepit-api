import prisma from "../prisma/client";

export class WebhookService {
  static async findWebhooksByUserId(userId: number) {
    return await prisma.webhook.findMany({ where: { userId } });
  }

  static async createWebhook(webhookData: {
    action?: string;
    url?: string;
    userId: number;
  }) {
    return await prisma.webhook.create({
      data: webhookData
    });
  }
}