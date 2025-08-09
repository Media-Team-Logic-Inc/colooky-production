import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Code } from 'lucide-react';

const CallbackPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    if (status === 'loading') {
      setMessage('Signing you in...');
      return;
    }

    if (status === 'authenticated') {
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
      localStorage.removeItem('oauth_params');

      // Redirect after a short delay
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    }

    if (status === 'unauthenticated') {
      setMessage('Authentication failed');
      
      // Redirect to signin after error
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Code className="w-8 h-8 text-white" />
        </div>
        
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        )}
        
        {status === 'authenticated' && (
          <div className="w-8 h-8 mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="w-8 h-8 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'authenticated' ? 'Welcome to Colooky!' : 'Signing you in...'}
        </h1>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
};

export default CallbackPage;