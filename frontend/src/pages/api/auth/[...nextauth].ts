import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route initializing...');

// Wrap the NextAuth handler to add logging
const handler = async (req: any, res: any) => {
  console.log('🔧 NextAuth request:', req.method, req.url);
  console.log('🔧 NextAuth query:', req.query);
  
  try {
    return await NextAuth(authOptions)(req, res);
  } catch (error) {
    console.error('❌ NextAuth handler error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a proper error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export default handler;