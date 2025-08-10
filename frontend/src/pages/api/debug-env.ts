import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 Debug environment variables');
  
  res.status(200).json({
    serverSide: {
      NODE_ENV: process.env.NODE_ENV,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'present' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
    clientSideWouldBe: {
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
      // This shows what the browser would see
      publicEnvCheck: process.env.GITHUB_CLIENT_ID ? 'server-only' : 'missing-on-server'
    }
  });
}