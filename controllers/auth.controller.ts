import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { isValidEmail, isValidPassword } from "../utils/validation";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, SECURITY_CONFIG } from "../constants";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED });
  }

  if (!isValidEmail(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
  }

  if (!isValidPassword(password)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.PASSWORD_TOO_SHORT });
  }

  try {
    await AuthService.createUser(email, password);
    res.json({ message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS });
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.EMAIL_ALREADY_USED });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED });
  }
  
  const user = await AuthService.findUserByEmail(email);
  if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });

  const valid = await AuthService.validatePassword(password, user.password);
  if (!valid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_PASSWORD });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET not configured");
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_CONFIG_ERROR });
  }

  try {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email }, 
      jwtSecret, 
      { expiresIn: SECURITY_CONFIG.JWT_EXPIRATION }
    );
    
    const refreshToken = await AuthService.createRefreshToken(user.id);
    
    res.json({ 
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: SECURITY_CONFIG.JWT_EXPIRATION
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_CONFIG_ERROR });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED });
  }

  try {
    const tokenRecord = await AuthService.findRefreshToken(refreshToken);
    
    if (!tokenRecord || !AuthService.isRefreshTokenValid(tokenRecord)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_REFRESH_TOKEN });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not configured");
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_CONFIG_ERROR });
    }

    // Créer un nouveau access token
    const accessToken = jwt.sign(
      { id: tokenRecord!.user.id, email: tokenRecord!.user.email }, 
      jwtSecret, 
      { expiresIn: SECURITY_CONFIG.JWT_EXPIRATION }
    );

    // Créer un nouveau refresh token
    const newRefreshToken = await AuthService.createRefreshToken(tokenRecord!.user.id);

    res.json({ 
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: SECURITY_CONFIG.JWT_EXPIRATION
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.INVALID_REFRESH_TOKEN });
  }
}

export async function verifyAuth(req: Request, res: Response) {
  try {
    const user = req.user;
    res.json({ 
      valid: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
}
