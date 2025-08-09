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

  // For demo purposes, skip subscription tier checks
  // In a full implementation, you would fetch subscription data from your backend
  if (requiredTier && requiredTier.length > 0) {
    // TODO: Implement subscription tier checking by fetching from backend
    // For now, allow all authenticated users to access any tier
    console.log(`Protected route requires tier: ${requiredTier.join(', ')}`);
  }

  return <>{children}</>;
};

export default ProtectedRoute;