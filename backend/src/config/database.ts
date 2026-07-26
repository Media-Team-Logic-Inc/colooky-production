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
    await prisma.$connect();
  } catch (error) {
    console.error('Database connection failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export { prisma };