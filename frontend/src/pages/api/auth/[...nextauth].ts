import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route initializing...');

try {
  const handler = NextAuth(authOptions);
  console.log('🔧 NextAuth handler created successfully');
  export default handler;
} catch (error) {
  console.error('❌ Error initializing NextAuth:', error);
  // Fallback handler to prevent complete crash
  export default function fallbackHandler(req: any, res: any) {
    console.error('❌ NextAuth fallback handler called');
    res.status(500).json({ error: 'Authentication service unavailable' });
  };
}