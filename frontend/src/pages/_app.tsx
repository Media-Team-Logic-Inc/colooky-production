import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SessionProvider } from 'next-auth/react';
// import { ToastProvider } from '../components/ui/Toast'; // Temporarily disabled for debugging
import '../styles/globals.css';

console.log('🔧 Step 1: App file loading...');
console.log('🔧 Step 2: Environment check - NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Step 2.1: Railway PORT check:', process.env.PORT || 'not set');
console.log('🔧 Step 2.2: Railway env vars:', {
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
  PORT: process.env.PORT
});

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

console.log('🔧 Step 3: Process error handlers installed');

// Add error boundary for the entire app
if (typeof window !== 'undefined') {
  console.log('🔧 Step 4: Installing browser error handlers');
  window.addEventListener('error', (error) => {
    console.error('❌ Global error caught:', error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
  });
} else {
  console.log('🔧 Step 4: Server-side, skipping browser error handlers');
}

console.log('🔧 Step 5: Creating QueryClient...');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});
console.log('🔧 Step 6: QueryClient created successfully');

// Add periodic heartbeat to show the process is alive
setInterval(() => {
  console.log('💓 Application heartbeat - uptime:', process.uptime(), 'seconds');
}, 10000); // Log every 10 seconds

console.log('🔧 Step 6.5: Heartbeat timer started');

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  console.log('🔧 Step 7: App component function called');
  console.log('🔧 Step 8: Props received - Component:', Component?.name || 'Unknown');
  
  try {
    console.log('🔧 Step 9: Creating JSX structure...');
    const jsx = (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          {/* <ToastProvider /> Temporarily disabled for debugging */}
          <Component {...pageProps} />
        </QueryClientProvider>
      </SessionProvider>
    );
    console.log('🔧 Step 10: JSX structure created successfully');
    return jsx;
  } catch (error) {
    console.error('❌ Error in App component:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}