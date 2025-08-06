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

  // Check subscription tier if required
  if (requiredTier && requiredTier.length > 0) {
    const tierHierarchy = { trial: 0, individual: 1, team: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[user.subscriptionTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = Math.max(...requiredTier.map(tier => 
      tierHierarchy[tier as keyof typeof tierHierarchy] || 0
    ));

    if (userTierLevel < requiredTierLevel) {
      router.push('/pricing');
      return null;
    }
  }

  // Check if trial expired
  if (user.subscriptionStatus === 'expired') {
    router.push('/pricing?expired=true');
    return null;
  }

  // Check if subscription is cancelled
  if (user.subscriptionStatus === 'cancelled') {
    router.push('/pricing?cancelled=true');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;