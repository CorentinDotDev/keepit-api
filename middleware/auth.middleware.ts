import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constants";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.MISSING_TOKEN });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET not configured");
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_CONFIG_ERROR });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
}
