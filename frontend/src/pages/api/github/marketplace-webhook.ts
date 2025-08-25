import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase';

// Disable default body parser for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get raw body
function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Verify GitHub webhook signature
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const payload = rawBody.toString('utf8');
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;

    // Verify webhook secret
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      console.error('GITHUB_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!signature) {
      console.error('Missing GitHub signature');
      return res.status(401).json({ error: 'Signature required' });
    }

    if (!verifyGitHubSignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      console.error('Invalid GitHub signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const body = JSON.parse(payload);
    console.log(`Received GitHub Marketplace webhook: ${event}`);

    // Handle different marketplace events
    switch (event) {
      case 'marketplace_purchase':
        await handleMarketplacePurchase(body);
        break;
      
      case 'marketplace_plan_changed':
        await handlePlanChanged(body);
        break;
      
      case 'marketplace_cancelled':
        await handleMarketplaceCancelled(body);
        break;
      
      case 'marketplace_pending_change':
        await handlePendingChange(body);
        break;
      
      case 'marketplace_pending_change_cancelled':
        await handlePendingChangeCancelled(body);
        break;
      
      default:
        console.log(`Unhandled GitHub Marketplace event: ${event}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('GitHub Marketplace webhook error:', error);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleMarketplacePurchase(event: any) {
  try {
    console.log('Processing marketplace purchase:', event.marketplace_purchase.id);
    
    const purchase = event.marketplace_purchase;
    const account = event.marketplace_purchase.account;
    
    // Store marketplace subscription in database
    const { error } = await supabaseAdmin
      .from('github_marketplace_subscriptions')
      .upsert({
        github_user_id: account.id,
        github_username: account.login,
        github_email: account.email,
        plan_id: purchase.plan.id,
        plan_name: purchase.plan.name,
        plan_description: purchase.plan.description,
        monthly_price_in_cents: purchase.plan.monthly_price_in_cents,
        yearly_price_in_cents: purchase.plan.yearly_price_in_cents,
        unit_count: purchase.unit_count,
        status: 'active',
        marketplace_purchase_id: purchase.id,
        effective_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'github_user_id' 
      });

    if (error) {
      console.error('Error storing marketplace purchase:', error);
    } else {
      console.log('Successfully stored marketplace purchase for user:', account.login);
    }

    // Send welcome email or notification here if needed
    
  } catch (error) {
    console.error('Error handling marketplace purchase:', error);
  }
}

async function handlePlanChanged(event: any) {
  try {
    console.log('Processing plan change:', event.marketplace_purchase.id);
    
    const purchase = event.marketplace_purchase;
    const account = event.marketplace_purchase.account;
    
    // Update subscription plan
    const { error } = await supabaseAdmin
      .from('github_marketplace_subscriptions')
      .update({
        plan_id: purchase.plan.id,
        plan_name: purchase.plan.name,
        plan_description: purchase.plan.description,
        monthly_price_in_cents: purchase.plan.monthly_price_in_cents,
        yearly_price_in_cents: purchase.plan.yearly_price_in_cents,
        unit_count: purchase.unit_count,
        effective_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('github_user_id', account.id);

    if (error) {
      console.error('Error updating plan change:', error);
    } else {
      console.log('Successfully updated plan for user:', account.login);
    }
    
  } catch (error) {
    console.error('Error handling plan change:', error);
  }
}

async function handleMarketplaceCancelled(event: any) {
  try {
    console.log('Processing marketplace cancellation:', event.marketplace_purchase.id);
    
    const account = event.marketplace_purchase.account;
    
    // Mark subscription as cancelled
    const { error } = await supabaseAdmin
      .from('github_marketplace_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('github_user_id', account.id);

    if (error) {
      console.error('Error processing cancellation:', error);
    } else {
      console.log('Successfully cancelled subscription for user:', account.login);
    }

    // Send cancellation confirmation email here if needed
    
  } catch (error) {
    console.error('Error handling marketplace cancellation:', error);
  }
}

async function handlePendingChange(event: any) {
  try {
    console.log('Processing pending change:', event.marketplace_purchase.id);
    
    const purchase = event.marketplace_purchase;
    const account = event.marketplace_purchase.account;
    
    // Store pending change information
    const { error } = await supabaseAdmin
      .from('github_marketplace_subscriptions')
      .update({
        pending_change: {
          plan_id: purchase.plan.id,
          plan_name: purchase.plan.name,
          effective_date: purchase.effective_date,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('github_user_id', account.id);

    if (error) {
      console.error('Error storing pending change:', error);
    } else {
      console.log('Successfully stored pending change for user:', account.login);
    }
    
  } catch (error) {
    console.error('Error handling pending change:', error);
  }
}

async function handlePendingChangeCancelled(event: any) {
  try {
    console.log('Processing pending change cancellation:', event.marketplace_purchase.id);
    
    const account = event.marketplace_purchase.account;
    
    // Clear pending change
    const { error } = await supabaseAdmin
      .from('github_marketplace_subscriptions')
      .update({
        pending_change: null,
        updated_at: new Date().toISOString(),
      })
      .eq('github_user_id', account.id);

    if (error) {
      console.error('Error clearing pending change:', error);
    } else {
      console.log('Successfully cleared pending change for user:', account.login);
    }
    
  } catch (error) {
    console.error('Error handling pending change cancellation:', error);
  }
}