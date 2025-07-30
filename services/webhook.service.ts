import prisma from "../prisma/client";

export class WebhookService {
  static async findWebhooksByUserId(userId: number) {
    return await prisma.webhook.findMany({ where: { userId } });
  }

  static async findWebhookById(id: number) {
    return await prisma.webhook.findUnique({ where: { id } });
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

  static async deleteWebhook(id: number) {
    return await prisma.webhook.delete({ where: { id } });
  }
}