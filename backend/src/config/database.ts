// ============================================================
// DATABASE CONFIGURATION
// ============================================================
// Initializes Prisma client with connection pooling and logging
// ============================================================

import { PrismaClient } from '@prisma/client';

// ============================================================
// PRISMA CLIENT INITIALIZATION
// ============================================================
// In development, we enable logging for debugging
// In production, we disable logging for performance

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// In development, attach prisma to global to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================
// DATABASE CONNECTION TEST
// ============================================================
// Test database connection on startup

export async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
// Disconnect Prisma client on application shutdown

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}
