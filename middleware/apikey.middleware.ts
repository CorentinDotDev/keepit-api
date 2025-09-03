import { Request, Response, NextFunction } from "express";
import { ApiKeyService, ApiKeyPermission } from "../services/apikey.service";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constants";

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: "Clé API manquante. Utilisez l'en-tête X-API-Key" 
    });
  }

  ApiKeyService.findApiKeyByKey(apiKey)
    .then(async (keyRecord) => {
      if (!keyRecord || !ApiKeyService.isApiKeyValid(keyRecord)) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          error: "Clé API invalide ou expirée" 
        });
      }

      await ApiKeyService.updateLastUsed(keyRecord.id);
      
      req.user = keyRecord.user;
      req.apiKey = {
        id: keyRecord.id,
        permissions: ApiKeyService.parsePermissions(keyRecord.permissions)
      };
      next();
    })
    .catch(() => {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        error: "Erreur lors de la vérification de la clé API" 
      });
    });
}

export function requirePermission(permission: ApiKeyPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiKey) {
      if (!req.apiKey.permissions.includes(permission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ 
          error: `Permission requise: ${permission}` 
        });
      }
    }
    next();
  };
}

export function authenticateJwtOrApiKey(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey) {
    return authenticateApiKey(req, res, next);
  } else if (token) {
    const jwt = require("jsonwebtoken");
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        error: ERROR_MESSAGES.SERVER_CONFIG_ERROR 
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };
      req.user = decoded;
      next();
    } catch {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERROR_MESSAGES.INVALID_TOKEN 
      });
    }
  } else {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: "Token JWT ou clé API requis" 
    });
  }
}