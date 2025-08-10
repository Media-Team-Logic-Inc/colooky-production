import { useSession, signIn, signOut } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status } = useSession();

  const login = () => {
    signIn('github', { 
      callbackUrl: window.location.origin + '/dashboard'
    });
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: session?.user || null,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
  };
};