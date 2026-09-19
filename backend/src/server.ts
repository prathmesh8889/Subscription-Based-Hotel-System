// ============================================================
// EXPRESS SERVER - Production Ready
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import billingRoutes from './routes/billing';
import reportsRoutes from './routes/reports';

// Import database config
import { testDatabaseConnection } from './config/database';

// Import middleware
import { 
  honeypotDetection, 
  ipWhitelist, 
  adminAccessLogger, 
  adminSessionSecurity 
} from './middleware/adminSecurity';

// Import Socket.io
import { initializeSocket } from './socket';

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);

// Admin routes with enhanced security
app.use('/api/platform', 
  honeypotDetection,
  ipWhitelist,
  adminAccessLogger,
  adminSessionSecurity,
  authRoutes // Placeholder - will add platform routes later
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start server
async function startServer() {
  try {
    await testDatabaseConnection();

    // Initialize Socket.io
    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 RestroFlow Backend Server                           ║
║                                                           ║
║   📍 Port: ${PORT}                                        ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                   ║
║   🔗 API: http://localhost:${PORT}/api                    ║
║   🔌 Socket.io: ws://localhost:${PORT}                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
