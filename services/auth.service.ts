import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { SECURITY_CONFIG } from "../constants";

export class AuthService {
  static async createUser(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    return await prisma.user.create({
      data: { email, password: hashed }
    });
  }

  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  static async validatePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async createRefreshToken(userId: number) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SECURITY_CONFIG.REFRESH_TOKEN_EXPIRATION_DAYS);

    // Supprimer les anciens refresh tokens pour cet utilisateur
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });
  }

  static async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });
  }

  static async deleteRefreshToken(token: string) {
    return await prisma.refreshToken.delete({ where: { token } });
  }

  static async isRefreshTokenValid(refreshToken: any) {
    return refreshToken && new Date() < new Date(refreshToken.expiresAt);
  }
}