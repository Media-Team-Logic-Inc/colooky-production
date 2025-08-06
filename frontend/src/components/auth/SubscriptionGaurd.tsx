import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { useRouter } from 'next/router';
import { Crown, Lock, ArrowRight } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier: 'individual' | 'team' | 'enterprise';
  feature: string;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredTier,
  feature,
  fallback,
  showUpgradeModal = true
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  const tierHierarchy = { trial: 0, individual: 1, team: 2, enterprise: 3 };
  const userTierLevel = tierHierarchy[user.subscriptionTier as keyof typeof tierHierarchy] || 0;
  const requiredTierLevel = tierHierarchy[requiredTier];

  // Check if user has access
  if (userTierLevel >= requiredTierLevel) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt overlay
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none opacity-50 select-none">
        {children}
      </div>
      
      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm rounded-lg">
        <div className="text-center text-white p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold mb-2">
            {feature} requires {requiredTier} plan
          </h3>
          
          <p className="text-slate-300 text-sm mb-6">
            Upgrade your subscription to unlock this powerful feature and take your code visualization to the next level.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to {requiredTier}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <button
              onClick={() => router.push('/pricing')}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              View all plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGuard;