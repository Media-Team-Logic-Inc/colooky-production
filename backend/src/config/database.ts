import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Debug: Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  console.error('Available env vars starting with DB:', Object.keys(process.env).filter(key => key.startsWith('DB')));
  process.exit(1);
}

console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function initDatabase() {
  try {
    console.log('📊 Attempting Prisma connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log('📊 Testing database with simple query...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful');
    
    // Run any pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      // Note: In production, you should run migrations separately
      // This is just for development convenience
      console.log('📊 Production mode - skipping migrations');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('❌ Database error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export { prisma };