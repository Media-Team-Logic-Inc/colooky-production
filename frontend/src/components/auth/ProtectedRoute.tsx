import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { Code } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredTier,
  fallback,
  redirectTo = '/auth/signin'
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    const currentPath = router.asPath;
    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    router.push(redirectUrl);
    return null;
  }

  // Check subscription tier access
  if (requiredTier && requiredTier.length > 0 && profile) {
    const userTier = profile.subscription_tier || 'free';
    const hasAccess = requiredTier.includes(userTier);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Upgrade Required</h2>
            <p className="text-slate-400 mb-6">
              This feature requires a {requiredTier.join(' or ')} subscription.
            </p>
            <button 
              onClick={() => window.location.href = '/pricing'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              View Pricing
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;