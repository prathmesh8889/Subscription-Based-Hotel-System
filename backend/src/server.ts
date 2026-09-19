import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';

dotenv.config();

import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import billingRoutes from './routes/billing';
import reportsRoutes from './routes/reports';
import platformRoutes from './routes/platform';
import staffRoutes from './routes/staff';
import tableRoutes from './routes/tables';
import orderRoutes from './routes/orders';
import publicRoutes from './routes/public';
import { prisma, testDatabaseConnection } from './config/database';
import { initializeSocket } from './socket';
import { runProductionSmokeTests } from './smoke';

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT || 5000);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const origins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({
      success: true,
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'RestroFlow API',
    health: '/health',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/platform', platformRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' });
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await bcrypt.hash(password, 12);

  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_EMAIL belongs to a non-super-admin account');
    }

    const passwordMatches = await bcrypt.compare(password, existing.password);
    if (!passwordMatches || !existing.isActive) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log('✅ Super-admin credentials synchronized from Render environment');
    }
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      hotelId: null,
      isActive: true,
    },
  });

  console.log('✅ Initial super-admin account created');
}

async function startServer() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

  await testDatabaseConnection();
  await ensureSuperAdmin();
  initializeSocket(httpServer);

  httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ RestroFlow API listening on port ${PORT}`);

    if (process.env.RUN_SMOKE_TESTS === 'true') {
      try {
        await runProductionSmokeTests(PORT);
        console.log('✅ PRODUCTION_SMOKE_TEST PASSED: health + login + database + QR order + Socket.IO');
      } catch (error) {
        console.error('❌ PRODUCTION_SMOKE_TEST FAILED:', error);
        process.exit(1);
      }
    }
  });
}

async function shutdown() {
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

export default app;
