import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import { 
  BarChart3, 
  TrendingUp, 
  Code, 
  GitBranch, 
  FileText, 
  Clock,
  Download,
  Eye
} from 'lucide-react';

interface AnalyticsProps {
  user: any;
  accessToken: string;
}

interface RepositoryAnalytics {
  name: string;
  owner: string;
  language: string;
  lastAnalyzed?: string;
  metrics?: {
    functions: number;
    classes: number;
    files: number;
    complexity: number;
  };
}

export default function Analytics({ user, accessToken }: AnalyticsProps) {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock analytics data - in production, this would come from your database
  const overallMetrics = {
    totalRepositories: 12,
    totalAnalyses: 47,
    totalFunctions: 2840,
    totalClasses: 486,
    avgComplexity: 3.2,
    mostUsedLanguage: 'TypeScript'
  };

  const recentAnalyses = [
    { repo: 'colooky-production', owner: 'user', date: '2025-08-10', functions: 234, complexity: 2.8 },
    { repo: 'my-nextjs-app', owner: 'user', date: '2025-08-09', functions: 156, complexity: 3.1 },
    { repo: 'react-components', owner: 'user', date: '2025-08-08', functions: 89, complexity: 2.2 },
  ];

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Analytics Dashboard - Colooky</title>
        <meta name="description" content="View analytics across all your analyzed repositories" />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-slate-400">
                  Overview of your code analysis history and insights
                </p>
              </div>
            </div>
          </div>

          {/* Overall Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <GitBranch className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{overallMetrics.totalRepositories}</div>
              <div className="text-sm text-slate-400">Repositories</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <BarChart3 className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{overallMetrics.totalAnalyses}</div>
              <div className="text-sm text-slate-400">Analyses</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <Code className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{overallMetrics.totalFunctions.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Functions</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <FileText className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{overallMetrics.totalClasses}</div>
              <div className="text-sm text-slate-400">Classes</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{overallMetrics.avgComplexity}</div>
              <div className="text-sm text-slate-400">Avg Complexity</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <Code className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{overallMetrics.mostUsedLanguage}</div>
              <div className="text-sm text-slate-400">Top Language</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Analyses */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Analyses</h2>
              <div className="space-y-4">
                {recentAnalyses.map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">{analysis.repo}</div>
                        <div className="text-sm text-slate-400">
                          {analysis.functions} functions • Complexity: {analysis.complexity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{analysis.date}</span>
                      <Link
                        href={`/analytics/${analysis.owner}/${analysis.repo}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Repositories */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Repositories</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <span className="ml-3 text-slate-300">Loading repositories...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {repositories.slice(0, 5).map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-white font-medium">{repo.name}</div>
                          <div className="text-xs text-slate-400">
                            {repo.language || 'Mixed'} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/analyze/${repo.owner.login}/${repo.name}`}
                          className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors"
                        >
                          Analyze
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Link
                      href="/repositories"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      View all repositories →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/repositories"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                Analyze Repository
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export All Data
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>
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
      accessToken: session.accessToken,
    },
  };
};