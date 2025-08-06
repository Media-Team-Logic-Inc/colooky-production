import React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface AuthErrorProps {
  error?: string;
}

export default function AuthError({ error }: AuthErrorProps) {
  const router = useRouter();
  const errorCode = error || (router.query.error as string);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'OAuthSignin':
        return 'There was a problem signing in with GitHub.';
      case 'OAuthCallback':
        return 'There was a problem with the GitHub OAuth callback.';
      case 'OAuthCreateAccount':
        return 'Could not create user account.';
      case 'EmailCreateAccount':
        return 'Could not create user account.';
      case 'Callback':
        return 'There was a problem with the authentication callback.';
      case 'OAuthAccountNotLinked':
        return 'Your GitHub account is already linked to another account.';
      case 'EmailSignin':
        return 'Check your email address.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  const getErrorTitle = (errorCode: string) => {
    switch (errorCode) {
      case 'SessionRequired':
        return 'Sign In Required';
      case 'AccessDenied':
        return 'Access Denied';
      case 'Verification':
        return 'Verification Error';
      default:
        return 'Authentication Error';
    }
  };

  return (
    <>
      <Head>
        <title>Authentication Error - Colooky</title>
        <meta name="description" content="There was an error signing in to Colooky" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              {getErrorTitle(errorCode)}
            </h1>
            
            <p className="text-slate-300 mb-8">
              {getErrorMessage(errorCode)}
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Link href="/" className="flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && errorCode && (
              <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-500">
                  Debug: Error code "{errorCode}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { error } = context.query;

  return {
    props: {
      error: error || null,
    },
  };
};