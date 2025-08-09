import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/globals.css';

console.log('🔧 App initializing...');
console.log('🔧 Environment check - NODE_ENV:', process.env.NODE_ENV);

// Add error boundary for the entire app
if (typeof window !== 'undefined') {
  window.addEventListener('error', (error) => {
    console.error('❌ Global error caught:', error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  console.log('🔧 App component rendering...');
  
  try {
    return (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider />
          <Component {...pageProps} />
        </QueryClientProvider>
      </SessionProvider>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    throw error;
  }
}