import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route initializing...');

let handler;

try {
  handler = NextAuth(authOptions);
  console.log('🔧 NextAuth handler created successfully');
} catch (error) {
  console.error('❌ Error initializing NextAuth:', error);
  // Fallback handler to prevent complete crash
  handler = function fallbackHandler(req: any, res: any) {
    console.error('❌ NextAuth fallback handler called');
    res.status(500).json({ error: 'Authentication service unavailable' });
  };
}

export default handler;