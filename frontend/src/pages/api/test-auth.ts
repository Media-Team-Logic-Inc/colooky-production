import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test server-side session handling
    const session = await getServerSession(req, res, authOptions);
    
    return res.status(200).json({
      success: true,
      hasSession: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
    });
  }
}