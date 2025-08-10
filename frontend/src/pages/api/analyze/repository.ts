import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob, AnalysisResult } from '../../../types/analysis';

// Initialize global storage if it doesn't exist
if (!global.analysisJobs) {
  global.analysisJobs = new Map<string, AnalysisJob>();
}

const analysisJobs = global.analysisJobs;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { repository, files, accessToken } = req.body;

    if (!repository || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Repository and files are required' });
    }

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Create analysis job
    const jobId = uuidv4();
    const job: AnalysisJob = {
      id: jobId,
      repository,
      files,
      status: 'pending',
      progress: 0,
      files_analyzed: 0,
      total_files: files.length,
      created_at: new Date()
    };

    analysisJobs.set(jobId, job);

    // Start analysis in background
    processAnalysis(jobId, repository, files, accessToken);

    res.status(200).json({ 
      id: jobId,
      status: 'pending',
      message: 'Analysis started'
    });

  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
}

async function processAnalysis(jobId: string, repository: string, files: string[], accessToken: string) {
  const job = analysisJobs.get(jobId);
  if (!job) return;

  try {
    // Update status to analyzing
    job.status = 'analyzing';
    job.progress = 5;

    // Fetch and analyze files
    const fileContents = await fetchFileContents(repository, files, accessToken, (progress) => {
      job.progress = 5 + (progress * 0.6); // 5-65% for fetching
      job.files_analyzed = Math.floor((progress / 100) * files.length);
    });

    job.progress = 70;

    // Analyze code structure
    const analysis = await analyzeCodeStructure(fileContents, (progress) => {
      job.progress = 70 + (progress * 0.25); // 70-95% for analysis
    });

    job.progress = 95;

    // Generate visualization
    const visualization = await generateVisualization(analysis);
    
    job.progress = 100;
    job.status = 'completed';
    job.result = {
      id: jobId,
      repository,
      visualization,
      summary: analysis.summary
    };

  } catch (error) {
    console.error('Analysis failed:', error);
    job.status = 'error';
    job.error_message = error instanceof Error ? error.message : 'Analysis failed';
  }
}

async function fetchFileContents(
  repository: string, 
  files: string[], 
  accessToken: string, 
  onProgress: (progress: number) => void
): Promise<{ path: string; content: string; language: string }[]> {
  const contents: { path: string; content: string; language: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/contents/${filePath}`,
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
          const language = getLanguageFromExtension(extension);
          
          contents.push({
            path: filePath,
            content,
            language
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch ${filePath}:`, error);
    }

    onProgress(((i + 1) / files.length) * 100);
  }

  return contents;
}

function getLanguageFromExtension(ext: string): string {
  const languageMap: { [key: string]: string } = {
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'go': 'Go',
    'rs': 'Rust',
    'cpp': 'C++',
    'c': 'C',
    'php': 'PHP',
    'rb': 'Ruby'
  };
  return languageMap[ext] || 'Unknown';
}

