import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getUserProfile, supabaseAdmin } from '../../../lib/supabase';
import { authOptions } from '../../../lib/auth';
import Stripe from 'stripe';

// Initialize Stripe with error handling
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated user
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.githubId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const githubId = session.user.githubId as string;

    // Get user profile
    const userProfile = await getUserProfile(githubId);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get subscription from database (only if Supabase is configured)
    let subscription = null;
    if (supabaseAdmin) {
      const { data: subData, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Failed to fetch subscription' });
      }
      subscription = subData;
    }

    // If no subscription in database, return free plan
    if (!subscription) {
      return res.status(200).json({
        plan_type: 'free',
        status: 'active',
        billing_period: null,
        current_period_end: null,
        cancel_at_period_end: false,
        stripe_customer_id: null,
        payment_method: null,
      });
    }

    // Get payment method from Stripe if customer exists and Stripe is configured
    let paymentMethod = null;
    if (subscription?.stripe_customer_id && stripe) {
      try {
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
        
        if (customer && !customer.deleted) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: subscription.stripe_customer_id,
            type: 'card',
            limit: 1,
          });

          if (paymentMethods.data.length > 0) {
            const pm = paymentMethods.data[0];
            paymentMethod = {
              brand: pm.card?.brand,
              last4: pm.card?.last4,
              expires: `${pm.card?.exp_month}/${pm.card?.exp_year}`,
            };
          }
        }
      } catch (stripeError) {
        console.error('Error fetching payment method from Stripe:', stripeError);
        // Continue without payment method data
      }
    }

    return res.status(200).json({
      plan_type: subscription?.plan_type || 'free',
      status: subscription?.status || 'active',
      billing_period: subscription?.billing_period || null,
      current_period_end: subscription?.current_period_end || null,
      cancel_at_period_end: subscription?.cancel_at_period_end || false,
      stripe_customer_id: subscription?.stripe_customer_id || null,
      payment_method: paymentMethod,
    });

  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}