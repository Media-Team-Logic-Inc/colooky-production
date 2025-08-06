import { Request, Response, NextFunction } from 'express';
import { SUBSCRIPTION_LIMITS } from '../services/subscription';

interface AuthRequest extends Request {
  user?: any;
}

export function requireSubscription(allowedTiers: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if subscription is active
    if (user.subscriptionStatus === 'expired') {
      return res.status(403).json({ 
        error: 'Trial expired. Please upgrade to continue.',
        upgradeUrl: '/pricing'
      });
    }

    if (user.subscriptionStatus === 'cancelled') {
      return res.status(403).json({ 
        error: 'Subscription cancelled. Please reactivate to continue.',
        upgradeUrl: '/pricing'
      });
    }

    // Check tier access
    if (!allowedTiers.includes(user.subscriptionTier)) {
      return res.status(403).json({
        error: 'Subscription upgrade required',
        requiredTier: allowedTiers[0],
        currentTier: user.subscriptionTier,
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
}

export function requireFeature(feature: keyof typeof SUBSCRIPTION_LIMITS[keyof typeof SUBSCRIPTION_LIMITS]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS];
    
    // Check specific feature based on subscription limits
    let hasFeature = false;
    switch (feature) {
      case 'customThemes':
        hasFeature = limits.customThemes;
        break;
      case 'prioritySupport':
        hasFeature = limits.prioritySupport;
        break;
      case 'apiAccess':
        hasFeature = limits.apiAccess;
        break;
      default:
        hasFeature = true; // Default features available to all
    }
    
    if (!hasFeature) {
      return res.status(403).json({
        error: `Feature '${feature}' not available in your current plan`,
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
}