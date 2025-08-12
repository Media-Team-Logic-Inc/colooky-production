import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { createUserProfile, getUserProfile, UserProfile } from './supabase';

// Debug environment variables
console.log('🔧 NextAuth config loading...');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'present' : 'missing');
console.log('🔧 GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'present' : 'missing');
console.log('🔧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('🔧 NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'present' : 'missing');
console.log('🔧 NEXTAUTH_URL for callbacks:', process.env.NEXTAUTH_URL);
console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? 'present' : 'missing');

// Validate required environment variables
const missingVars: string[] = [];
if (!process.env.GITHUB_CLIENT_ID) {
  console.error('❌ GITHUB_CLIENT_ID is required');
  missingVars.push('GITHUB_CLIENT_ID');
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  console.error('❌ GITHUB_CLIENT_SECRET is required');
  missingVars.push('GITHUB_CLIENT_SECRET');
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is required');
  missingVars.push('NEXTAUTH_SECRET');
}

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('❌ Application may not function correctly');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || 'missing-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'missing-client-secret',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
          redirect_uri: `${process.env.NEXTAUTH_URL || 'https://colooky.com'}/api/auth/callback/github`
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubId = (profile as any).id;
        token.username = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.githubId = token.githubId as string;
      session.user.username = token.username as string;
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'github' && profile) {
          // Check if user already exists in Supabase
          const existingUser = await getUserProfile((profile as any).id as string);
          
          if (!existingUser) {
            // Create new user profile in Supabase
            const userData: Partial<UserProfile> = {
              github_id: (profile as any).id as string,
              email: profile.email || user.email || '',
              name: profile.name || user.name || '',
              username: (profile as any).login as string,
              avatar_url: (profile as any).avatar_url as string,
              github_access_token: account.access_token,
            };
            
            const newUser = await createUserProfile(userData);
            console.log('✅ Created new user in Supabase:', newUser?.id);
          } else {
            console.log('✅ User already exists in Supabase:', existingUser.id);
            // Optionally update access token if needed
            // await updateUserProfile(existingUser.id, { 
            //   github_access_token: account.access_token 
            // });
          }
        }
        return true;
      } catch (error) {
        console.error('❌ Error during sign in:', error);
        // Still allow sign in even if Supabase fails
        return true;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.colooky.com' : undefined
      }
    }
  },
};