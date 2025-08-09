import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// Debug environment variables
console.log('🔧 NextAuth config loading...');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'present' : 'missing');
console.log('🔧 GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'present' : 'missing');
console.log('🔧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('🔧 NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'present' : 'missing');

// Validate required environment variables
if (!process.env.GITHUB_CLIENT_ID) {
  console.error('❌ GITHUB_CLIENT_ID is required');
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  console.error('❌ GITHUB_CLIENT_SECRET is required');
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is required');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || 'missing-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'missing-client-secret',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
};