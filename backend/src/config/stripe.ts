import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceIds: {
    individual: {
      monthly: process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID!,
    },
    team: {
      monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
    },
    enterprise: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
    },
  },
};