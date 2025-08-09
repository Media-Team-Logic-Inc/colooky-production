import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route loading...');

// Re-enable NextAuth now that container is stable
const handler = async (req: any, res: any) => {
  console.log('🔧 NextAuth request:', req.method, req.url);
  
  try {
    return await NextAuth(authOptions)(req, res);
  } catch (error) {
    console.error('❌ NextAuth error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

console.log('🔧 NextAuth handler created');

export default handler;