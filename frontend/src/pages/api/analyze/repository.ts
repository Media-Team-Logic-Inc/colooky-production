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
      summary: analysis.summary,
      elements: analysis.elements,
      dependencies: analysis.dependencies
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
    
    // CRITICAL FIX: Merge the actual elements, not just counts!
    analysis.codeElements.push(...fileAnalysis.elements);
    analysis.dependencies.push(...fileAnalysis.dependencies);
    console.log(`🔗 Merged ${fileAnalysis.elements.length} elements from ${file.path}, total now: ${analysis.codeElements.length}`);

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
  console.log('🔬 Analyzing file:', file.path, 'Language:', file.language, 'Lines:', file.content.split('\n').length);
  
  // DEBUG: Show first 10 lines of file content to see what we're working with
  const lines = file.content.split('\n');
  console.log('📝 First 10 lines of file content:');
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  const analysis = {
    functions: 0,
    classes: 0,
    imports: 0,
    complexity: 0,
    dependencies: [] as { from: string; to: string; type: string; line: number; detail: string }[],
    elements: [] as any[],
    functionCalls: [] as { function: string; line: number; calledFrom: string }[]
  };
  
  console.log(`🔄 Starting analysis loop for ${lines.length} lines...`);
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    const lineNumber = lineIndex + 1;
    
    // Debug EVERY non-empty line to see what we're working with
    if (trimmed.length > 0 && lineNumber <= 20) {
      console.log(`🔍 Line ${lineNumber}: "${trimmed}"`);
    }
    
    // ULTRA SIMPLE patterns that WILL work
    const functionMatches = [
      // ANY function keyword
      /function\s+(\w+)/,
      
      // ANY const = () => (arrow functions)
      /const\s+(\w+)\s*=.*=>/,
      
      // ANY const = ( (function assignments)  
      /const\s+(\w+)\s*=.*\(/,
      
      // Method definitions (name followed by parentheses)
      /^\s*(\w+)\s*\(/
    ];
    
    let foundMatch = false;
    for (let patternIndex = 0; patternIndex < functionMatches.length; patternIndex++) {
      const pattern = functionMatches[patternIndex];
      const match = trimmed.match(pattern);
      if (match) {
        console.log(`🎯 FOUND FUNCTION "${match[1]}" using pattern ${patternIndex} at line ${lineNumber} in ${file.path}`);
        foundMatch = true;
        analysis.functions++;
        
        // Extract function code snippet (5 lines around the function)
        const startLine = Math.max(0, lineIndex - 2);
        const endLine = Math.min(lines.length - 1, lineIndex + 5);
        const codeSnippet = lines.slice(startLine, endLine + 1)
          .map((line, index) => `${startLine + index + 1}: ${line}`)
          .join('\n');
        
        analysis.elements.push({
          id: `${file.path}_func_${match[1]}_${lineNumber}`,
          name: match[1],
          type: 'function',
          file: file.path,
          line: lineNumber,
          language: file.language,
          content: codeSnippet,
          details: [`Function: ${match[1]}`, `File: ${file.path}:${lineNumber}`, `Language: ${file.language}`]
        });
        break;
      }
    }
    
    // Debug: If line looks like a function but no pattern matched, show why
    if (!foundMatch && (trimmed.includes('function') || trimmed.includes('=>') || trimmed.includes('const '))) {
      console.log(`❌ Line ${lineNumber} looks like function but no pattern matched: "${trimmed}"`);
    }
    
    // Extract class definitions
    const classMatch = trimmed.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      analysis.classes++;
      
      // Extract class code snippet
      const startLine = Math.max(0, lineIndex - 1);
      const endLine = Math.min(lines.length - 1, lineIndex + 8);
      const codeSnippet = lines.slice(startLine, endLine + 1)
        .map((line, index) => `${startLine + index + 1}: ${line}`)
        .join('\n');
      
      analysis.elements.push({
        id: `${file.path}_class_${classMatch[1]}_${lineNumber}`,
        name: classMatch[1],
        type: 'class',
        file: file.path,
        line: lineNumber,
        language: file.language,
        content: codeSnippet,
        details: [`Class: ${classMatch[1]}`, `File: ${file.path}:${lineNumber}`, `Language: ${file.language}`]
      });
    }
    
    // Extract imports with detailed information
    const importPatterns = [
      /import\s+.*\s+from\s+['"]([^'"]+)['"]/,
      /import\s+['"]([^'"]+)['"]/,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/
    ];
    
    for (const pattern of importPatterns) {
      const importMatch = trimmed.match(pattern);
      if (importMatch) {
        analysis.imports++;
        analysis.dependencies.push({
          from: file.path,
          to: importMatch[1],
          type: 'import',
          line: lineNumber,
          detail: `Imports from ${importMatch[1]} at line ${lineNumber}`
        });
        
        // Create import element
        analysis.elements.push({
          id: `${file.path}_import_${importMatch[1].replace(/[^a-zA-Z0-9]/g, '_')}_${lineNumber}`,
          name: `📥 ${importMatch[1]}`,
          type: 'import',
          file: file.path,
          line: lineNumber,
          language: file.language,
          target: importMatch[1],
          content: `${lineNumber}: ${line.trim()}`,
          details: [`Import: ${importMatch[1]}`, `File: ${file.path}:${lineNumber}`, `Type: ${file.language} import`]
        });
        break;
      }
    }

    // Extract exports with detailed information
    const exportPatterns = [
      /^export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/,
      /^export\s+\{\s*([^}]+)\s*\}/,
      /^export\s+default\s+(\w+)/,
      /^module\.exports\s*=\s*(\w+)/,
      /^exports\.(\w+)\s*=/
    ];
    
    for (const pattern of exportPatterns) {
      const exportMatch = trimmed.match(pattern);
      if (exportMatch) {
        const exportName = exportMatch[1].includes(',') ? 'Multiple' : exportMatch[1];
        analysis.elements.push({
          id: `${file.path}_export_${exportName.replace(/[^a-zA-Z0-9]/g, '_')}_${lineNumber}`,
          name: `📤 ${exportName}`,
          type: 'export',
          file: file.path,
          line: lineNumber,
          language: file.language,
          details: [`Export: ${exportName}`, `File: ${file.path}:${lineNumber}`, `Type: ${file.language} export`]
        });
        break;
      }
    }
    
    // Extract function calls
    const functionCallMatch = trimmed.match(/(\w+)\s*\(/);
    if (functionCallMatch && !trimmed.includes('function') && !trimmed.includes('=')) {
      const functionName = functionCallMatch[1];
      if (!['if', 'while', 'for', 'switch', 'catch', 'return'].includes(functionName)) {
        analysis.functionCalls.push({
          function: functionName,
          line: lineNumber,
          calledFrom: file.path
        });
      }
    }
    
    // Complexity calculation
    if (/\b(if|else|while|for|switch|catch|&&|\|\|)\b/.test(trimmed)) {
      analysis.complexity += 1;
    }
  }

  console.log(`📊 Analysis complete for ${file.path}:`, {
    functions: analysis.functions,
    classes: analysis.classes,
    imports: analysis.imports,
    elements: analysis.elements.length,
    elementNames: analysis.elements.map(e => `${e.type}:${e.name}`)
  });

  // CRITICAL DEBUG: If we found functions in summary but no elements, something's wrong
  if (analysis.functions > 0 && analysis.elements.length === 0) {
    console.error(`🚨 MAJOR ISSUE: Found ${analysis.functions} functions in summary but 0 elements! Regex patterns are failing!`);
  }

  return analysis;
}

