import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import { Github, Star, GitFork, ExternalLink, Clock, Zap, BarChart3, Trash2 } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  size: number;
  owner: {
    login: string;
  };
}

interface RepositoriesProps {
  user: any;
  accessToken: string;
}

interface RecentAnalysis {
  owner: string;
  name: string;
  full_name: string;
  timestamp: string;
  summary?: {
    functions: number;
    classes: number;
    imports: number;
    complexity_score: number;
    main_language: string;
    supported_files: number;
  };
}

export default function Repositories({ user, accessToken }: RepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load recent analyses from localStorage
    const loadRecentAnalyses = () => {
      try {
        const recent = localStorage.getItem('colooky_recent_analyses');
        if (recent) {
          setRecentAnalyses(JSON.parse(recent));
        }
      } catch (error) {
        console.warn('Failed to load recent analyses:', error);
      }
    };
    
    loadRecentAnalyses();
    
    const fetchRepositories = async () => {
      try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();
        setRepositories(repos);
      } catch (err) {
        console.error('Error fetching repositories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchRepositories();
    } else {
      setError('No GitHub access token available');
      setLoading(false);
    }
  }, [accessToken]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'Java': '#b07219',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'C++': '#f34b7d',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#fa7343',
      'Kotlin': '#A97BFF',
    };
    return colors[language || ''] || '#6b7280';
  };
  
  const removeRecentAnalysis = (fullName: string) => {
    const updated = recentAnalyses.filter(analysis => analysis.full_name !== fullName);
    setRecentAnalyses(updated);
    localStorage.setItem('colooky_recent_analyses', JSON.stringify(updated));
    
    // Also remove the cached analysis
    const [owner, name] = fullName.split('/');
    localStorage.removeItem(`colooky_analysis_${owner}_${name}`);
  };
  
  const clearAllRecentAnalyses = () => {
    // Clear all cached analyses
    recentAnalyses.forEach(analysis => {
      const [owner, name] = analysis.full_name.split('/');
      localStorage.removeItem(`colooky_analysis_${owner}_${name}`);
    });
    
    // Clear the recent analyses list
    setRecentAnalyses([]);
    localStorage.removeItem('colooky_recent_analyses');
  };

  return (
    <>
      <Head>
        <title>Your Repositories - Colooky</title>
        <meta name="description" content="View and analyze your GitHub repositories" />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Github className="w-8 h-8 text-blue-400" />
              Your Repositories
            </h1>
            <p className="text-slate-400 mt-2">
              {user?.name && `Connected as ${user.name} • `}
              Select a repository to analyze its code structure
            </p>
          </div>
          
          {/* Recent Analyses Section */}
          {recentAnalyses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Recent Analyses
                </h2>
                <button
                  onClick={clearAllRecentAnalyses}
                  className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear all cached analyses"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid gap-3">
                {recentAnalyses.map((analysis) => (
                  <div
                    key={analysis.full_name}
                    className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-4 hover:border-blue-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {analysis.full_name}
                          </h3>
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Analyzed
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{new Date(analysis.timestamp).toLocaleDateString()}</span>
                          {analysis.summary && (
                            <>
                              <span>{analysis.summary.functions} functions</span>
                              <span>{analysis.summary.classes} classes</span>
                              <span>{analysis.summary.supported_files} files</span>
                              {analysis.summary.main_language && (
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getLanguageColor(analysis.summary.main_language) }}
                                  />
                                  <span>{analysis.summary.main_language}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => removeRecentAnalysis(analysis.full_name)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove from recent analyses"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/analyze/${analysis.owner}/${analysis.name}`}
                          className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Analysis
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-slate-300">Loading your repositories...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
              <h3 className="text-red-400 font-semibold mb-2">Error loading repositories</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-slate-400 text-sm mt-2">
                Make sure you've granted repository access when signing in with GitHub.
              </p>
            </div>
          )}

          {!loading && !error && repositories.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <Github className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No repositories found</h3>
              <p className="text-slate-400">
                Create your first repository on GitHub to start analyzing your code with Colooky.
              </p>
            </div>
          )}

          {!loading && !error && repositories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Github className="w-5 h-5 text-blue-400" />
                All Repositories
              </h2>
              <div className="grid gap-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {repo.name}
                        </h3>
                        {repo.private && (
                          <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full">
                            Private
                          </span>
                        )}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      
                      {repo.description && (
                        <p className="text-slate-300 text-sm mb-3">{repo.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            <span>{repo.language}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>{repo.stargazers_count}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          <span>{repo.forks_count}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Updated {formatDate(repo.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Link
                        href={`/analyze/${repo.owner.login}/${repo.name}`}
                        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Analyze Repository
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      accessToken: session.accessToken || null,
    },
  };
};