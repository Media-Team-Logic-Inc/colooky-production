import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import { Github, Star, GitFork, ExternalLink, Clock } from 'lucide-react';

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
}

interface RepositoriesProps {
  user: any;
  accessToken: string;
}

export default function Repositories({ user, accessToken }: RepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
                      <button
                        onClick={() => {
                          // TODO: Implement repository analysis
                          console.log('Analyzing repository:', repo.full_name);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Analyze Repository
                      </button>
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