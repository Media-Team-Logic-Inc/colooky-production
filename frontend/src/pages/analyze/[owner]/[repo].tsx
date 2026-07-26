import { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { AnalysisHistory } from '../../../lib/supabase';
import Header from '../../../components/layout/Header';
import ImprovedFlexibleSubwayMap from '../../../components/ImprovedFlexibleSubwayMap';
import FileDirectoryTree from '../../../components/FileDirectoryTree';
import { enhanceScenarioWithErrors, addStepNumbers } from '../../../lib/errorDetection';
import { transformToSubwayLayout } from '../../../lib/subwayLayoutGenerator';
import { generateDetailedVisualization, hasDetailedAnalysisData } from '../../../lib/detailedScenarioGenerator';
import { generateIntelligentVisualization } from '../../../lib/intelligentVisualizationGenerator';
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
  ArrowLeft,
  Search,
  X
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
  timestamp?: string;
  repository_info?: {
    owner: string;
    name: string;
    full_name: string;
  };
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
  elements?: Array<{
    id: string;
    name: string;
    type: 'function' | 'class' | 'import';
    file: string;
    line: number;
    language: string;
    content?: string;
  }>;
  dependencies?: Array<{
    from: string;
    to: string;
    type: string;
    line: number;
    detail: string;
  }>;
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
  const codePreviewRef = useRef<HTMLDivElement>(null);
  const [codeViewerFile, setCodeViewerFile] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFileTree, setFilteredFileTree] = useState<FileTreeNode[]>([]);

  // Supported file extensions for analysis
  const supportedExtensions = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.php', '.rb',
    '.css', '.scss', '.sass', '.less', '.html', '.htm', '.vue', '.svelte', '.json', '.xml',
    '.yaml', '.yml', '.md', '.mdx', '.graphql', '.sql', '.sh', '.bash', '.dockerfile',
    '.swift', '.kt', '.dart', '.r', '.scala', '.clj', '.hs', '.elm', '.f90', '.pl', '.lua'
  ]);

  // Filter file tree based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFileTree(fileTree);
      return;
    }

    const filterNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.filter(node => {
        // Check if the current node matches
        const nodeMatches = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           node.path.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (node.type === 'file') {
          return nodeMatches;
        }
        
        if (node.type === 'dir' && node.children) {
          const filteredChildren = filterNodes(node.children);
          
          // Include directory if it matches or has matching children
          if (nodeMatches || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren
            };
          }
        }
        
        return nodeMatches;
      }).map(node => {
        if (node.type === 'dir' && node.children) {
          return {
            ...node,
            children: filterNodes(node.children)
          };
        }
        return node;
      });
    };

    setFilteredFileTree(filterNodes(fileTree));
  }, [searchQuery, fileTree]);

  useEffect(() => {
    loadRepositoryStructure();
    
    // Load analysis history from database
    if (user) {
      fetchAnalysisHistory();
    }
    
    // DISABLED: Don't auto-load persisted file selections - users should start fresh
    // const persistedSelections = localStorage.getItem(`colooky_selections_${repository.owner}_${repository.name}`);
    // if (persistedSelections) {
    //   try {
    //     const parsedSelections = JSON.parse(persistedSelections);
    //     setSelectedFiles(parsedSelections);
    //   } catch (error) {
    //     console.warn('Failed to parse persisted selections:', error);
    //   }
    // }
    
    // DISABLED: Don't auto-load cached analysis - users should start fresh
    // const persistedAnalysis = localStorage.getItem(`colooky_analysis_${repository.owner}_${repository.name}`);
    // if (persistedAnalysis) {
    //   try {
    //     const parsedAnalysis = JSON.parse(persistedAnalysis);
    //     // Only use cached analysis if it's less than 1 hour old
    //     const analysisAge = Date.now() - new Date(parsedAnalysis.timestamp).getTime();
    //     const oneHour = 60 * 60 * 1000;
    //     
    //     if (analysisAge < oneHour && parsedAnalysis.status === 'completed') {
    //       setAnalysis(parsedAnalysis);
    //       setCurrentStep('results');
    //       console.log('Loaded cached analysis results');
    //     } else {
    //       // Clean up old analysis
    //       localStorage.removeItem(`colooky_analysis_${repository.owner}_${repository.name}`);
    //     }
    //   } catch (error) {
    //     console.warn('Failed to parse persisted analysis:', error);
    //     localStorage.removeItem(`colooky_analysis_${repository.owner}_${repository.name}`);
    //   }
    // }
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
      setFilteredFileTree(tree); // Initialize filtered tree
      
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
          const content = atob(fileData.content.replace(/\n/g, ''));
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
          
          // Auto-scroll to highlighted line when clicking nodes
          if (highlightLine && codePreviewRef.current) {
            setTimeout(() => {
              const highlightedLine = codePreviewRef.current?.querySelector(`[data-line-number="${highlightLine}"]`);
              if (highlightedLine) {
                highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const cancelAnalysis = () => {
    setAnalyzing(false);
    setCurrentStep('select');
    setAnalysis(null);
    setError('Analysis cancelled by user');
    
    // Clear any pending timeouts or polling
    // Note: In a real implementation, you would also want to send a cancel request to the server
    setTimeout(() => setError(null), 3000); // Clear error message after 3 seconds
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

  // Save analysis via API route
  const saveAnalysis = async () => {
    if (!analysis || !user) {
      console.warn('No analysis to save or user not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      const analysisData = {
        repository_owner: repository.owner,
        repository_name: repository.name,
        repository_full_name: repository.full_name,
        files_analyzed: selectedFiles,
        analysis_type: selectedFiles.length === 1 ? 'single-file' : 'multi-file',
        scenario_data: analysis
      };

      const response = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const savedAnalysis = await response.json();
        setSavedAnalysisId(savedAnalysis.id);
        await fetchAnalysisHistory();
      } else {
        console.error('Failed to save analysis');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved analysis via API route
  const deleteSavedAnalysis = async () => {
    if (!savedAnalysisId) return;

    try {
      const response = await fetch('/api/analysis/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId: savedAnalysisId }),
      });

      if (response.ok) {
        setSavedAnalysisId(null);
        await fetchAnalysisHistory();
      } else {
        console.error('Failed to delete analysis');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  // Fetch analysis history via API route
  const fetchAnalysisHistory = async () => {
    try {
      const response = await fetch('/api/analysis/history?limit=20');
      if (response.ok) {
        const history = await response.json();
        setAnalysisHistory(history);
      }
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    }
  };

  // Load saved analysis from history
  const loadSavedAnalysis = (historyItem: AnalysisHistory) => {
    try {
      // Restore the file selections
      setSelectedFiles(historyItem.files_analyzed);
      
      // Restore the analysis results
      setAnalysis(historyItem.scenario_data);
      setSavedAnalysisId(historyItem.id);
      
      // Update current step to results
      setCurrentStep('results');
      
      // Show success feedback
      const originalTitle = document.title;
      document.title = `Loaded: ${historyItem.repository_name}`;
      setTimeout(() => {
        document.title = originalTitle;
      }, 2000);
      
    } catch (error) {
      console.error('Error loading saved analysis:', error);
    }
  };

  const renderFileTree = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        <div className="flex items-center py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
          {node.type === 'dir' ? (
            <>
              <button
                onClick={() => toggleDirectory(node.path)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded mr-1"
              >
                {expandedDirs.has(node.path) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <Folder className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-slate-700 dark:text-slate-200">{node.name}</span>
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
                node.supported ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {node.name}
              </span>
              {node.language && node.supported && (
                <span className="ml-2 text-xs text-blue-400">({node.language})</span>
              )}
              {!node.supported && (
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">(unsupported)</span>
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
      
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analysis Status Banner */}
          {analysis && currentStep === 'results' && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      Analysis cached and ready to view!
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm">
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
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline"
                >
                  Start New Analysis
                </button>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="mb-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link
                href="/repositories"
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Repositories
              </Link>
              <span className="text-slate-400">→</span>
              <button
                onClick={() => {
                  setCurrentStep('select');
                  setAnalysis(null);
                  setSelectedFiles([]);
                }}
                className="text-white font-medium hover:text-blue-400 transition-colors cursor-pointer"
              >
                {repository.owner}/{repository.name}
              </button>
              {currentStep === 'results' && selectedFiles.length === 1 && (
                <>
                  <span className="text-slate-400">→</span>
                  <span className="text-blue-400">{selectedFiles[0].split('/').pop()}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-blue-400" />
              <div>
                <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {repository.owner}/{repository.name}
                  {selectedFiles.length === 1 && (
                    <span className="text-blue-400 text-xs ml-2 font-normal">
                      → {selectedFiles[0].split('/').pop()}
                    </span>
                  )}
                  {selectedFiles.length > 1 && (
                    <span className="text-blue-400 text-xs ml-2 font-normal">
                      → {selectedFiles.length} files
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Select Files to Analyze
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
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
                  
                  {/* SEARCH INPUT - EXACTLY WHAT YOU ASKED FOR! */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search files... (e.g., component, .tsx, utils)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {filteredFileTree.length === 0 
                          ? `No files found matching "${searchQuery}"` 
                          : `Found files matching "${searchQuery}"`
                        }
                      </div>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      <span className="ml-3 text-slate-600 dark:text-slate-300">Loading repository structure...</span>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded p-4 bg-slate-50 dark:bg-slate-900">
                      {renderFileTree(filteredFileTree)}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Analysis Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Selected Files</span>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedFiles.length}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Primary Language</span>
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
                        <span>{Math.round(analysis.progress)}%</span>
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
                
                {/* Cancel button */}
                <div className="mt-6">
                  <button
                    onClick={cancelAnalysis}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results - Responsive Layout */}
          {currentStep === 'results' && analysis?.visualization && (
            <div>
              {/* Header - EXTRA SMALL */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <h2 className="text-xs font-medium text-white">Analysis Complete</h2>
                    </div>
                    
                    {/* Compact Load Saved Analysis Button */}
                    {user && analysisHistory.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        <span className="text-slate-400 text-xs">or</span>
                        <button
                          onClick={() => {
                            const recentAnalysis = analysisHistory[0];
                            if (recentAnalysis) {
                              loadSavedAnalysis(recentAnalysis);
                            }
                          }}
                          className="px-1 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                          title={`Load from ${analysisHistory.length} saved analyses`}
                        >
                          📁 ({analysisHistory.length})
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => exportAnalysis('json')}
                      className="px-1 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportAnalysis('csv')}
                      className="px-1 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      CSV
                    </button>
                    
                    {/* Save/Delete Analysis Buttons */}
                    <div className="border-l border-slate-600 pl-1 ml-1 flex items-center gap-1">
                      {savedAnalysisId ? (
                        <button
                          onClick={deleteSavedAnalysis}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                          title="Delete saved analysis"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={saveAnalysis}
                          disabled={isSaving}
                          className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded text-xs font-medium transition-colors"
                          title="Save analysis to your history"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      )}
                      
                      {/* Load Saved Analysis Button */}
                      {user && analysisHistory.length > 0 && (
                        <button
                          onClick={() => {
                            const recentAnalysis = analysisHistory[0];
                            if (recentAnalysis) {
                              loadSavedAnalysis(recentAnalysis);
                            }
                          }}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                          title={`Load most recent analysis: ${analysisHistory[0]?.repository_name}`}
                        >
                          Load Recent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            {/* Navigation & Analysis Summary Combined - SPACE EFFICIENT */}
            <div className="mb-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex flex-col gap-4">
                {/* Navigation Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentStep('select');
                      setAnalysis(null);
                      setSelectedFiles([]);
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Analyze More Files
                  </button>
                  <Link
                    href={`/analytics/${repository.owner}/${repository.name}`}
                    className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    View Full Analytics
                  </Link>
                  <Link
                    href="/repositories"
                    className="px-5 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
                  >
                    All Repositories
                  </Link>
                </div>

                {/* COMPACT Summary & Insights - Horizontal Layout */}
                {analysis.summary && (
                  <div className="border-t border-slate-200 dark:border-gray-600 pt-3">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Summary Stats - Left */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          📊 Summary
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-center">
                            <div className="font-bold text-blue-400 text-sm">{analysis.summary.supported_files}</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">Files</div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-center">
                            <div className="font-bold text-green-400 text-sm">{analysis.summary.functions}</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">Funcs</div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-center">
                            <div className="font-bold text-purple-400 text-sm">{analysis.summary.classes}</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">Classes</div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-center">
                            <div className="font-bold text-orange-400 text-sm">{analysis.summary.imports}</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">Imports</div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-center">
                            <div className="font-bold text-cyan-400 text-xs truncate">{analysis.summary.main_language}</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">Lang</div>
                          </div>
                        </div>
                      </div>

                      {/* Insights - Right */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          🔍 Insights
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2">
                            <div className="text-blue-400 font-medium text-xs">Architecture</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">
                              {analysis.summary.functions > analysis.summary.classes * 3 ? 'Functional' : 
                               analysis.summary.classes > analysis.summary.functions ? 'OOP' : 'Hybrid'}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2">
                            <div className="text-green-400 font-medium text-xs">Density</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">
                              {Math.round((analysis.summary.functions + analysis.summary.classes) / analysis.summary.supported_files)} elem/file
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2">
                            <div className="text-purple-400 font-medium text-xs">Dependencies</div>
                            <div className="text-slate-600 dark:text-slate-300 text-xs">
                              {analysis.summary.imports > analysis.summary.supported_files * 2 ? 'Modular' : 
                               analysis.summary.imports < analysis.summary.supported_files ? 'Self-contained' : 'Balanced'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              {/* MAXIMUM WIDTH Visualization - Full viewport usage */}
              <div className="w-full">
                <div className="h-[800px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 relative overflow-hidden">
                  <ImprovedFlexibleSubwayMap
                    scenario={(() => {
                      let professionalVisualization = analysis.visualization;
                      if (professionalVisualization) {
                        professionalVisualization = transformToSubwayLayout(professionalVisualization);
                        professionalVisualization = enhanceScenarioWithErrors(professionalVisualization, analysis);
                        professionalVisualization = addStepNumbers(professionalVisualization);
                      }
                      return professionalVisualization;
                    })()}
                    onScenarioChange={() => {}}
                    availableScenarios={[analysis.visualization]}
                    repositoryInfo={{
                      owner: repository.owner,
                      name: repository.name,
                      full_name: repository.full_name
                    }}
                    analysisInfo={{
                      selectedFiles: selectedFiles,
                      fileCount: selectedFiles.length,
                      analysisType: selectedFiles.length === 1 ? 'single-file' : 'multi-file'
                    }}
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
                    onNodeSelect={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* Development Panel - Repository Files & Code Preview Side by Side */}
            <div>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Code Preview - Left Side (Switched) */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="border-b border-slate-700 p-4">
                    <div className="text-sm font-medium text-slate-300">Code Preview</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {selectedFileContent ? 
                        `${selectedFileContent.path} (${selectedFileContent.language})` : 
                        "Click a node in the visualization or file in the tree to view code"
                      }
                    </div>
                  </div>
                  <div ref={codePreviewRef} className="p-4 h-80 overflow-auto">
                    {selectedFileContent ? (
                      <div className="relative">
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                          <code>
                            {selectedFileContent.content.split('\n').map((line, index) => {
                              const lineNumber = index + 1;
                              const isHighlighted = selectedFileContent.highlightLine === lineNumber;
                              return (
                                <div 
                                  key={lineNumber}
                                  data-line-number={lineNumber}
                                  className={`${isHighlighted ? 'bg-yellow-400/20 border-l-4 border-yellow-400 pl-2 -ml-2' : ''}`}
                                  style={isHighlighted ? { animation: 'pulse 2s infinite' } : {}}
                                >
                                  <span className="text-slate-500 text-xs mr-3 select-none inline-block w-8 text-right">
                                    {lineNumber}
                                  </span>
                                  {line}
                                </div>
                              );
                            })}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <div>Click a node or file to view code</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Repository Files - Right Side (Switched) */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="border-b border-slate-700 p-4">
                    <div className="text-sm font-medium text-slate-300">Repository Files</div>
                    <div className="text-xs text-slate-400 mt-1">• Green files are analyzable • Click to analyze individual files</div>
                  </div>
                  <div className="p-4 h-80 overflow-auto">
                    <FileDirectoryTree 
                      owner={repository.owner}
                      repo={repository.name}
                      onFileSelect={(filePath) => {
                        setSelectedFiles([filePath]);
                        setAnalysis(null);
                        // Trigger new analysis for selected file
                        startAnalysis();
                      }}
                    />
                  </div>
                </div>
              </div>
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