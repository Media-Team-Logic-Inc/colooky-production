import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import repositoryRoutes from './routes/repositories.js';
import subscriptionRoutes from './routes/subscriptions.js';
import webhookRoutes from './routes/webhooks.js';
import analysisRoutes from './routes/analysis.js';
import demoRoutes from './routes/demo.js';

// Import middleware
import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimit.js';

// Import database
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:3002', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  // Railway direct URLs (backup)
  'https://colooky-frontend-production-production.up.railway.app',
  // Production custom domains
  'https://colooky.com',
  'https://www.colooky.com',
  // Environment variable override
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

// Debug CORS origins
console.log('🔧 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

// Health check endpoints (Railway checks these)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Colooky API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', authenticateUser, repositoryRoutes);
app.use('/api/subscriptions', authenticateUser, subscriptionRoutes);
app.use('/api/analysis', authenticateUser, analysisRoutes);
app.use('/api/webhooks', webhookRoutes); // No auth for webhooks
app.use('/api/demo', demoRoutes); // Public demo endpoints

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 PORT:', process.env.PORT);
    console.log('🔧 DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('🔧 REDIS_URL present:', !!process.env.REDIS_URL);
    
    console.log('📊 Initializing database...');
    await initDatabase();
    
    // Initialize Redis (optional - continue without it if it fails)
    console.log('📊 Initializing Redis...');
    try {
      await initRedis();
    } catch (redisError) {
      console.log('⚠️ Redis not available - continuing without cache');
    }
    
    console.log('📊 Starting HTTP server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Colooky API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log('✅ Server startup completed successfully');
    });
    
    // Keep the process alive
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Handle process events
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('📊 SIGTERM received - shutting down gracefully');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📊 SIGINT received - shutting down gracefully');
  await cleanup();
  process.exit(0);
});

// Cleanup function
async function cleanup() {
  try {
    const { prisma } = await import('./config/database.js');
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

startServer();