import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route loading...');

// Re-enable NextAuth now that container is stable
const handler = async (req: any, res: any) => {
  console.log('🔧 NextAuth request:', req.method, req.url);
  console.log('🔧 Request headers host:', req.headers?.host);
  console.log('🔧 Request protocol:', req.headers?.['x-forwarded-proto'] || 'http');
  console.log('🔧 NEXTAUTH_URL in handler:', process.env.NEXTAUTH_URL);
  
  try {
    return await NextAuth(authOptions)(req, res);
  } catch (error) {
    console.error('❌ NextAuth error:', error);
    console.error('❌ NextAuth error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
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