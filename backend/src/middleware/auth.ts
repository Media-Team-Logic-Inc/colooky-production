import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies['auth-token'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if trial has expired
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt && user.trialEndsAt < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'expired' }
      });
      user.subscriptionStatus = 'expired';
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}