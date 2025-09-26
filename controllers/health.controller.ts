import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants";

export async function getHealthStatus(req: Request, res: Response) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${req.get('host')}` 
    : `http://localhost:${process.env.PORT || 3000}`;

  res.status(HTTP_STATUS.OK).json({
    name: "KeepIt Server",
    version: "1.1.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    documentation: `${baseUrl}/api-docs`,
    legal: {
      termsOfService: `${baseUrl}/legal/terms`,
      privacyPolicy: `${baseUrl}/legal/privacy`,
      legalNotice: `${baseUrl}/legal/notice`
    },
    endpoints: {
      auth: `${baseUrl}/auth`,
      notes: `${baseUrl}/notes`,
      webhooks: `${baseUrl}/webhooks`,
      apiKeys: `${baseUrl}/api-keys`,
      templates: `${baseUrl}/templates`,
      invitations: `${baseUrl}/invitations`
    }
  });
}