import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message, stack } = err;
  
  // Log de l'erreur avec contexte
  logger.error(`${req.method} ${req.path}`, {
    statusCode,
    message,
    stack: process.env.NODE_ENV !== 'production' ? stack : undefined,
    userId: (req as any).user?.id,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });

  // Réponse selon l'environnement
  const response: any = {
    error: statusCode >= 500 ? ERROR_MESSAGES.SERVER_CONFIG_ERROR : message
  };

  // En développement, inclure plus d'infos
  if (process.env.NODE_ENV !== 'production') {
    response.stack = stack;
    response.path = req.path;
  }

  res.status(statusCode).json(response);
}

// Wrapper pour les fonctions async
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware pour capturer les erreurs non gérées
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const err = new ApiError(`Route ${req.originalUrl} non trouvée`, HTTP_STATUS.NOT_FOUND);
  next(err);
}

// Gestionnaire global d'erreurs non catchées
process.on('uncaughtException', (err: Error) => {
  console.error('Erreur non catchée détaillée:', err);
  logger.error('Erreur non catchée', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Promesse rejetée non gérée', reason);
  process.exit(1);
});