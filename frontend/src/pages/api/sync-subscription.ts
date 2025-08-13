import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { getUserProfile } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const customer = customers.data[0];

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json({ 
        message: 'No active subscriptions found',
        customer: customer.id 
      });
    }

    const subscription = subscriptions.data[0];

    // Get user profile
    const userProfile = await getUserProfile(session.user.githubId as string);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Update subscription in database
    const planType = subscription.metadata?.plan || 'individual';
    const billingPeriod = subscription.metadata?.billing_period || 'monthly';

    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .upsert({
        user_id: userProfile.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        billing_period: billingPeriod,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: (subscription as any).cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id' 
      });

    if (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription synced successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_type: planType,
        billing_period: billingPeriod,
      }
    });

  } catch (error) {
    console.error('Sync subscription error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}