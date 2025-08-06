import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import repositoryRoutes from './routes/repositories';
import subscriptionRoutes from './routes/subscriptions';
import webhookRoutes from './routes/webhooks';
import analysisRoutes from './routes/analysis';

// Import middleware
import { authenticateUser } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';

// Import database
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', authenticateUser, repositoryRoutes);
app.use('/api/subscriptions', authenticateUser, subscriptionRoutes);
app.use('/api/analysis', authenticateUser, analysisRoutes);
app.use('/api/webhooks', webhookRoutes); // No auth for webhooks

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    
    // Initialize Redis (optional - continue without it if it fails)
    try {
      await initRedis();
    } catch (redisError) {
      console.log('⚠️ Redis not available - continuing without cache');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Colooky API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();