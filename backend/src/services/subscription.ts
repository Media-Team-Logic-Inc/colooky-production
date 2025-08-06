import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export enum SubscriptionTier {
  TRIAL = 'TRIAL',
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE',
}

export interface SubscriptionLimits {
  repositoriesPerMonth: number;
  filesPerRepository: number;
  analysisRetentionDays: number;
  exportFormats: string[];
  prioritySupport: boolean;
  customThemes: boolean;
  apiAccess: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.TRIAL]: {
    repositoriesPerMonth: 3,
    filesPerRepository: 50,
    analysisRetentionDays: 14,
    exportFormats: ['PNG'],
    prioritySupport: false,
    customThemes: false,
    apiAccess: false,
  },
  [SubscriptionTier.INDIVIDUAL]: {
    repositoriesPerMonth: -1, // Unlimited repositories
    filesPerRepository: 500,
    analysisRetentionDays: 90,
    exportFormats: ['PNG', 'SVG', 'PDF'],
    prioritySupport: false,
    customThemes: true,
    apiAccess: false,
  },
  [SubscriptionTier.TEAM]: {
    repositoriesPerMonth: -1, // Unlimited
    filesPerRepository: 2000,
    analysisRetentionDays: 180,
    exportFormats: ['PNG', 'SVG', 'PDF', 'JSON'],
    prioritySupport: true,
    customThemes: true,
    apiAccess: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    repositoriesPerMonth: -1, // Unlimited
    filesPerRepository: -1, // Unlimited
    analysisRetentionDays: 365,
    exportFormats: ['PNG', 'SVG', 'PDF', 'JSON', 'MERMAID'],
    prioritySupport: true,
    customThemes: true,
    apiAccess: true,
  },
};

export class SubscriptionService {
  async getUserSubscription(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        include: {
          user: true,
        },
      });

      if (!subscription) {
        // Return default trial subscription
        return {
          tier: SubscriptionTier.TRIAL,
          status: 'active',
          limits: SUBSCRIPTION_LIMITS[SubscriptionTier.TRIAL],
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
        };
      }

      return {
        tier: subscription.tier as SubscriptionTier,
        status: subscription.status,
        limits: SUBSCRIPTION_LIMITS[subscription.tier as SubscriptionTier],
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    stripeSubscriptionId?: string,
    customerId?: string
  ) {
    try {
      const amount = this.getPriceForTier(tier);
      return await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: 'active',
          amount,
          currency: 'usd',
          interval: 'month',
          stripeSubscriptionId,
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.calculatePeriodEnd(tier),
        },
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(
    userId: string,
    updates: {
      tier?: SubscriptionTier;
      status?: string;
      currentPeriodEnd?: Date;
      stripeSubscriptionId?: string;
    }
  ) {
    try {
      return await prisma.subscription.updateMany({
        where: { userId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async cancelSubscription(userId: string) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (subscription.stripeSubscriptionId) {
        // Cancel in Stripe
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return await this.updateSubscription(userId, {
        status: 'canceled',
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async checkSubscriptionLimits(userId: string, action: string, metadata?: any): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const limits = subscription.limits;

      switch (action) {
        case 'analyze_repository':
          return await this.checkRepositoryLimit(userId, limits.repositoriesPerMonth);
        
        case 'process_files':
          const fileCount = metadata?.fileCount || 0;
          return limits.filesPerRepository === -1 || fileCount <= limits.filesPerRepository;
        
        case 'export_format':
          const format = metadata?.format;
          return limits.exportFormats.includes(format);
        
        case 'api_access':
          return limits.apiAccess;
        
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      return false;
    }
  }

  private async checkRepositoryLimit(userId: string, monthlyLimit: number): Promise<boolean> {
    if (monthlyLimit === -1) return true; // Unlimited

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const analysisCount = await prisma.analysisResult.count({
      where: {
        repository: {
          userId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return analysisCount < monthlyLimit;
  }

  async getUsageStats(userId: string) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [repositoriesAnalyzed, totalAnalyses, subscription] = await Promise.all([
        prisma.analysisResult.count({
          where: {
            repository: {
              userId,
            },
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
        prisma.analysisResult.count({
          where: {
            repository: {
              userId,
            },
          },
        }),
        this.getUserSubscription(userId),
      ]);

      return {
        currentMonth: {
          repositoriesAnalyzed,
          limit: subscription.limits.repositoriesPerMonth,
        },
        total: {
          repositoriesAnalyzed: totalAnalyses,
        },
        tier: subscription.tier,
        limits: subscription.limits,
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw new Error('Failed to fetch usage statistics');
    }
  }

  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const priceId = this.getPriceIdForTier(tier);
      
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          tier,
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { userId, tier } = session.metadata!;
    
    if (session.subscription) {
      await this.createSubscription(
        userId,
        tier as SubscriptionTier,
        session.subscription as string,
        session.customer as string
      );
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );
      
      // Update subscription period
      const userId = await this.getUserIdFromStripeSubscription(subscription.id);
      if (userId) {
        await this.updateSubscription(userId, {
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: 'active',
        });
      }
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = await this.getUserIdFromStripeSubscription(subscription.id);
    if (userId) {
      await this.updateSubscription(userId, {
        status: 'canceled',
        tier: SubscriptionTier.TRIAL,
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = await this.getUserIdFromStripeSubscription(subscription.id);
    if (userId) {
      await this.updateSubscription(userId, {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
    }
  }

  private async getUserIdFromStripeSubscription(stripeSubscriptionId: string): Promise<string | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
    return subscription?.userId || null;
  }

  private getPriceForTier(tier: SubscriptionTier): number {
    const prices = {
      [SubscriptionTier.TRIAL]: 0,
      [SubscriptionTier.INDIVIDUAL]: 1900, // $19.00 in cents
      [SubscriptionTier.TEAM]: 4900, // $49.00 in cents  
      [SubscriptionTier.ENTERPRISE]: 19900, // $199.00 in cents
    };
    
    return prices[tier];
  }

  private getPriceIdForTier(tier: SubscriptionTier): string {
    const priceIds: Record<SubscriptionTier, string> = {
      [SubscriptionTier.TRIAL]: '', // Trial has no price ID
      [SubscriptionTier.INDIVIDUAL]: process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID!,
      [SubscriptionTier.TEAM]: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
      [SubscriptionTier.ENTERPRISE]: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    };
    
    return priceIds[tier];
  }

  private calculatePeriodEnd(tier: SubscriptionTier): Date {
    const now = new Date();
    if (tier === SubscriptionTier.TRIAL) {
      return new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days from now
    }
    
    // Monthly subscription
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  static async initializeUsageTracking(userId: string): Promise<void> {
    try {
      // Create initial usage tracking records for the current month
      const periodMonth = new Date();
      periodMonth.setDate(1);
      periodMonth.setHours(0, 0, 0, 0);

      const resourceTypes = ['analyses', 'exports', 'api_calls', 'visualizations'];

      await Promise.all(
        resourceTypes.map(resourceType =>
          prisma.usageTracking.upsert({
            where: {
              userId_organizationId_resourceType_periodMonth: {
                userId,
                organizationId: null,
                resourceType,
                periodMonth,
              },
            },
            update: {},
            create: {
              userId,
              organizationId: null,
              resourceType,
              resourceCount: 0,
              periodMonth,
              metadata: {},
            },
          })
        )
      );
    } catch (error) {
      console.error('Error initializing usage tracking:', error);
      // Don't throw - this is not critical for user creation
    }
  }
}