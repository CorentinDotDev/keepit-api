import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants";
import { InstanceConfigManager } from "../config/instance.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const configManager = InstanceConfigManager.getInstance();

export async function getHealthStatus(req: Request, res: Response) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${req.get('host')}` 
    : `http://localhost:${process.env.PORT || 3000}`;

  const config = configManager.getConfig();

  res.status(HTTP_STATUS.OK).json({
    name: config.branding?.name || config.instanceName || "KeepIt Server",
    owner: config.adminContact?.name || "Unknown",
    ownerEmail: config.adminContact?.email || "",
    version: "1.1.0",
    status: "healthy",
    instanceId: config.instanceId,
    plan: config.plan,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    documentation: `${baseUrl}/api-docs`,
    instance: `${baseUrl}/instance`,
    legal: {
      termsOfService: `${baseUrl}/legal/terms`,
      privacyPolicy: `${baseUrl}/legal/privacy`,
      legalNotice: `${baseUrl}/legal/notice`
    },
    endpoints: {
      auth: `${baseUrl}/auth`,
      notes: `${baseUrl}/notes`,
      webhooks: config.features.webhooksEnabled ? `${baseUrl}/webhooks` : null,
      apiKeys: config.features.apiKeysEnabled ? `${baseUrl}/api-keys` : null,
      templates: config.features.templatesEnabled ? `${baseUrl}/templates` : null,
      sharing: config.features.sharingEnabled ? `${baseUrl}/share` : null
    },
    features: config.features,
    adminContact: config.adminContact
  });
}

export async function getInstanceInfo(_req: Request, res: Response) {
  try {
    const config = configManager.getConfig();
    
    // Get current usage stats
    const [userCount, noteCount, webhookCount, templateCount] = await Promise.all([
      prisma.user.count(),
      prisma.note.count({ where: { isTemplate: false } }), // Exclude templates from notes count
      prisma.webhook.count(),
      prisma.note.count({ where: { isTemplate: true } })
    ]);

    const currentUsage = {
      users: userCount,
      notes: noteCount,
      webhooks: webhookCount,
      templates: templateCount,
      // Simplified storage calculation
      estimatedStorageBytes: noteCount * 1024
    };

    res.status(HTTP_STATUS.OK).json({
      instanceId: config.instanceId,
      instanceName: config.instanceName,
      plan: config.plan,
      limits: config.limits,
      features: config.features,
      currentUsage,
      utilization: {
        users: config.limits.maxUsers === -1 ? 0 : (userCount / config.limits.maxUsers) * 100,
        notes: config.limits.maxNotes === -1 ? 0 : (noteCount / config.limits.maxNotes) * 100,
        webhooks: config.limits.maxWebhooks === -1 ? 0 : (webhookCount / config.limits.maxWebhooks) * 100,
        templates: config.limits.maxTemplates === -1 ? 0 : (templateCount / config.limits.maxTemplates) * 100,
        storage: config.limits.maxStorageBytes === -1 ? 0 : (currentUsage.estimatedStorageBytes / config.limits.maxStorageBytes) * 100
      },
      branding: config.branding,
      adminContact: config.adminContact,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Failed to retrieve instance information"
    });
  }
}