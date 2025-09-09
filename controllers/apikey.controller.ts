import { Request, Response } from "express";
import { ApiKeyService, ApiKeyPermission } from "../services/apikey.service";
import { HTTP_STATUS } from "../constants";
import { sanitizeName } from "../utils/validation";

export async function createApiKey(req: Request, res: Response) {
  try {
    const { name, permissions, expiresAt } = req.body;
    const userId = req.user.id;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Nom et permissions requis" 
      });
    }

    const validPermissions = permissions.filter(p => 
      Object.values(ApiKeyPermission).includes(p)
    );

    if (validPermissions.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "Au moins une permission valide est requise" 
      });
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
    
    if (expirationDate && expirationDate <= new Date()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "La date d'expiration doit être dans le futur" 
      });
    }

    const apiKey = await ApiKeyService.createApiKey(
      userId, 
      sanitizeName(name), 
      validPermissions, 
      expirationDate
    );

    res.status(HTTP_STATUS.CREATED).json({
      message: "Clé API créée avec succès",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        permissions: ApiKeyService.parsePermissions(apiKey.permissions),
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error("Erreur lors de la création de la clé API:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la création de la clé API" 
    });
  }
}

export async function getApiKeys(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const apiKeys = await ApiKeyService.getUserApiKeys(userId);

    const formattedApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: key.key.substring(0, 12) + "...",
      permissions: ApiKeyService.parsePermissions(key.permissions),
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt
    }));

    res.json({ apiKeys: formattedApiKeys });
  } catch (error) {
    console.error("Erreur lors de la récupération des clés API:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la récupération des clés API" 
    });
  }
}

export async function deleteApiKey(req: Request, res: Response) {
  try {
    const { keyId } = req.params;
    const userId = req.user.id;

    if (!keyId || isNaN(Number(keyId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: "ID de clé invalide" 
      });
    }

    await ApiKeyService.deleteApiKey(Number(keyId), userId);
    
    res.json({ message: "Clé API supprimée avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la clé API:", error);
    if (error.code === 'P2025') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: "Clé API non trouvée" 
      });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: "Erreur lors de la suppression de la clé API" 
    });
  }
}

export async function getAvailablePermissions(req: Request, res: Response) {
  const permissions = Object.values(ApiKeyPermission).map(permission => ({
    key: permission,
    label: getPermissionLabel(permission)
  }));
  
  res.json({ permissions });
}

function getPermissionLabel(permission: ApiKeyPermission): string {
  switch (permission) {
    case ApiKeyPermission.CREATE_NOTES:
      return "Créer des notes";
    case ApiKeyPermission.READ_NOTES:
      return "Lire les notes";
    case ApiKeyPermission.UPDATE_NOTES:
      return "Modifier les notes";
    case ApiKeyPermission.DELETE_NOTES:
      return "Supprimer les notes";
    case ApiKeyPermission.SHARE_NOTES:
      return "Partager les notes";
    case ApiKeyPermission.READ_TEMPLATES:
      return "Lire les templates";
    case ApiKeyPermission.CREATE_TEMPLATES:
      return "Créer des templates";
    case ApiKeyPermission.UPDATE_TEMPLATES:
      return "Modifier les templates";
    case ApiKeyPermission.DELETE_TEMPLATES:
      return "Supprimer les templates";
    case ApiKeyPermission.USE_TEMPLATES:
      return "Utiliser les templates";
    default:
      return permission;
  }
}