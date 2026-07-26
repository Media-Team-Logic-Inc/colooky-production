import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { createUserProfile, getUserProfile, UserProfile } from './supabase';

const missingVars: string[] = [];
if (!process.env.GITHUB_CLIENT_ID) missingVars.push('GITHUB_CLIENT_ID');
if (!process.env.GITHUB_CLIENT_SECRET) missingVars.push('GITHUB_CLIENT_SECRET');
if (!process.env.NEXTAUTH_SECRET) missingVars.push('NEXTAUTH_SECRET');
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
      // Always allow sign-in to proceed first, handle Supabase integration separately
      if (account?.provider !== 'github' || !profile) {
        return true;
      }

      // Handle Supabase integration in background - don't block sign-in
      try {
        // Only attempt Supabase integration if environment variables are present
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          return true;
        }

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
          
          await createUserProfile(userData);
        }
      } catch {
        // Supabase integration is non-blocking — allow sign-in to proceed
      }
      
      return true;
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