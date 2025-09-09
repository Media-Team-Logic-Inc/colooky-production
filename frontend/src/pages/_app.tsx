import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../components/ui/Toast';
import { ThemeProvider } from '../components/ThemeProvider';
import '../styles/globals.css';

console.log('🔧 App initializing...');
console.log('🔧 Environment:', process.env.NODE_ENV);

// Add Node.js process error handlers FIRST
process.on('uncaughtException', (error) => {
  console.error('❌ FATAL: Uncaught Exception:', error);
  console.error('❌ FATAL: Stack:', error.stack);
  console.error('❌ FATAL: This will cause container restart');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('❌ FATAL: This will cause container restart');
});

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
  return (
    <SessionProvider 
      session={session}
      basePath="/api/auth"
      baseUrl={typeof window !== 'undefined' ? window.location.origin : 'https://colooky.com'}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider />
          <Component {...pageProps} />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}