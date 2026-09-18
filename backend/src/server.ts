// ============================================================
// EXPRESS SERVER
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import platformRoutes from './routes/platform';
import staffRoutes from './routes/staff';

// Import database
import { testDatabaseConnection } from './config/database';

// Import admin security middleware
import { 
  ipWhitelist, 
  adminLoginRateLimit, 
  adminAccessLogger, 
  honeypotDetection,
  adminSessionSecurity 
} from './middleware/adminSecurity';

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - Security headers
app.use(helmet());

// CORS - Cross-origin resource sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

app.use('/api/', apiLimiter);

// ============================================================
// ROUTES
// ============================================================

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

// Admin routes with enhanced security
app.use('/api/platform', 
  honeypotDetection,        // Detect suspicious probes
  ipWhitelist,              // IP whitelist (if configured)
  adminAccessLogger,        // Log all admin access
  adminSessionSecurity,     // Additional session security
  platformRoutes
);

// Staff routes
app.use('/api/staff', staffRoutes);

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

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 RestroFlow Backend Server                           ║
║                                                           ║
║   📍 Port: ${PORT}                                        ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                   ║
║   🔗 API: http://localhost:${PORT}/api                    ║
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
