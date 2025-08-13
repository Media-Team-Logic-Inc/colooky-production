import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { getUserProfile } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.githubId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const githubId = session.user.githubId as string;

    // Check if user profile exists
    const userProfile = await getUserProfile(githubId);
    
    // Get all user profiles to see what's in the database
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, github_id, email, name');

    // Get all subscriptions
    const { data: allSubs, error: subsError } = await supabase
      .from('subscription_plans')
      .select('*');

    // Try to find subscription directly by email
    let subscriptionByEmail = null;
    if (session.user.email) {
      const { data: userByEmail } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', session.user.email)
        .single();
      
      if (userByEmail) {
        const { data: subData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('user_id', userByEmail.id)
          .single();
        subscriptionByEmail = subData;
      }
    }

    return res.status(200).json({
      session: {
        email: session.user.email,
        githubId: githubId,
        name: session.user.name,
      },
      userProfile: userProfile || 'Not found',
      database: {
        totalUsers: allUsers?.length || 0,
        allUsers: allUsers || [],
        totalSubscriptions: allSubs?.length || 0,
        allSubscriptions: allSubs || [],
      },
      subscriptionByEmail: subscriptionByEmail || 'Not found',
      errors: {
        usersError: usersError?.message || null,
        subsError: subsError?.message || null,
      }
    });

  } catch (error) {
    console.error('Debug subscription error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}