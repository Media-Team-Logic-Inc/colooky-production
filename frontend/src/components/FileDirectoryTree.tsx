import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Search, X } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileItem[];
  size?: number;
}

interface FileDirectoryTreeProps {
  owner: string;
  repo: string;
  onFileSelect: (filePath: string) => void;
}

const FileDirectoryTree: React.FC<FileDirectoryTreeProps> = ({ owner, repo, onFileSelect }) => {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([''])); // Root expanded by default
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    fetchFileTree();
  }, [owner, repo]);

  // Update filtered files when search query or file tree changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles([]);
      return;
    }

    const flattenFiles = (items: FileItem[]): FileItem[] => {
      let files: FileItem[] = [];
      items.forEach(item => {
        if (item.type === 'file') {
          files.push(item);
        }
        if (item.children) {
          files = files.concat(flattenFiles(item.children));
        }
      });
      return files;
    };

    const allFiles = flattenFiles(fileTree);
    const filtered = allFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredFiles(filtered);
  }, [searchQuery, fileTree]);

  const fetchFileTree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/github/tree/${owner}/${repo}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch repository tree: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert GitHub tree to hierarchical structure
      const tree = buildFileTree(data.tree || []);
      setFileTree(tree);
    } catch (error) {
      console.error('Error fetching file tree:', error);
      setError(error instanceof Error ? error.message : 'Failed to load file tree');
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (items: any[]): FileItem[] => {
    const tree: FileItem[] = [];
    const pathMap = new Map<string, FileItem>();
    
    // First pass: create all items
    items.forEach(item => {
      if (item.type === 'tree' || item.type === 'blob') {
        const fileItem: FileItem = {
          name: item.path.split('/').pop() || item.path,
          path: item.path,
          type: item.type === 'tree' ? 'dir' : 'file',
          children: item.type === 'tree' ? [] : undefined,
          size: item.size
        };
        pathMap.set(item.path, fileItem);
      }
    });
    
    // Second pass: build hierarchy
    items.forEach(item => {
      const fileItem = pathMap.get(item.path);
      if (!fileItem) return;
      
      const pathParts = item.path.split('/');
      if (pathParts.length === 1) {
        // Root level item
        tree.push(fileItem);
      } else {
        // Find parent
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = pathMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(fileItem);
        }
      }
    });
    
    // Sort: directories first, then files, both alphabetically
    const sortItems = (items: FileItem[]): FileItem[] => {
      return items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined
      }));
    };
    
    return sortItems(tree);
  };

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isAnalyzableFile = (filename: string): boolean => {
    const analyzableExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rb', 'php', 'swift', 'kt'];
    const ext = getFileExtension(filename);
    return analyzableExtensions.includes(ext);
  };

  const renderSearchResult = (item: FileItem): React.ReactNode => {
    const isAnalyzable = item.type === 'file' && isAnalyzableFile(item.name);
    
    return (
      <div
        key={item.path}
        className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-colors ${
          isAnalyzable 
            ? 'hover:bg-slate-600 bg-slate-700/50 text-slate-200 hover:text-white border border-slate-600' 
            : 'text-slate-400 hover:bg-slate-700/30'
        }`}
        onClick={() => {
          if (isAnalyzable) {
            onFileSelect(item.path);
            setSearchQuery(''); // Clear search after selection
          }
        }}
      >
        <File className={`w-4 h-4 ${isAnalyzable ? 'text-green-400' : 'text-slate-500'}`} />
        <div className="flex-1">
          <div className={`text-sm ${isAnalyzable ? 'font-medium' : ''}`}>
            {highlightMatch(item.name, searchQuery)}
          </div>
          <div className="text-xs text-slate-400 truncate">
            {highlightMatch(item.path, searchQuery)}
          </div>
        </div>
        {isAnalyzable && (
          <span className="text-xs text-green-400 font-medium">●</span>
        )}
      </div>
    );
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => (
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-400 text-black px-1 rounded">{part}</span>
      ) : part
    ));
  };

  const renderFileItem = (item: FileItem, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedDirs.has(item.path);
    const isAnalyzable = item.type === 'file' && isAnalyzableFile(item.name);
    
    return (
      <div key={item.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded text-xs cursor-pointer transition-colors ${
            isAnalyzable 
              ? 'hover:bg-slate-600 text-slate-200 hover:text-white' 
              : 'text-slate-400 hover:bg-slate-700'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'dir') {
              toggleDirectory(item.path);
            } else if (isAnalyzable) {
              onFileSelect(item.path);
            }
          }}
        >
          {item.type === 'dir' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
              <Folder className="w-3 h-3 text-blue-400" />
              <span>{item.name}</span>
            </>
          ) : (
            <>
              <div className="w-3" /> {/* Spacer for alignment */}
              <File className={`w-3 h-3 ${isAnalyzable ? 'text-green-400' : 'text-slate-500'}`} />
              <span className={isAnalyzable ? 'font-medium' : ''}>{item.name}</span>
              {isAnalyzable && (
                <span className="ml-auto text-[10px] text-green-400">●</span>
              )}
            </>
          )}
        </div>
        
        {item.type === 'dir' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-xs text-slate-400 py-4">
        Loading repository files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 py-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="text-xs">
      {/* Search Input */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search files... (e.g., component, .tsx, utils)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-8 py-2 text-xs bg-slate-700 border border-slate-600 rounded focus:border-blue-400 focus:outline-none text-white placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="max-h-80 overflow-y-auto">
        {searchQuery.trim() ? (
          // Search Results View
          <div>
            <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between">
              <span>
                {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
              </span>
              <span className="text-green-400">• Green = analyzable</span>
            </div>
            {filteredFiles.length > 0 ? (
              <div className="space-y-1">
                {filteredFiles.map(file => renderSearchResult(file))}
              </div>
            ) : (
              <div className="text-slate-400 py-8 text-center">
                <div className="text-lg mb-2">🔍</div>
                <div>No files found matching "{searchQuery}"</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Try searching for file names, extensions, or paths
                </div>
              </div>
            )}
          </div>
        ) : (
          // Normal Tree View
          <div>
            <div className="text-[10px] text-slate-500 mb-2">
              • Green files are analyzable • Click to analyze • Use search to find specific files
            </div>
            {fileTree.length > 0 ? (
              <div className="space-y-0.5">
                {fileTree.map(item => renderFileItem(item))}
              </div>
            ) : (
              <div className="text-slate-400 py-4">
                No files found in repository
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDirectoryTree;