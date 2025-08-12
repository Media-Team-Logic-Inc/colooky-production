import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Plan price IDs from environment variables
const PRICE_IDS = {
  individual_monthly: process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID!,
  individual_yearly: process.env.STRIPE_INDIVIDUAL_YEARLY_PRICE_ID!,
  team_monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
  team_yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
  enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
  enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated user
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { plan, billing_period = 'monthly' } = req.body;

    // Validate plan and billing period
    const priceKey = `${plan}_${billing_period}` as keyof typeof PRICE_IDS;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return res.status(400).json({ 
        error: 'Invalid plan or billing period',
        available_plans: Object.keys(PRICE_IDS)
      });
    }

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          user_id: session.user.id || '',
          github_id: session.user.githubId || '',
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
      metadata: {
        user_id: session.user.id || '',
        github_id: session.user.githubId || '',
        plan: plan,
        billing_period: billing_period,
      },
      subscription_data: {
        metadata: {
          user_id: session.user.id || '',
          github_id: session.user.githubId || '',
          plan: plan,
          billing_period: billing_period,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return res.status(200).json({ 
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: 'Stripe error',
        message: error.message,
        type: error.type
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}