import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check NextAuth session
    const session = await getServerSession(req, res, authOptions);
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Test Supabase auth.email() function
    const { data: authTest, error: authError } = await supabase
      .rpc('get_current_user_email');

    // Test direct query without RLS
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, github_id, name');

    return res.status(200).json({
      nextAuth: {
        authenticated: !!session,
        email: session?.user?.email || null,
        githubId: session?.user?.githubId || null,
      },
      supabaseAuth: {
        email: authTest || null,
        error: authError?.message || null,
      },
      database: {
        totalUsers: allUsers?.length || 0,
        users: allUsers || [],
        error: usersError?.message || null,
      },
      debug: {
        hasSupabaseClient: !!supabase,
        sessionData: session,
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}