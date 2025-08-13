import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.githubId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Settings API test successful',
      user: {
        githubId: session.user.githubId,
        email: session.user.email,
        name: session.user.name
      },
      method: req.method,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test settings API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}