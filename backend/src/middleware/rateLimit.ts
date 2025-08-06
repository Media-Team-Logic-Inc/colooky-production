import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(Date.now() / 1000) + 900 // 15 minutes from now
    });
  }
});

// Auth specific rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

// Analysis rate limiting (more restrictive)
export const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 analysis requests per minute
  message: {
    error: 'Analysis rate limit exceeded, please wait before requesting another analysis.'
  },
});

// Webhook rate limiting (less restrictive)
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  skip: (req) => {
    // Skip rate limiting for verified webhook sources
    const userAgent = req.get('User-Agent') || '';
    return userAgent.includes('Stripe') || userAgent.includes('GitHub');
  }
});