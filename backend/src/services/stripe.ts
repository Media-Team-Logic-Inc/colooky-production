// src/services/stripe.ts - Enhanced Stripe Service with Promo Codes
import Stripe from 'stripe';
import { prisma } from '../config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const STRIPE_PRICE_IDS = {
  individual_monthly: process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID!,
  individual_yearly: process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID!,
  team_monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
  team_yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
  enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
  enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
};

export const PRICING_PLANS = {
  individual: {
    monthly: { amount: 1900, interval: 'month' }, // $19/month
    yearly: { amount: 19000, interval: 'year' },  // $190/year (2 months free)
  },
  team: {
    monthly: { amount: 4900, interval: 'month' }, // $49/month
    yearly: { amount: 49000, interval: 'year' },  // $490/year (2 months free)
  },
  enterprise: {
    monthly: { amount: 19900, interval: 'month' }, // $199/month
    yearly: { amount: 199000, interval: 'year' },  // $1990/year (2 months free)
  }
};

export class StripeService {
  // ===================================
  // PROMO CODE MANAGEMENT
  // ===================================

  static async validatePromoCode(code: string, userId: string, tier: string, interval: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: { userId }
        }
      }
    });

    if (!promoCode) {
      throw new Error('Invalid promo code');
    }

    // Check if promo code is active
    if (!promoCode.isActive) {
      throw new Error('Promo code is no longer active');
    }

    // Check validity period
    const now = new Date();
    if (promoCode.validFrom > now) {
      throw new Error('Promo code is not yet valid');
    }
    if (promoCode.validUntil && promoCode.validUntil < now) {
      throw new Error('Promo code has expired');
    }

    // Check usage limits
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      throw new Error('Promo code usage limit exceeded');
    }

    // Check per-customer usage limit
    if (promoCode.maxUsesPerCustomer && promoCode.usages.length >= promoCode.maxUsesPerCustomer) {
      throw new Error('You have already used this promo code');
    }

    // Check if applicable to selected tier
    if (promoCode.applicableTiers.length > 0 && !promoCode.applicableTiers.includes(tier)) {
      throw new Error(`Promo code is not applicable to ${tier} plan`);
    }

    // Check if for new customers only
    if (promoCode.newCustomersOnly) {
      const existingSubscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'cancelled'] } }
      });
      if (existingSubscription) {
        throw new Error('Promo code is only for new customers');
      }
    }

    // Calculate discount
    const originalAmount = PRICING_PLANS[tier as keyof typeof PRICING_PLANS][interval as 'monthly' | 'yearly'].amount;
    
    // Check minimum amount requirement
    if (promoCode.minimumAmount && originalAmount < promoCode.minimumAmount) {
      throw new Error(`Minimum order amount is $${promoCode.minimumAmount / 100}`);
    }

    let discountAmount = 0;
    let finalAmount = originalAmount;

    if (promoCode.discountType === 'percentage') {
      discountAmount = Math.round(originalAmount * (promoCode.discountValue / 100));
      finalAmount = originalAmount - discountAmount;
    } else if (promoCode.discountType === 'fixed_amount') {
      discountAmount = Math.min(promoCode.discountValue, originalAmount);
      finalAmount = originalAmount - discountAmount;
    } else if (promoCode.discountType === 'free_trial') {
      // Free trial - no immediate charge
      finalAmount = 0;
      discountAmount = originalAmount;
    }

    return {
      valid: true,
      promoCode,
      originalAmount,
      discountAmount,
      finalAmount,
      discountPercent: Math.round((discountAmount / originalAmount) * 100)
    };
  }

  static async createPromoCode(data: {
    code: string;
    name?: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_trial';
    discountValue: number;
    maxUses?: number;
    maxUsesPerCustomer?: number;
    validUntil?: Date;
    applicableTiers?: string[];
    newCustomersOnly?: boolean;
    minimumAmount?: number;
    affiliateId?: string;
    affiliateCommission?: number;
  }) {
    return await prisma.promoCode.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        currency: 'usd',
        isActive: true,
      }
    });
  }

  // ===================================
  // CHECKOUT SESSION CREATION
  // ===================================

  static async createCheckoutSession({
    userId,
    tier,
    interval = 'monthly',
    promoCode,
    successUrl,
    cancelUrl,
    organizationId,
    affiliateCode
  }: {
    userId: string;
    tier: string;
    interval?: 'monthly' | 'yearly';
    promoCode?: string;
    successUrl: string;
    cancelUrl: string;
    organizationId?: string;
    affiliateCode?: string;
  }) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { email: true, stripeCustomerId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
          source: 'colooky'
        }
      });
      
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    // Get price ID
    const priceKey = `${tier}_${interval}` as keyof typeof STRIPE_PRICE_IDS;
    const priceId = STRIPE_PRICE_IDS[priceKey];
    
    if (!priceId) {
      throw new Error(`Invalid tier or interval: ${tier}_${interval}`);
    }

    // Validate promo code if provided
    let promoCodeData = null;
    let stripeDiscounts = [];
    
    if (promoCode) {
      promoCodeData = await this.validatePromoCode(promoCode, userId, tier, interval);
      
      // Create Stripe coupon for the discount
      if (promoCodeData.discountAmount > 0) {
        const couponId = `promo_${promoCode}_${Date.now()}`;
        
        if (promoCodeData.promoCode.discountType === 'percentage') {
          await stripe.coupons.create({
            id: couponId,
            percent_off: promoCodeData.promoCode.discountValue,
            duration: 'once',
            name: promoCodeData.promoCode.name || promoCode,
          });
        } else if (promoCodeData.promoCode.discountType === 'fixed_amount') {
          await stripe.coupons.create({
            id: couponId,
            amount_off: promoCodeData.discountAmount,
            currency: 'usd',
            duration: 'once',
            name: promoCodeData.promoCode.name || promoCode,
          });
        }
        
        stripeDiscounts.push({ coupon: couponId });
      }
    }

    // Track affiliate if provided
    let affiliateMetadata = {};
    if (affiliateCode) {
      const affiliate = await prisma.affiliateLink.findUnique({
        where: { code: affiliateCode }
      });
      if (affiliate) {
        affiliateMetadata = {
          affiliateId: affiliate.id,
          affiliateCode,
          affiliateCommission: affiliate.commissionRate.toString()
        };
      }
    }

    // Create checkout session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      discounts: stripeDiscounts,
      allow_promotion_codes: !promoCode,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId,
        tier,
        interval,
        organizationId: organizationId || '',
        promoCode: promoCode || '',
        ...affiliateMetadata
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
          interval,
          organizationId: organizationId || '',
          promoCode: promoCode || '',
          ...affiliateMetadata
        }
      }
    };

    // Add free trial if promo code provides it
    if (promoCodeData && promoCodeData.promoCode.discountType === 'free_trial') {
      sessionData.subscription_data!.trial_period_days = Math.floor(promoCodeData.promoCode.discountValue);
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    // Track promo code usage intent (actual usage tracked on successful payment)
    if (promoCodeData) {
      await prisma.promoCode.update({
        where: { id: promoCodeData.promoCode.id },
        data: { usedCount: { increment: 1 } }
      });
    }

    return { 
      session, 
      promoCodeData,
      originalAmount: promoCodeData?.originalAmount,
      finalAmount: promoCodeData?.finalAmount,
      discountAmount: promoCodeData?.discountAmount
    };
  }

  // ===================================
  // WEBHOOK HANDLING
  // ===================================

  static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { userId, tier, interval, organizationId, promoCode, affiliateId } = session.metadata!;
    
    try {
      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionTier: tier,
          stripeCustomerId: session.customer as string,
        }
      });

      // Create subscription record
      const subscriptionData: any = {
        userId,
        organizationId: organizationId || null,
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: session.customer as string,
        tier,
        status: 'active',
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        interval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      };

      // Add promo code info if used
      if (promoCode) {
        const promoCodeRecord = await prisma.promoCode.findUnique({
          where: { code: promoCode.toUpperCase() }
        });
        
        if (promoCodeRecord) {
          subscriptionData.promoCodeId = promoCodeRecord.id;
          
          if (promoCodeRecord.discountType === 'percentage') {
            subscriptionData.discountPercent = promoCodeRecord.discountValue;
          } else {
            subscriptionData.discountAmount = promoCodeRecord.discountValue;
          }

          // Record promo code usage
          await prisma.promoCodeUsage.create({
            data: {
              promoCodeId: promoCodeRecord.id,
              userId,
              discountAmount: session.total_details?.amount_discount || 0,
              orderAmount: session.amount_total || 0,
            }
          });
        }
      }

      const subscription = await prisma.subscription.create({
        data: subscriptionData
      });

      // Handle affiliate commission
      if (affiliateId) {
        await this.processAffiliateCommission(affiliateId, subscription.id, session.amount_total || 0);
      }

      // Send welcome email
      await this.sendWelcomeEmail(userId, tier);

      return subscription;
    } catch (error) {
      console.error('Error handling checkout completion:', error);
      throw error;
    }
  }

  static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const { userId } = subscription.metadata;
    
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status === 'active' ? 'active' : 
                          subscription.status === 'canceled' ? 'cancelled' : 
                          subscription.status
      }
    });
  }

  static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { userId } = subscription.metadata;
    
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'cancelled' }
    });
  }

  static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      // Track successful payment for analytics
      await prisma.analytics.create({
        data: {
          eventType: 'payment_succeeded',
          eventData: {
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid,
            currency: invoice.currency,
          }
        }
      });
    }
  }

  static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const { userId } = subscription.metadata;
      
      // Update subscription status
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'past_due' }
      });

      // Send payment failed notification
      await this.sendPaymentFailedEmail(userId, invoice.amount_due);
    }
  }

  // ===================================
  // AFFILIATE SYSTEM
  // ===================================

  static async processAffiliateCommission(affiliateId: string, subscriptionId: string, orderAmount: number) {
    const affiliate = await prisma.affiliateLink.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate) return;

    const commissionAmount = Math.round(orderAmount * (affiliate.commissionRate / 100));

    // Update affiliate stats
    await prisma.affiliateLink.update({
      where: { id: affiliateId },
      data: {
        conversionCount: { increment: 1 },
        totalEarnings: { increment: commissionAmount }
      }
    });

    // Record commission (you might want a separate commissions table)
    await prisma.analytics.create({
      data: {
        eventType: 'affiliate_commission',
        userId: affiliate.userId,
        eventData: {
          affiliateId,
          subscriptionId,
          orderAmount,
          commissionAmount,
          commissionRate: affiliate.commissionRate
        }
      }
    });
  }

  static async createAffiliateLink(userId: string, code: string, commissionRate: number = 10) {
    return await prisma.affiliateLink.create({
      data: {
        userId,
        code: code.toLowerCase(),
        commissionRate,
        name: `${code} Affiliate Link`
      }
    });
  }

  static async trackAffiliateClick(affiliateCode: string, metadata: any = {}) {
    const affiliate = await prisma.affiliateLink.findUnique({
      where: { code: affiliateCode }
    });

    if (affiliate) {
      await prisma.affiliateLink.update({
        where: { id: affiliate.id },
        data: { clickCount: { increment: 1 } }
      });

      await prisma.analytics.create({
        data: {
          eventType: 'affiliate_click',
          userId: affiliate.userId,
          eventData: {
            affiliateId: affiliate.id,
            affiliateCode,
            ...metadata
          }
        }
      });
    }
  }

  // ===================================
  // CUSTOMER PORTAL & BILLING
  // ===================================

  static async createCustomerPortalSession(userId: string, returnUrl: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  static async updateSubscription(subscriptionId: string, priceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  // ===================================
  // EMAIL NOTIFICATIONS
  // ===================================

  static async sendWelcomeEmail(userId: string, tier: string) {
    // Implement email service integration (SendGrid, Mailgun, etc.)
    console.log(`Welcome email sent to user ${userId} for ${tier} subscription`);
    
    await prisma.analytics.create({
      data: {
        eventType: 'welcome_email_sent',
        userId,
        eventData: { tier }
      }
    });
  }

  static async sendPaymentFailedEmail(userId: string, amountDue: number) {
    console.log(`Payment failed email sent to user ${userId} for ${amountDue / 100}`);
    
    await prisma.analytics.create({
      data: {
        eventType: 'payment_failed_email_sent',
        userId,
        eventData: { amountDue }
      }
    });
  }

  // ===================================
  // ANALYTICS & REPORTING
  // ===================================

  static async getRevenueMetrics(startDate: Date, endDate: Date) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'active'
      }
    });

    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const subscriptionCount = subscriptions.length;
    const averageRevenue = subscriptionCount > 0 ? totalRevenue / subscriptionCount : 0;

    return {
      totalRevenue,
      subscriptionCount,
      averageRevenue,
      revenueByTier: subscriptions.reduce((acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + sub.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  static async getPromoCodeStats(promoCodeId: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      include: {
        usages: true,
        subscriptions: true
      }
    });

    if (!promoCode) throw new Error('Promo code not found');

    const totalDiscountGiven = promoCode.usages.reduce((sum, usage) => sum + usage.discountAmount, 0);
    const totalRevenue = promoCode.subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

    return {
      ...promoCode,
      totalDiscountGiven,
      totalRevenue,
      conversionRate: promoCode.usedCount > 0 ? (promoCode.subscriptions.length / promoCode.usedCount) * 100 : 0
    };
  }
}

export default StripeService;