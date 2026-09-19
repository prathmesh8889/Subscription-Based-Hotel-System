import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super-admin already exists; no seed changes needed.');
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      hotelId: null,
      isActive: true,
    },
  });

  console.log('Super-admin created securely from environment variables.');
}

main()
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
