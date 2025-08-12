import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

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

    // For now, return a simple free plan response since external services might not be configured
    return res.status(200).json({
      plan_type: 'free',
      status: 'active',
      billing_period: null,
      current_period_end: null,
      cancel_at_period_end: false,
      stripe_customer_id: null,
      payment_method: null,
      debug: {
        hasSession: true,
        userId: session.user.githubId,
        userEmail: session.user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
  }
}