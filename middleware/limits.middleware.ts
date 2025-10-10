import { Request, Response, NextFunction } from "express";
import { InstanceConfigManager } from "../config/instance.config";
import { ApiError } from "./error.middleware";
import { HTTP_STATUS } from "../constants";
import prisma from "../prisma/client";

const configManager = InstanceConfigManager.getInstance();

// Rate limiting store (in production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function rateLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const config = configManager.getConfig();
    
    // Skip rate limiting if unlimited
    if (configManager.isUnlimited('rateLimitRequests')) {
      return next();
    }

    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = config.limits.rateLimitWindow;
    const maxRequests = config.limits.rateLimitRequests;

    // Clean up old entries
    if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }

    // Initialize or increment counter
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count++;
    }

    // Check if limit exceeded
    if (rateLimitStore[key].count > maxRequests) {
      const resetTimeSeconds = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTimeSeconds.toString()
      });
      
      throw new ApiError(`Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - rateLimitStore[key].count);
    const resetTimeSeconds = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTimeSeconds.toString()
    });

    next();
  };
}

export function checkFeatureEnabled(feature: 'webhooksEnabled' | 'templatesEnabled' | 'sharingEnabled' | 'apiKeysEnabled' | 'customBrandingEnabled' | 'advancedFeaturesEnabled') {
  return (_req: Request, _res: Response, next: NextFunction) => {
    if (!configManager.isFeatureEnabled(feature)) {
      throw new ApiError(`Feature '${feature}' is not enabled for this instance`, HTTP_STATUS.FAILED_DEPENDENCY);
    }
    next();
  };
}

export function checkUserLimit() {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      if (configManager.isUnlimited('maxUsers')) {
        return next();
      }

      const userCount = await prisma.user.count();
      const maxUsers = configManager.getLimits().maxUsers;

      if (userCount >= maxUsers) {
        throw new ApiError(`Maximum number of users (${maxUsers}) reached for this instance`, HTTP_STATUS.LOCKED);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkNotesLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const limits = configManager.getLimits();

      // Check total notes limit (only if not unlimited) - exclude templates
      if (!configManager.isUnlimited('maxNotes')) {
        const totalNotes = await prisma.note.count({
          where: { isTemplate: false }
        });
        if (totalNotes >= limits.maxNotes) {
          throw new ApiError(`Maximum number of notes (${limits.maxNotes}) reached for this instance`, HTTP_STATUS.LOCKED);
        }
      }

      // Check per-user notes limit (independent of global limit) - exclude templates
      if (!configManager.isUnlimited('maxNotesPerUser')) {
        const userNotes = await prisma.note.count({
          where: { 
            userId: user.id,
            isTemplate: false
          }
        });
        
        console.log(`🔍 DEBUG: User ${user.id} has ${userNotes} notes, limit is ${limits.maxNotesPerUser}`);
        
        if (userNotes >= limits.maxNotesPerUser) {
          console.log(`🚫 BLOCKING: User ${user.id} exceeded per-user limit`);
          throw new ApiError(`Maximum number of notes per user (${limits.maxNotesPerUser}) reached`, HTTP_STATUS.LOCKED);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkWebhooksLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const limits = configManager.getLimits();

      // Check total webhooks limit (only if not unlimited)
      if (!configManager.isUnlimited('maxWebhooks')) {
        const totalWebhooks = await prisma.webhook.count();
        if (totalWebhooks >= limits.maxWebhooks) {
          throw new ApiError(`Maximum number of webhooks (${limits.maxWebhooks}) reached for this instance`, HTTP_STATUS.LOCKED);
        }
      }

      // Check per-user webhooks limit (independent of global limit)
      if (!configManager.isUnlimited('maxWebhooksPerUser')) {
        const userWebhooks = await prisma.webhook.count({
          where: { userId: user.id }
        });
        
        if (userWebhooks >= limits.maxWebhooksPerUser) {
          throw new ApiError(`Maximum number of webhooks per user (${limits.maxWebhooksPerUser}) reached`, HTTP_STATUS.LOCKED);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkTemplatesLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const limits = configManager.getLimits();

      // Check total templates limit (only if not unlimited)
      if (!configManager.isUnlimited('maxTemplates')) {
        const totalTemplates = await prisma.note.count({
          where: { isTemplate: true }
        });
        if (totalTemplates >= limits.maxTemplates) {
          throw new ApiError(`Maximum number of templates (${limits.maxTemplates}) reached for this instance`, HTTP_STATUS.LOCKED);
        }
      }

      // Check per-user templates limit (independent of global limit)
      if (!configManager.isUnlimited('maxTemplatesPerUser')) {
        const userTemplates = await prisma.note.count({
          where: { 
            userId: user.id,
            isTemplate: true 
          }
        });
        
        if (userTemplates >= limits.maxTemplatesPerUser) {
          throw new ApiError(`Maximum number of templates per user (${limits.maxTemplatesPerUser}) reached`, HTTP_STATUS.LOCKED);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkApiKeysLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const limits = configManager.getLimits();

      // Check total API keys limit (only if not unlimited)
      if (!configManager.isUnlimited('maxApiKeys')) {
        const totalApiKeys = await prisma.apiKey.count();
        if (totalApiKeys >= limits.maxApiKeys) {
          throw new ApiError(`Maximum number of API keys (${limits.maxApiKeys}) reached for this instance`, HTTP_STATUS.LOCKED);
        }
      }

      // Check per-user API keys limit (independent of global limit)
      if (!configManager.isUnlimited('maxApiKeysPerUser')) {
        const userApiKeys = await prisma.apiKey.count({
          where: { userId: user.id }
        });
        
        if (userApiKeys >= limits.maxApiKeysPerUser) {
          throw new ApiError(`Maximum number of API keys per user (${limits.maxApiKeysPerUser}) reached`, HTTP_STATUS.LOCKED);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkStorageLimit() {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      if (configManager.isUnlimited('maxStorageBytes')) {
        return next();
      }

      // This is a simplified check - in reality you'd track actual storage usage
      // Exclude templates from storage calculation
      const totalNotes = await prisma.note.count({
        where: { isTemplate: false }
      });
      const avgNoteSize = 1024; // 1KB average per note (simplified)
      const estimatedStorage = totalNotes * avgNoteSize;
      
      const maxStorage = configManager.getLimits().maxStorageBytes;
      if (estimatedStorage >= maxStorage) {
        throw new ApiError(`Storage limit (${Math.round(maxStorage / 1024 / 1024)}MB) reached`, HTTP_STATUS.LOCKED);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}