async function analyzeCodeStructure(
  fileContents: { path: string; content: string; language: string }[],
  onProgress: (progress: number) => void
): Promise<any> {
  const analysis = {
    functions: 0,
    classes: 0,
    imports: 0,
    fileTypes: {} as { [key: string]: number },
    languageDistribution: {} as { [key: string]: number },
    complexity: 0,
    dependencies: [] as { from: string; to: string; type: string }[],
    codeElements: [] as any[]
  };

  for (let i = 0; i < fileContents.length; i++) {
    const file = fileContents[i];
    
    // Update file type count
    const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
    analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
    
    // Update language distribution
    analysis.languageDistribution[file.language] = (analysis.languageDistribution[file.language] || 0) + 1;
    
    // Analyze code content
    const fileAnalysis = analyzeFile(file);
    analysis.functions += fileAnalysis.functions;
    analysis.classes += fileAnalysis.classes;
    analysis.imports += fileAnalysis.imports;
    analysis.complexity += fileAnalysis.complexity;
    analysis.dependencies.push(...fileAnalysis.dependencies);
    analysis.codeElements.push(...fileAnalysis.elements);

    onProgress(((i + 1) / fileContents.length) * 100);
  }

  const mainLanguage = Object.entries(analysis.languageDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mixed';

  return {
    summary: {
      total_files: fileContents.length,
      supported_files: fileContents.length,
      functions: analysis.functions,
      classes: analysis.classes,
      imports: analysis.imports,
      complexity_score: Math.round(analysis.complexity / fileContents.length),
      main_language: mainLanguage,
      file_types: analysis.fileTypes
    },
    dependencies: analysis.dependencies,
    elements: analysis.codeElements
  };
}

function analyzeFile(file: { path: string; content: string; language: string }) {
  const analysis = {
    functions: 0,
    classes: 0,
    imports: 0,
    complexity: 0,
    dependencies: [] as { from: string; to: string; type: string }[],
    elements: [] as any[]
  };

  const lines = file.content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Count functions (simplified regex)
    if (/^(function|const\s+\w+\s*=|async\s+function|\w+\s*\(|\s*\w+\s*:\s*\([^)]*\)\s*=>)/.test(trimmed)) {
      analysis.functions++;
    }
    
    // Count classes
    if (/^(class\s+|export\s+class\s+|interface\s+|type\s+)/.test(trimmed)) {
      analysis.classes++;
    }
    
    // Count imports
    if (/^(import|from|require\s*\(|#include)/.test(trimmed)) {
      analysis.imports++;
      
      // Extract import dependencies
      const importMatch = trimmed.match(/import.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        analysis.dependencies.push({
          from: file.path,
          to: importMatch[1],
          type: 'import'
        });
      }
    }
    
    // Simple complexity calculation
    if (/\b(if|else|while|for|switch|catch|&&|\|\|)\b/.test(trimmed)) {
      analysis.complexity += 1;
    }
  }

  // Create code elements for visualization
  if (analysis.functions > 0) {
    analysis.elements.push({
      id: `${file.path}_functions`,
      name: `Functions (${analysis.functions})`,
      type: 'function',
      file: file.path,
      language: file.language
    });
  }

  if (analysis.classes > 0) {
    analysis.elements.push({
      id: `${file.path}_classes`,
      name: `Classes (${analysis.classes})`,
      type: 'class',
      file: file.path,
      language: file.language
    });
  }

  return analysis;
}

async function generateVisualization(analysis: any): Promise<any> {
  // Create a subway map visualization from the analysis
  // This is a simplified version - you could make this much more sophisticated
  
  const nodes = [];
  const connections = [];
  const legendItems = [
    { color: '#3b82f6', label: 'Functions' },
    { color: '#10b981', label: 'Classes' },
    { color: '#f59e0b', label: 'Imports' },
    { color: '#8b5cf6', label: 'Files' }
  ];

  // Generate nodes from code elements
  analysis.elements.forEach((element: any, index: number) => {
    const x = 100 + (index % 6) * 100;
    const y = 100 + Math.floor(index / 6) * 80;
    
    nodes.push({
      id: element.id,
      title: element.name,
      x,
      y,
      width: 120,
      height: 40,
      color: element.type === 'function' ? '#3b82f6' : '#10b981',
      strokeColor: element.type === 'function' ? '#60a5fa' : '#34d399',
      stepNumber: index + 1,
      details: [
        `File: ${element.file}`,
        `Type: ${element.type}`,
        `Language: ${element.language}`
      ]
    });
  });

  // Generate connections from dependencies
  analysis.dependencies.forEach((dep: any, index: number) => {
    const fromNode = nodes.find(n => n.id.includes(dep.from));
    const toNode = nodes.find(n => n.id.includes(dep.to));
    
    if (fromNode && toNode && index < 10) { // Limit connections to avoid clutter
      connections.push({
        from: { x: fromNode.x + fromNode.width, y: fromNode.y + fromNode.height / 2 },
        to: { x: toNode.x, y: toNode.y + toNode.height / 2 },
        color: '#f59e0b'
      });
    }
  });

  return {
    id: 'repository-analysis',
    title: `Repository Analysis - ${analysis.summary.main_language}`,
    description: `Analysis of ${analysis.summary.total_files} files with ${analysis.summary.functions} functions and ${analysis.summary.classes} classes`,
    nodes,
    connections,
    legendItems
  };
}

// Cleanup old jobs (run periodically)
setInterval(() => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  analysisJobs.forEach((job, id) => {
    if (job.created_at < cutoff) {
      analysisJobs.delete(id);
    }
  });
}, 60 * 60 * 1000); // Run every hour