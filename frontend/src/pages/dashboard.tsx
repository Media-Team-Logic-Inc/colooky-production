import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../components/layout/Header';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <>
      <Head>
        <title>Dashboard - Colooky</title>
        <meta name="description" content="Your Colooky dashboard" />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.name || user?.email}! 👋
            </h1>
            <p className="text-slate-400 mt-2">
              You've successfully signed in to Colooky
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href="/repositories"
                  className="block w-full text-left px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  View Repositories
                </a>
                <a
                  href="/demo"
                  className="block w-full text-left px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Try Interactive Demo
                </a>
                <a
                  href="/analytics"
                  className="block w-full text-left px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  View Analytics
                </a>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Account Info</h2>
              <div className="space-y-2">
                <p className="text-slate-300">
                  <span className="text-slate-400">Name:</span> {user?.name || 'Not provided'}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Email:</span> {user?.email || 'Not provided'}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Plan:</span> Free Plan
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <p>✅ Account created successfully</p>
                <p>✅ GitHub connected</p>
                <p>⏳ Repository analysis pending</p>
                <p>⏳ First visualization pending</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user,
    },
  };
};