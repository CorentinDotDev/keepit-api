import { Request, Response } from "express";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants";

export function getAuthenticatedUser(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
    return null;
  }
  return user;
}

export function requireAuth(req: Request, res: Response): req is Request & { user: NonNullable<Request['user']> } {
  return req.user !== undefined;
}