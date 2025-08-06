import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Code, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  CreditCard,
  BarChart3,
  GitBranch,
  Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/Button';
import { calculateTrialDaysLeft } from '../../lib/utils';

const Header = () => {
  const { user, logout } = useAuth();
  const { usage } = useSubscription();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    };

    if (isProfileOpen || isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen, isMenuOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Repositories', href: '/repositories', icon: GitBranch },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const trialDaysLeft = user?.trialEndsAt ? calculateTrialDaysLeft(user.trialEndsAt) : 0;
  const isTrialUser = user?.subscriptionTier === 'trial';
  const isTrialExpiring = isTrialUser && trialDaysLeft <= 3;

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">Colooky</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Trial warning */}
            {isTrialExpiring && (
              <div className="hidden sm:flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                <Bell className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium">
                  {trialDaysLeft} days left
                </span>
                <Button 
                  size="sm" 
                  onClick={() => router.push('/pricing')}
                  className="ml-2 text-xs"
                >
                  Upgrade
                </Button>
              </div>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileOpen(!isProfileOpen);
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-500 transition-colors"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-white">
                      {user.username}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {user.subscriptionTier} plan
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                    {/* User info */}
                    <div className="p-4 border-b border-slate-700">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="text-white font-medium">{user.username}</div>
                          <div className="text-slate-400 text-sm">{user.email}</div>
                        </div>
                      </div>
                      
                      {/* Subscription status */}
                      <div className="mt-3 p-2 bg-slate-700/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm capitalize">
                            {user.subscriptionTier} plan
                          </span>
                          {isTrialUser && (
                            <span className="text-yellow-400 text-xs font-medium">
                              {trialDaysLeft} days left
                            </span>
                          )}
                        </div>
                        
                        {/* Usage indicators */}
                        {usage && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Repositories</span>
                              <span className="text-slate-300">
                                {usage.repositories.current}/{usage.repositories.limit === -1 ? '∞' : usage.repositories.limit}
                              </span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full" 
                                style={{ 
                                  width: usage.repositories.limit === -1 
                                    ? '20%' 
                                    : `${Math.min((usage.repositories.current / usage.repositories.limit) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      
                      <Link
                        href="/billing"
                        className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Billing</span>
                      </Link>
                      
                      <div className="border-t border-slate-700 my-2"></div>
                      
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-slate-800'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile trial warning */}
              {isTrialExpiring && (
                <div className="px-3 py-2">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bell className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 text-sm font-medium">
                        Trial ending in {trialDaysLeft} days
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/pricing')}
                      className="w-full"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;