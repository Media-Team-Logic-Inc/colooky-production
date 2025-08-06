import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  githubCallback: z.object({
    body: z.object({
      code: z.string().min(1, 'Authorization code is required'),
      state: z.string().optional(),
    }),
  }),

  createCheckout: z.object({
    body: z.object({
      tier: z.enum(['individual', 'team', 'enterprise']),
      interval: z.enum(['monthly', 'yearly']).optional(),
      promoCode: z.string().optional(),
      affiliateCode: z.string().optional(),
    }),
  }),

  analyzeRepository: z.object({
    params: z.object({
      id: z.string().cuid(),
    }),
    body: z.object({
      branch: z.string().optional(),
      forceRefresh: z.boolean().optional(),
    }),
  }),
};