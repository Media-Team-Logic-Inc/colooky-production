import { Request, Response, NextFunction } from 'express';

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', error);

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Resource already exists',
      details: error.meta
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Resource not found'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // GitHub API errors
  if (error.message?.includes('GitHub API')) {
    return res.status(503).json({
      error: 'GitHub service temporarily unavailable',
      details: error.message
    });
  }

  // Stripe errors
  if (error.type?.startsWith('Stripe')) {
    return res.status(402).json({
      error: 'Payment processing error',
      details: error.message
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    })
  });
}