import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import { ArrowLeft, Github, BarChart3, Code, FileText, TrendingUp } from 'lucide-react';

interface Repository {
  owner: string;
  name: string;
  full_name: string;
  description: string;
  language: string;
}

interface AnalyticsProps {
  user: any;
  repository: Repository;
}

export default function Analytics({ user, repository }: AnalyticsProps) {
  // Mock analytics data - in production, this would come from your analysis results
  const analytics = {
    codeMetrics: {
      totalLines: 15420,
      codeLines: 12340,
      commentLines: 2180,
      blankLines: 900,
      files: 87,
      functions: 234,
      classes: 45,
      complexity: 156
    },
    languageBreakdown: [
      { language: 'TypeScript', percentage: 65, lines: 10023 },
      { language: 'JavaScript', lines: 3421, percentage: 22 },
      { language: 'CSS', lines: 1534, percentage: 10 },
      { language: 'HTML', lines: 442, percentage: 3 }
    ],
    fileTypes: [
      { type: '.tsx', count: 23, percentage: 26 },
      { type: '.ts', count: 31, percentage: 36 },
      { type: '.js', count: 15, percentage: 17 },
      { type: '.css', count: 12, percentage: 14 },
      { type: '.json', count: 6, percentage: 7 }
    ],
    complexity: {
      low: 156,
      medium: 45,
      high: 23,
      veryHigh: 10
    },
    trends: {
      monthlyCommits: [12, 18, 25, 31, 28, 42],
      codeGrowth: [8500, 9200, 10100, 11300, 13200, 15420]
    }
  };

  return (
    <>
      <Head>
        <title>Analytics - {repository.name} - Colooky</title>
        <meta name="description" content={`Code analytics for ${repository.name}`} />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href={`/analyze/${repository.owner}/${repository.name}`}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Analysis
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Analytics: {repository.owner}/{repository.name}
                </h1>
                <p className="text-slate-400">
                  Detailed code metrics and insights
                </p>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.codeMetrics.files}</div>
              <div className="text-sm text-slate-400">Total Files</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <Code className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.codeMetrics.totalLines.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Lines of Code</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.codeMetrics.functions}</div>
              <div className="text-sm text-slate-400">Functions</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <Github className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.codeMetrics.complexity}</div>
              <div className="text-sm text-slate-400">Complexity Score</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Language Breakdown */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Language Breakdown</h2>
              <div className="space-y-4">
                {analytics.languageBreakdown.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        lang.language === 'TypeScript' ? 'bg-blue-500' :
                        lang.language === 'JavaScript' ? 'bg-yellow-500' :
                        lang.language === 'CSS' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-white font-medium">{lang.language}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-white font-medium">{lang.percentage}%</div>
                        <div className="text-xs text-slate-400">{lang.lines.toLocaleString()} lines</div>
                      </div>
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            lang.language === 'TypeScript' ? 'bg-blue-500' :
                            lang.language === 'JavaScript' ? 'bg-yellow-500' :
                            lang.language === 'CSS' ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${lang.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Types */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">File Types</h2>
              <div className="space-y-3">
                {analytics.fileTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-mono text-sm bg-slate-700 px-2 py-1 rounded">
                        {type.type}
                      </span>
                      <span className="text-white">{type.count} files</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300">{type.percentage}%</span>
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Metrics */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Code Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {analytics.codeMetrics.codeLines.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Code Lines</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {analytics.codeMetrics.commentLines.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Comments</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">
                    {analytics.codeMetrics.functions}
                  </div>
                  <div className="text-sm text-slate-400">Functions</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">
                    {analytics.codeMetrics.classes}
                  </div>
                  <div className="text-sm text-slate-400">Classes</div>
                </div>
              </div>
            </div>

            {/* Complexity Analysis */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Complexity Analysis</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Low Complexity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{analytics.complexity.low}</span>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Medium Complexity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{analytics.complexity.medium}</span>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '19%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-orange-400">High Complexity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{analytics.complexity.high}</span>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Very High Complexity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{analytics.complexity.veryHigh}</span>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '4%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={`/analyze/${repository.owner}/${repository.name}`}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Analyze Again
            </Link>
            <Link
              href="/repositories"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Repositories
            </Link>
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

  const { owner, repo } = context.params as { owner: string; repo: string };
  
  return {
    props: {
      user: session.user,
      repository: {
        owner,
        name: repo,
        full_name: `${owner}/${repo}`,
        description: `Analytics for ${repo}`,
        language: 'TypeScript', // This would come from your analysis data
      },
    },
  };
};