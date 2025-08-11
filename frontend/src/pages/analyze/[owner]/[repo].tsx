import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import FlexibleSubwayMap from '../../../components/FlexibleSubwayMap';
import { 
  Github, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface Repository {
  owner: string;
  name: string;
  full_name: string;
  description: string;
  language: string;
  private: boolean;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileTreeNode[];
  selected?: boolean;
  supported?: boolean;
  language?: string;
}

interface AnalysisResult {
  id: string;
  repository: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  files_analyzed: number;
  total_files: number;
  error_message?: string;
  visualization?: any;
  summary?: {
    total_files: number;
    supported_files: number;
    functions: number;
    classes: number;
    imports: number;
    complexity_score: number;
    main_language: string;
    file_types: { [key: string]: number };
  };
}

interface AnalyzeRepositoryProps {
  user: any;
  accessToken: string;
  repository: Repository;
}

export default function AnalyzeRepository({ user, accessToken, repository }: AnalyzeRepositoryProps) {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<'select' | 'analyze' | 'results'>('select');
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<{path: string, content: string, language: string, highlightLine?: number} | null>(null);
  const [codeViewerFile, setCodeViewerFile] = useState<string | null>(null);

  // Supported file extensions for analysis
  const supportedExtensions = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.php', '.rb',
    '.css', '.scss', '.sass', '.less', '.html', '.htm', '.vue', '.svelte', '.json', '.xml',
    '.yaml', '.yml', '.md', '.mdx', '.graphql', '.sql', '.sh', '.bash', '.dockerfile',
    '.swift', '.kt', '.dart', '.r', '.scala', '.clj', '.hs', '.elm', '.f90', '.pl', '.lua'
  ]);

  useEffect(() => {
    loadRepositoryStructure();
    
    // Load persisted file selections
    const persistedSelections = localStorage.getItem(`colooky_selections_${repository.owner}_${repository.name}`);
    if (persistedSelections) {
      try {
        const parsedSelections = JSON.parse(persistedSelections);
        setSelectedFiles(parsedSelections);
      } catch (error) {
        console.warn('Failed to parse persisted selections:', error);
      }
    }
    
    // Load persisted analysis results
    const persistedAnalysis = localStorage.getItem(`colooky_analysis_${repository.owner}_${repository.name}`);
    if (persistedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(persistedAnalysis);
        // Only use cached analysis if it's less than 1 hour old
        const analysisAge = Date.now() - new Date(parsedAnalysis.timestamp).getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (analysisAge < oneHour && parsedAnalysis.status === 'completed') {
          setAnalysis(parsedAnalysis);
          setCurrentStep('results');
          console.log('Loaded cached analysis results');
        } else {
          // Clean up old analysis
          localStorage.removeItem(`colooky_analysis_${repository.owner}_${repository.name}`);
        }
      } catch (error) {
        console.warn('Failed to parse persisted analysis:', error);
        localStorage.removeItem(`colooky_analysis_${repository.owner}_${repository.name}`);
      }
    }
  }, []);

  const loadRepositoryStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://api.github.com/repos/${repository.owner}/${repository.name}/contents`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const contents = await response.json();
      const tree = await buildFileTree(contents, '');
      setFileTree(tree);
      
      // Don't auto-select files - let user choose
      
    } catch (err) {
      console.error('Error loading repository structure:', err);
      setError(err instanceof Error ? err.message : 'Failed to load repository structure');
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = async (contents: any[], currentPath: string): Promise<FileTreeNode[]> => {
    const tree: FileTreeNode[] = [];
    
    for (const item of contents) {
      const extension = item.name.includes('.') ? '.' + item.name.split('.').pop() : '';
      const node: FileTreeNode = {
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        size: item.size,
        selected: false,
        supported: supportedExtensions.has(extension.toLowerCase()),
        language: getLanguageFromExtension(extension)
      };

      if (item.type === 'dir') {
        // Always try to load directory contents, but only auto-expand important ones
        try {
          const dirResponse = await fetch(item.url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (dirResponse.ok) {
            const dirContents = await dirResponse.json();
            node.children = await buildFileTree(dirContents, item.path);
            
            // Auto-expand important directories
            if (shouldExpandDirectory(item.name)) {
              setExpandedDirs(prev => new Set(prev).add(item.path));
            }
          }
        } catch (error) {
          console.warn(`Could not load directory ${item.path}:`, error);
        }
      }

      tree.push(node);
    }

    return tree.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  const shouldExpandDirectory = (dirName: string) => {
    const importantDirs = [
      'src', 'lib', 'components', 'pages', 'utils', 'services', 'hooks', 'contexts', 
      'auth', 'layout', 'subscription', 'types', 'ui', 'api', 'config', 'constants',
      'helpers', 'middleware', 'models', 'controllers', 'views', 'public', 'assets',
      'styles', 'scss', 'css', 'app', 'routes', 'store', 'reducers', 'actions'
    ];
    return importantDirs.includes(dirName.toLowerCase());
  };

  const getLanguageFromExtension = (ext: string): string => {
    const languageMap: { [key: string]: string } = {
      '.js': 'JavaScript', '.jsx': 'JavaScript',
      '.ts': 'TypeScript', '.tsx': 'TypeScript',
      '.py': 'Python', '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
      '.cpp': 'C++', '.c': 'C', '.php': 'PHP', '.rb': 'Ruby',
      '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
      '.html': 'HTML', '.htm': 'HTML', '.vue': 'Vue', '.svelte': 'Svelte',
      '.json': 'JSON', '.xml': 'XML', '.yaml': 'YAML', '.yml': 'YAML',
      '.md': 'Markdown', '.mdx': 'MDX', '.graphql': 'GraphQL', '.sql': 'SQL',
      '.sh': 'Shell', '.bash': 'Bash', '.dockerfile': 'Docker',
      '.swift': 'Swift', '.kt': 'Kotlin', '.dart': 'Dart', '.r': 'R',
      '.scala': 'Scala', '.clj': 'Clojure', '.hs': 'Haskell', '.elm': 'Elm'
    };
    return languageMap[ext.toLowerCase()] || 'Text';
  };

  const autoSelectSupportedFiles = (tree: FileTreeNode[]) => {
    const selected: string[] = [];
    
    const traverse = (nodes: FileTreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file' && node.supported) {
          selected.push(node.path);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(tree);
    setSelectedFiles(selected.slice(0, 50)); // Limit initial selection
  };

  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev => {
      const newSelection = prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path];
      
      // Persist selections to localStorage
      localStorage.setItem(`colooky_selections_${repository.owner}_${repository.name}`, JSON.stringify(newSelection));
      return newSelection;
    });
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const selectAllSupportedFiles = () => {
    const supported: string[] = [];
    
    const traverse = (nodes: FileTreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file' && node.supported) {
          supported.push(node.path);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(fileTree);
    setSelectedFiles(supported);
    // Persist selections to localStorage
    localStorage.setItem(`colooky_selections_${repository.owner}_${repository.name}`, JSON.stringify(supported));
  };

  const unselectAllFiles = () => {
    setSelectedFiles([]);
    // Clear persisted selections
    localStorage.removeItem(`colooky_selections_${repository.owner}_${repository.name}`);
  };

  const exportAnalysis = (format: 'json' | 'csv') => {
    if (!analysis || !analysis.summary) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${repository.name}_analysis_${timestamp}`;

    if (format === 'json') {
      // Export as JSON
      const exportData = {
        repository: repository.full_name,
        analysis_date: new Date().toISOString(),
        summary: analysis.summary,
        visualization: {
          total_nodes: analysis.visualization?.nodes?.length || 0,
          total_connections: analysis.visualization?.connections?.length || 0,
          node_types: analysis.visualization?.nodes?.reduce((acc: any, node: any) => {
            const type = node.details?.[0]?.split(':')[0] || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}) || {}
        },
        files_analyzed: selectedFiles,
        export_timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Export as CSV
      const csvRows = [
        ['Repository', 'Functions', 'Classes', 'Imports', 'Complexity', 'Language', 'Files Analyzed', 'Analysis Date'],
        [
          repository.full_name,
          analysis.summary.functions.toString(),
          analysis.summary.classes.toString(),
          analysis.summary.imports.toString(),
          analysis.summary.complexity_score.toString(),
          analysis.summary.main_language,
          analysis.summary.supported_files.toString(),
          new Date().toLocaleDateString()
        ]
      ];

      // Add node details if available
      if (analysis.visualization?.nodes) {
        csvRows.push([]);
        csvRows.push(['Node Details']);
        csvRows.push(['Type', 'Name', 'File', 'Line']);
        
        analysis.visualization.nodes.forEach((node: any) => {
          const details = node.details || [];
          const type = details[0]?.split(':')[1]?.trim() || 'Unknown';
          const file = details[1]?.replace('File: ', '') || 'Unknown';
          csvRows.push([type, node.title, file, '']);
        });
      }

      const csvContent = csvRows.map(row => 
        row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const viewFileContent = async (filePath: string, highlightLine?: number) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository.owner}/${repository.name}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const fileData = await response.json();
        
        if (fileData.content && fileData.encoding === 'base64') {
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const extension = filePath.split('.').pop()?.toLowerCase() || '';
          const language = getLanguageFromExtension('.' + extension);
          
          setSelectedFileContent({
            path: filePath,
            content,
            language,
            highlightLine
          });
          setCodeViewerFile(filePath);
          setShowCodeViewer(true);
        }
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setCurrentStep('analyze');
      setError(null);

      // Create analysis job
      const response = await fetch('/api/analyze/repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository: repository.full_name,
          files: selectedFiles,
          accessToken
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const analysisJob = await response.json();
      
      // Poll for analysis results
      pollAnalysisStatus(analysisJob.id);
      
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setAnalyzing(false);
      setCurrentStep('select');
    }
  };

  const pollAnalysisStatus = async (analysisId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/analyze/status/${analysisId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check analysis status');
        }

        const result: AnalysisResult = await response.json();
        setAnalysis(result);

        if (result.status === 'completed') {
          setAnalyzing(false);
          setCurrentStep('results');
          
          // Persist analysis results with timestamp
          const analysisWithTimestamp = {
            ...result,
            timestamp: new Date().toISOString(),
            repository_info: {
              owner: repository.owner,
              name: repository.name,
              full_name: repository.full_name
            }
          };
          
          localStorage.setItem(
            `colooky_analysis_${repository.owner}_${repository.name}`, 
            JSON.stringify(analysisWithTimestamp)
          );
          
          // Also maintain a list of recently analyzed repositories
          const recentAnalyses = JSON.parse(localStorage.getItem('colooky_recent_analyses') || '[]');
          const newEntry = {
            owner: repository.owner,
            name: repository.name,
            full_name: repository.full_name,
            timestamp: new Date().toISOString(),
            summary: result.summary
          };
          
          // Remove duplicate entry if exists
          const filteredAnalyses = recentAnalyses.filter(
            (item: any) => item.full_name !== repository.full_name
          );
          
          // Add new entry at the beginning and limit to 10 recent analyses
          const updatedAnalyses = [newEntry, ...filteredAnalyses].slice(0, 10);
          localStorage.setItem('colooky_recent_analyses', JSON.stringify(updatedAnalyses));
        } else if (result.status === 'error') {
          setError(result.error_message || 'Analysis failed');
          setAnalyzing(false);
          setCurrentStep('select');
        } else {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Error polling analysis status:', err);
        setError('Failed to get analysis status');
        setAnalyzing(false);
        setCurrentStep('select');
      }
    };

    poll();
  };

  const renderFileTree = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        <div className="flex items-center py-1 hover:bg-slate-700/50 rounded">
          {node.type === 'dir' ? (
            <>
              <button
                onClick={() => toggleDirectory(node.path)}
                className="p-1 hover:bg-slate-600 rounded mr-1"
              >
                {expandedDirs.has(node.path) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <Folder className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-slate-200">{node.name}</span>
            </>
          ) : (
            <>
              <div className="w-6" />
              <input
                type="checkbox"
                checked={selectedFiles.includes(node.path)}
                onChange={() => toggleFileSelection(node.path)}
                disabled={!node.supported}
                className="mr-2"
              />
              <File className={`w-4 h-4 mr-2 ${
                node.supported ? 'text-green-400' : 'text-gray-500'
              }`} />
              <span className={`text-sm ${
                node.supported ? 'text-slate-200' : 'text-slate-500'
              }`}>
                {node.name}
              </span>
              {node.language && node.supported && (
                <span className="ml-2 text-xs text-blue-400">({node.language})</span>
              )}
              {!node.supported && (
                <span className="ml-2 text-xs text-slate-500">(unsupported)</span>
              )}
            </>
          )}
        </div>
        
        {node.type === 'dir' && expandedDirs.has(node.path) && node.children && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <Head>
        <title>Analyze {repository.name} - Colooky</title>
        <meta name="description" content={`Analyze the ${repository.name} repository`} />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analysis Status Banner */}
          {analysis && currentStep === 'results' && (
            <div className="mb-6 bg-green-900/20 border border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-300 font-medium">
                      Analysis cached and ready to view!
                    </p>
                    <p className="text-green-400 text-sm">
                      Analyzed {new Date(analysis.timestamp || '').toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrentStep('select');
                    setAnalysis(null);
                    localStorage.removeItem(`colooky_analysis_${repository.owner}_${repository.name}`);
                  }}
                  className="text-sm text-green-400 hover:text-green-300 underline"
                >
                  Start New Analysis
                </button>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/repositories" 
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Repositories
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Github className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {repository.owner}/{repository.name}
                </h1>
                <p className="text-slate-400">
                  {repository.description || 'Analyze this repository with Colooky'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: File Selection */}
          {currentStep === 'select' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Select Files to Analyze
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Choose specific files for focused analysis and visualization
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllSupportedFiles}
                        className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={unselectAllFiles}
                        className="px-3 py-2 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      <span className="ml-3 text-slate-300">Loading repository structure...</span>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border border-slate-600 rounded p-4 bg-slate-900">
                      {renderFileTree(fileTree)}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Analysis Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-slate-400">Selected Files</span>
                      <div className="text-2xl font-bold text-white">{selectedFiles.length}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-slate-400">Primary Language</span>
                      <div className="text-lg text-blue-400">{repository.language || 'Mixed'}</div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={startAnalysis}
                        disabled={selectedFiles.length === 0 || analyzing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Start Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Analysis in Progress */}
          {currentStep === 'analyze' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-white mb-2">Analyzing Repository</h2>
                  <p className="text-slate-400">
                    We're analyzing your code structure and building the visualization...
                  </p>
                </div>

                {analysis && (
                  <div className="space-y-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between text-sm text-slate-300 mb-2">
                        <span>Progress</span>
                        <span>{analysis.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analysis.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">
                          {analysis.files_analyzed}
                        </div>
                        <div className="text-slate-400">Files Analyzed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-300">
                          {analysis.total_files}
                        </div>
                        <div className="text-slate-400">Total Files</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 'results' && analysis?.visualization && (
            <div>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <h2 className="text-2xl font-bold text-white">Analysis Complete!</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCodeViewer(!showCodeViewer)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {showCodeViewer ? 'Hide Code' : 'Show Code'}
                    </button>
                    <button
                      onClick={() => exportAnalysis('json')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => exportAnalysis('csv')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
                
                {analysis.summary && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysis.summary.supported_files}
                        </div>
                        <div className="text-sm text-slate-400">Analyzed Files</div>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {analysis.summary.functions}
                        </div>
                        <div className="text-sm text-slate-400">Functions</div>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysis.summary.classes}
                        </div>
                        <div className="text-sm text-slate-400">Classes</div>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {analysis.summary.imports}
                        </div>
                        <div className="text-sm text-slate-400">Imports</div>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {analysis.summary.complexity_score}
                        </div>
                        <div className="text-sm text-slate-400">Complexity</div>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                        <div className="text-lg font-bold text-slate-300">
                          {analysis.summary.main_language}
                        </div>
                        <div className="text-sm text-slate-400">Language</div>
                      </div>
                    </div>

                    {/* Enhanced insights panel */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">🔍 Code Insights</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-blue-400 font-medium">Architecture Pattern</div>
                          <div className="text-slate-300">
                            {analysis.summary.functions > analysis.summary.classes * 3 ? 'Functional-oriented' : 
                             analysis.summary.classes > analysis.summary.functions ? 'Object-oriented' : 'Hybrid approach'}
                          </div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-green-400 font-medium">Code Density</div>
                          <div className="text-slate-300">
                            {Math.round((analysis.summary.functions + analysis.summary.classes) / analysis.summary.supported_files)} elements/file
                          </div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-purple-400 font-medium">Dependency Style</div>
                          <div className="text-slate-300">
                            {analysis.summary.imports > analysis.summary.supported_files * 2 ? 'Highly modular' : 
                             analysis.summary.imports < analysis.summary.supported_files ? 'Self-contained' : 'Balanced imports'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Repository Visualization with Code Viewer */}
              <div className={`grid gap-6 ${showCodeViewer ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="min-w-0">
                  <FlexibleSubwayMap 
                    scenario={analysis.visualization}
                    onScenarioChange={() => {}}
                    availableScenarios={[analysis.visualization]}
                    onNodeClick={(node) => {
                      // Extract file path and line number from node details
                      const fileDetail = node.details?.find((detail: string) => detail.startsWith('File: '));
                      if (fileDetail) {
                        const fileInfo = fileDetail.replace('File: ', '');
                        const [filePath, lineNumber] = fileInfo.split(':');
                        const highlightLine = lineNumber ? parseInt(lineNumber) : undefined;
                        viewFileContent(filePath, highlightLine);
                      }
                    }}
                  />
                </div>
                
                {showCodeViewer && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium text-sm">
                            {selectedFileContent ? selectedFileContent.path : 'Select a node to view code'}
                          </span>
                        </div>
                        {selectedFileContent && (
                          <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                            {selectedFileContent.language}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-[500px] overflow-auto">
                      {selectedFileContent ? (
                        <div className="text-sm">
                          {selectedFileContent.content.split('\n').map((line, index) => {
                            const lineNumber = index + 1;
                            const isHighlighted = selectedFileContent.highlightLine === lineNumber;
                            return (
                              <div
                                key={index}
                                className={`flex ${isHighlighted ? 'bg-yellow-900/30 border-l-4 border-yellow-400' : ''}`}
                              >
                                <span className="text-slate-500 text-right pr-4 py-1 w-12 flex-shrink-0 select-none border-r border-slate-700">
                                  {lineNumber}
                                </span>
                                <pre className="text-slate-300 pl-4 py-1 flex-1 whitespace-pre-wrap">
                                  <code>{line || ' '}</code>
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <div className="text-center">
                            <File className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                            <p>Click a node in the visualization to view its code</p>
                            <p className="text-xs mt-2">Line numbers and highlighting included</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setCurrentStep('select');
                    setAnalysis(null);
                    setSelectedFiles([]);
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  ← Back to File Selection
                </button>
                <Link
                  href={`/analytics/${repository.owner}/${repository.name}`}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Full Analytics
                </Link>
                <Link
                  href="/repositories"
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
                >
                  All Repositories
                </Link>
              </div>
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

  const { owner, repo } = context.params as { owner: string; repo: string };
  
  try {
    // Fetch repository info from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Repository not found');
    }

    const repository = await response.json();
    
    return {
      props: {
        user: session.user,
        accessToken: session.accessToken,
        repository: {
          owner: repository.owner.login,
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          language: repository.language,
          private: repository.private,
        },
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};