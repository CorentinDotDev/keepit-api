import prisma from "../prisma/client";
import bcrypt from "bcrypt";

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
}