async function generateVisualization(analysis: any): Promise<any> {
  const nodes: any[] = [];
  const connections: any[] = [];
  const legendItems = [
    { color: '#f59e0b', label: 'Imports' },
    { color: '#8b5cf6', label: 'Interfaces/Types' },
    { color: '#06b6d4', label: 'Context' },
    { color: '#10b981', label: 'Provider' },
    { color: '#3b82f6', label: 'Hooks & Auth Methods' },
    { color: '#6b7280', label: 'Utilities' },
    { color: '#87CEEB', label: 'Exports' },
    { color: '#ef4444', label: 'Error Handling' }
  ];

  // Group elements by file for better layout
  const fileGroups: { [key: string]: any[] } = {};
  analysis.elements.forEach((element: any) => {
    if (!fileGroups[element.file]) {
      fileGroups[element.file] = [];
    }
    fileGroups[element.file].push(element);
  });

  let globalIndex = 0;
  const filePositions: { [key: string]: { x: number; y: number } } = {};
  
  // Create intelligent semantic layout based on code architecture
  const totalElements = analysis.elements.length;
  
  // Group elements by semantic purpose for better layout
  const elementsByType = {
    imports: analysis.elements.filter(e => e.type === 'import'),
    exports: analysis.elements.filter(e => e.type === 'export'),
    contexts: analysis.elements.filter(e => e.name.toLowerCase().includes('context')),
    providers: analysis.elements.filter(e => e.name.toLowerCase().includes('provider')),
    hooks: analysis.elements.filter(e => e.name.startsWith('use')),
    authMethods: analysis.elements.filter(e => /sign|auth|login|logout|verify/i.test(e.name)),
    profileMethods: analysis.elements.filter(e => /profile|update|switch|fetch/i.test(e.name)),
    utilities: analysis.elements.filter(e => 
      !e.name.toLowerCase().includes('context') && 
      !e.name.toLowerCase().includes('provider') &&
      !e.name.startsWith('use') &&
      !/sign|auth|login|logout|verify|profile|update|switch|fetch/i.test(e.name) &&
      e.type === 'function'
    ),
    interfaces: analysis.elements.filter(e => e.type === 'class' || e.name.includes('Type') || e.name.includes('Interface'))
  };
  
  console.log('🏗️ Semantic grouping:', {
    imports: elementsByType.imports.length,
    contexts: elementsByType.contexts.length,
    providers: elementsByType.providers.length,
    hooks: elementsByType.hooks.length,
    authMethods: elementsByType.authMethods.length,
    profileMethods: elementsByType.profileMethods.length,
    utilities: elementsByType.utilities.length
  });

  // Create semantic architecture layout
  const layoutGroups = [
    { name: 'imports', elements: elementsByType.imports, y: 50, color: '#f59e0b' },
    { name: 'interfaces', elements: elementsByType.interfaces, y: 150, color: '#8b5cf6' },
    { name: 'contexts', elements: elementsByType.contexts, y: 250, color: '#06b6d4' },
    { name: 'providers', elements: elementsByType.providers, y: 350, color: '#10b981' },
    { name: 'hooks', elements: elementsByType.hooks, y: 450, color: '#3b82f6' },
    { name: 'authMethods', elements: elementsByType.authMethods, y: 550, color: '#3b82f6' },
    { name: 'profileMethods', elements: elementsByType.profileMethods, y: 650, color: '#3b82f6' },
    { name: 'utilities', elements: elementsByType.utilities, y: 750, color: '#6b7280' },
    { name: 'exports', elements: elementsByType.exports, y: 850, color: '#87CEEB' }
  ];

  layoutGroups.forEach(group => {
    group.elements.forEach((element: any, elementIndex: number) => {
      // Horizontal spacing for elements in the same group
      const nodeX = 150 + elementIndex * 220; // More horizontal spacing
      const nodeY = group.y;
      
      // Detect error handling functions
      const isErrorFunction = /error|catch|throw|fail|reject|invalid|exception|abort/i.test(element.name);
      const isValidationFunction = /valid|check|verify|confirm|test|assert/i.test(element.name);
      
      // Use group color as base, but override for special cases
      const nodeColor = 
        isErrorFunction ? '#ef4444' : // Red for error functions
        isValidationFunction ? '#f59e0b' : // Orange for validation functions
        group.color; // Use semantic group color
        
      const strokeColor = 
        isErrorFunction ? '#f87171' : // Light red stroke for error functions
        isValidationFunction ? '#fbbf24' : // Light orange stroke for validation
        nodeColor === '#f59e0b' ? '#fbbf24' :
        nodeColor === '#8b5cf6' ? '#a78bfa' :
        nodeColor === '#06b6d4' ? '#38bdf8' :
        nodeColor === '#10b981' ? '#34d399' :
        nodeColor === '#3b82f6' ? '#60a5fa' :
        nodeColor === '#6b7280' ? '#9ca3af' :
        '#B0E0E6'; // Default light blue

      // Adjust node size for better readability
      const nodeWidth = 180;
      const nodeHeight = 45;
      
      nodes.push({
        id: element.id,
        title: element.name.length > 20 ? element.name.substring(0, 18) + '...' : element.name,
        x: nodeX,
        y: nodeY,
        width: nodeWidth,
        height: nodeHeight,
        color: nodeColor,
        strokeColor: strokeColor,
        stepNumber: globalIndex + 1,
        isError: isErrorFunction,
        isValidation: isValidationFunction,
        group: group.name, // Add semantic group info
        details: element.details || [
          `Group: ${group.name}`,
          `${element.type}: ${element.name}`,
          `File: ${element.file}:${element.line}`,
          `Language: ${element.language}`,
          isErrorFunction ? 'Type: Error Handler' : 
          isValidationFunction ? 'Type: Validation' : 
          `Type: ${element.type}`
        ]
      });
      globalIndex++;
    });
  });

  // Create connections based on dependencies with detailed labels
  analysis.dependencies.forEach((dep: any) => {
    // Find source file nodes (imports)
    const sourceNodes = nodes.filter(n => n.id.includes(dep.from.replace(/[^a-zA-Z0-9]/g, '_')));
    
    // For imports, connect to any node that imports the same module
    const importTargetNodes = nodes.filter(n => 
      n.id.includes('import') && 
      (n.id.includes(dep.to.replace(/[^a-zA-Z0-9]/g, '_')) || 
       (n.details && n.details.some((d: string) => d.includes(dep.to))))
    );

    if (sourceNodes.length > 0 && importTargetNodes.length > 0) {
      const sourceNode = sourceNodes[0];
      const targetNode = importTargetNodes[0];
      
      connections.push({
        from: { x: sourceNode.x + sourceNode.width, y: sourceNode.y + sourceNode.height / 2 },
        to: { x: targetNode.x, y: targetNode.y + targetNode.height / 2 },
        color: '#ef4444',
        label: `Line ${dep.line}`,
        detail: dep.detail,
        animated: true
      });
    }
  });

  // Create semantic architecture flow connections
  const semanticConnections = [];
  
  // 1. Imports flow to interfaces
  if (elementsByType.imports.length > 0 && elementsByType.interfaces.length > 0) {
    const importNode = nodes.find(n => elementsByType.imports.some(e => e.id === n.id));
    const interfaceNode = nodes.find(n => elementsByType.interfaces.some(e => e.id === n.id));
    if (importNode && interfaceNode) {
      semanticConnections.push({
        from: { x: importNode.x + importNode.width/2, y: importNode.y + importNode.height },
        to: { x: interfaceNode.x + interfaceNode.width/2, y: interfaceNode.y },
        color: '#8b5cf6',
        label: 'Types',
        detail: 'Imports provide type definitions',
        strokeWidth: 3
      });
    }
  }
  
  // 2. Interfaces flow to contexts
  if (elementsByType.interfaces.length > 0 && elementsByType.contexts.length > 0) {
    const interfaceNode = nodes.find(n => elementsByType.interfaces.some(e => e.id === n.id));
    const contextNode = nodes.find(n => elementsByType.contexts.some(e => e.id === n.id));
    if (interfaceNode && contextNode) {
      semanticConnections.push({
        from: { x: interfaceNode.x + interfaceNode.width/2, y: interfaceNode.y + interfaceNode.height },
        to: { x: contextNode.x + contextNode.width/2, y: contextNode.y },
        color: '#06b6d4',
        label: 'Context',
        detail: 'Interface defines context type',
        strokeWidth: 3
      });
    }
  }
  
  // 3. Context flows to provider
  if (elementsByType.contexts.length > 0 && elementsByType.providers.length > 0) {
    const contextNode = nodes.find(n => elementsByType.contexts.some(e => e.id === n.id));
    const providerNode = nodes.find(n => elementsByType.providers.some(e => e.id === n.id));
    if (contextNode && providerNode) {
      semanticConnections.push({
        from: { x: contextNode.x + contextNode.width/2, y: contextNode.y + contextNode.height },
        to: { x: providerNode.x + providerNode.width/2, y: providerNode.y },
        color: '#10b981',
        label: 'Provider',
        detail: 'Context creates provider component',
        strokeWidth: 4 // Thicker for main architecture flow
      });
    }
  }
  
  // 4. Provider flows to hooks
  if (elementsByType.providers.length > 0 && elementsByType.hooks.length > 0) {
    const providerNode = nodes.find(n => elementsByType.providers.some(e => e.id === n.id));
    const hookNode = nodes.find(n => elementsByType.hooks.some(e => e.id === n.id));
    if (providerNode && hookNode) {
      semanticConnections.push({
        from: { x: providerNode.x + providerNode.width/2, y: providerNode.y + providerNode.height },
        to: { x: hookNode.x + hookNode.width/2, y: hookNode.y },
        color: '#3b82f6',
        label: 'Hook',
        detail: 'Provider enables hook usage',
        strokeWidth: 4 // Thicker for main architecture flow
      });
    }
  }
  
  // 5. Add error handling flows for auth methods
  elementsByType.authMethods.forEach(authMethod => {
    const authNode = nodes.find(n => n.id === authMethod.id);
    if (authNode) {
      // Add success path to profile methods
      const profileNode = nodes.find(n => elementsByType.profileMethods.some(e => e.id === n.id));
      if (profileNode) {
        semanticConnections.push({
          from: { x: authNode.x + authNode.width, y: authNode.y + authNode.height/2 },
          to: { x: profileNode.x, y: profileNode.y + profileNode.height/2 },
          color: '#10b981',
          label: 'Success',
          detail: `${authMethod.name} success → profile management`,
          strokeWidth: 3
        });
      }
      
      // Add error handling path
      semanticConnections.push({
        from: { x: authNode.x + authNode.width/2, y: authNode.y + authNode.height },
        to: { x: authNode.x + authNode.width/2, y: authNode.y + authNode.height + 60 },
        color: '#ef4444',
        label: 'Error',
        detail: `${authMethod.name} error handling (try/catch)`,
        strokeWidth: 3,
        strokeDasharray: "10,5",
        animated: true,
        isError: true
      });
    }
  });
  
  connections.push(...semanticConnections);

  // Add cross-file connections for imports/exports
  nodes.forEach(importNode => {
    if (importNode.title.includes('📥')) {
      // Find potential export matches in other files
      nodes.forEach(exportNode => {
        if (exportNode.title.includes('📤') && 
            exportNode.details[0].includes(importNode.details[0].split(': ')[1]?.split('/').pop() || '')) {
          connections.push({
            from: { x: importNode.x + importNode.width, y: importNode.y + importNode.height / 2 },
            to: { x: exportNode.x, y: exportNode.y + exportNode.height / 2 },
            color: '#ef4444',
            label: 'Cross-file',
            detail: `Cross-file dependency: ${importNode.title} connects to ${exportNode.title}`,
            animated: true
          });
        }
      });
    }
  });

  // Add function call connections if we have function call data
  if (analysis.functionCalls && analysis.functionCalls.length > 0) {
    analysis.functionCalls.forEach((call: any) => {
      const callerNodes = nodes.filter(n => n.id.includes(call.calledFrom.replace(/[^a-zA-Z0-9]/g, '_')));
      const targetNodes = nodes.filter(n => n.title === call.function);
      
      if (callerNodes.length > 0 && targetNodes.length > 0) {
        const callerNode = callerNodes[0];
        const targetNode = targetNodes[0];
        
        connections.push({
          from: { x: callerNode.x + callerNode.width, y: callerNode.y + callerNode.height / 2 },
          to: { x: targetNode.x, y: targetNode.y + targetNode.height / 2 },
          color: '#8b5cf6',
          label: `Calls at line ${call.line}`,
          detail: `Function ${call.function} called from ${call.calledFrom} at line ${call.line}`
        });
      }
    });
  }

  return {
    id: 'semantic-architecture-analysis',
    title: `Semantic Architecture Flow - ${analysis.summary.main_language}`,
    description: `Intelligent architecture visualization showing code flow: imports → interfaces → context → provider → hooks → methods`,
    viewBox: "0 0 3500 1000", // Larger viewBox for semantic layout
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