import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 Auth debug endpoint called');
  
  // Check what NextAuth URLs are being generated
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const authUrls = {
    signin: `${baseUrl}/api/auth/signin`,
    callback: `${baseUrl}/api/auth/callback/github`,
    signout: `${baseUrl}/api/auth/signout`,
    session: `${baseUrl}/api/auth/session`,
  };
  
  console.log('🔧 Auth URLs:', authUrls);
  
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('🔧 Current session:', session ? 'exists' : 'none');
    
    res.status(200).json({
      message: 'Auth debug info',
      authUrls,
      hasSession: !!session,
      baseUrl,
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'present' : 'missing',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('❌ Auth debug error:', error);
    res.status(500).json({
      error: 'Auth debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}