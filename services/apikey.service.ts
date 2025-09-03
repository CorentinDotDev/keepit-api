import prisma from "../prisma/client";
import crypto from "crypto";

export enum ApiKeyPermission {
  CREATE_NOTES = "create_notes",
  READ_NOTES = "read_notes", 
  UPDATE_NOTES = "update_notes",
  DELETE_NOTES = "delete_notes",
  SHARE_NOTES = "share_notes",
  READ_TEMPLATES = "read_templates",
  CREATE_TEMPLATES = "create_templates",
  UPDATE_TEMPLATES = "update_templates",
  DELETE_TEMPLATES = "delete_templates",
  USE_TEMPLATES = "use_templates"
}

export class ApiKeyService {
  static generateApiKey(): string {
    return 'ak_' + crypto.randomBytes(32).toString('hex');
  }

  static async createApiKey(userId: number, name: string, permissions: ApiKeyPermission[], expiresAt?: Date) {
    const key = this.generateApiKey();
    const permissionsStr = permissions.join(',');

    return await prisma.apiKey.create({
      data: {
        name,
        key,
        userId,
        permissions: permissionsStr,
        expiresAt
      }
    });
  }

  static async findApiKeyByKey(key: string) {
    return await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true }
    });
  }

  static async getUserApiKeys(userId: number) {
    return await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true
      }
    });
  }

  static async deleteApiKey(keyId: number, userId: number) {
    return await prisma.apiKey.delete({
      where: { 
        id: keyId,
        userId: userId
      }
    });
  }

  static async updateLastUsed(keyId: number) {
    return await prisma.apiKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() }
    });
  }

  static isApiKeyValid(apiKey: any): boolean {
    if (!apiKey) return false;
    if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) return false;
    return true;
  }

  static hasPermission(apiKey: any, permission: ApiKeyPermission): boolean {
    if (!apiKey || !apiKey.permissions) return false;
    const permissions = apiKey.permissions.split(',');
    return permissions.includes(permission);
  }

  static parsePermissions(permissionsStr: string): ApiKeyPermission[] {
    return permissionsStr.split(',').filter(p => 
      Object.values(ApiKeyPermission).includes(p as ApiKeyPermission)
    ) as ApiKeyPermission[];
  }
}