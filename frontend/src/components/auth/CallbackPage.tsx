import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Code } from 'lucide-react';
import { authAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CallbackPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code, state } = router.query;

        if (!code || typeof code !== 'string') {
          throw new Error('Authorization code not found');
        }

        // Verify state for security
        const storedState = localStorage.getItem('oauth_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        setMessage('Exchanging authorization code...');

        // Exchange code for user data
        const response = await authAPI.githubCallback(code);
        const userData = response.data.user;

        // Store user data
        login(userData);
        
        setStatus('success');
        setMessage('Success! Redirecting...');

        // Get stored redirect parameters
        const storedParams = localStorage.getItem('oauth_params');
        let redirectUrl = '/dashboard';

        if (storedParams) {
          const params = new URLSearchParams(storedParams);
          const tier = params.get('tier');
          const interval = params.get('interval');
          const promo = params.get('promo');
          const ref = params.get('ref');

          if (tier) {
            // Redirect to pricing with subscription params
            const pricingParams = new URLSearchParams();
            pricingParams.set('tier', tier);
            if (interval) pricingParams.set('interval', interval);
            if (promo) pricingParams.set('promo', promo);
            if (ref) pricingParams.set('ref', ref);
            
            redirectUrl = `/pricing?${pricingParams.toString()}`;
          } else if (params.get('redirect')) {
            redirectUrl = params.get('redirect')!;
          }
        }

        // Clean up localStorage
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_params');

        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1500);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        toast.error('Sign in failed. Please try again.');
        
        // Redirect to signin after error
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Code className="w-8 h-8 text-white" />
        </div>
        
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        )}
        
        {status === 'success' && (
          <div className="w-8 h-8 mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}
        
        {status === 'error' && (
          <div className="w-8 h-8 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'success' ? 'Welcome to Colooky!' : 'Signing you in...'}
        </h1>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
};

export default CallbackPage;