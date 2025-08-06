// frontend/src/components/auth/SigninPage.tsx - Sign In Page
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Github, ArrowRight, Shield, Code, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const SigninPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      const redirectTo = router.query.redirect as string || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, loading, router]);

  // Handle GitHub OAuth
  const handleGitHubSignIn = () => {
    setIsAuthenticating(true);
    
    // Build OAuth URL with state for security
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('oauth_state', state);
    
    // Include redirect and subscription params
    const params = new URLSearchParams(router.query as Record<string, string>);
    if (params.toString()) {
      localStorage.setItem('oauth_params', params.toString());
    }
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3002/auth/callback')}&` +
      `scope=read:user user:email repo&` +
      `state=${state}`;
    
    window.location.href = githubAuthUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Home
          </Link>
        </div>

        {/* Sign In Card */}
        <div className="bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-purple-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Code className="h-8 w-8 text-cyan-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Colooky
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to visualize your code journey</p>
          </div>

          {/* GitHub Sign In Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={isAuthenticating}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-cyan-500/25 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Signing in...
              </>
            ) : (
              <>
                <Github className="h-5 w-5" />
                Continue with GitHub
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-purple-500/20">
            <p className="text-gray-400 text-sm text-center mb-4">Why sign in with GitHub?</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>Secure OAuth authentication</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <Code className="h-4 w-4 text-purple-400" />
                <span>Access your repositories</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <Users className="h-4 w-4 text-pink-400" />
                <span>Share with your team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SigninPage;