import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.githubId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get all users from database
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, github_id, email, name, username, created_at');

    if (usersError) {
      return res.status(500).json({ error: 'Failed to fetch users', details: usersError });
    }

    // Try to find user by different methods
    const sessionGithubId = session.user.githubId;
    const sessionGithubIdString = String(sessionGithubId);
    
    const { data: userByExactMatch, error: exactError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('github_id', sessionGithubId)
      .single();

    const { data: userByStringMatch, error: stringError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('github_id', sessionGithubIdString)
      .single();

    return res.status(200).json({
      success: true,
      debug: {
        sessionGithubId: sessionGithubId,
        sessionGithubIdType: typeof sessionGithubId,
        sessionGithubIdString: sessionGithubIdString,
        sessionUser: session.user,
        allUsersCount: allUsers?.length || 0,
        allUsers: allUsers,
        userByExactMatch: userByExactMatch || 'Not found',
        userByStringMatch: userByStringMatch || 'Not found',
        exactError: exactError?.message || null,
        stringError: stringError?.message || null,
      }
    });

  } catch (error) {
    console.error('Debug DB error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}