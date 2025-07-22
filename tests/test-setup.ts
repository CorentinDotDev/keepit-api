import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  try {
    await prisma.checkbox.deleteMany();
    await prisma.note.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.warn('Error cleaning database in afterAll:', error);
  }
  await prisma.$disconnect();
});