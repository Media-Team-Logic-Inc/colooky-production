import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

console.log('🔧 NextAuth API route initializing...');

export default NextAuth(authOptions);