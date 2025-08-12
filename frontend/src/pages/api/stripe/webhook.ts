import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from '../../../lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Disable default body parser for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      return res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
    }

    console.log('Received webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout completed:', session.id);
    
    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in session metadata');
      return;
    }

    // Update or create subscription record in Supabase
    const { error } = await supabaseAdmin
      .from('subscription_plans')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan_type: session.metadata?.plan || 'individual',
        billing_period: session.metadata?.billing_period || 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id' 
      });

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log('Successfully updated subscription for user:', userId);
    }

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);
    
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    const { error } = await supabaseAdmin
      .from('subscription_plans')
      .update({
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: (subscription as any).cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription status:', error);
    } else {
      console.log('Successfully updated subscription status for:', subscription.id);
    }

  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription deletion:', subscription.id);
    
    const { error } = await supabaseAdmin
      .from('subscription_plans')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription deletion:', error);
    } else {
      console.log('Successfully marked subscription as canceled:', subscription.id);
    }

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing successful payment:', invoice.id);
    
    // You could store invoice history or send confirmation emails here
    // For now, just log the successful payment
    console.log(`Payment succeeded for customer ${invoice.customer}: $${(invoice.amount_paid / 100).toFixed(2)}`);

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing failed payment:', invoice.id);
    
    // You could send dunning emails or update subscription status here
    console.log(`Payment failed for customer ${invoice.customer}: $${(invoice.amount_due / 100).toFixed(2)}`);

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}