import type { NextApiRequest, NextApiResponse } from 'next';
import * as ts from 'typescript';
import { analysisQueue, ensureWorker, AnalysisJobData, AnalysisJobResult } from '../../../lib/analysisQueue';

// Start the worker in the same process (single-server deployment).
// In a scaled deployment, move this to a separate worker entrypoint.
ensureWorker(async (job) => {
  const { repository, files, accessToken } = job.data;

  await job.updateProgress(5);
  const fileContents = await fetchFileContents(repository, files, accessToken, async (pct) => {
    await job.updateProgress(5 + pct * 0.6);
  });

  await job.updateProgress(70);
  const analysis = await analyzeCodeStructure(fileContents, async (pct) => {
    await job.updateProgress(70 + pct * 0.25);
  });

  await job.updateProgress(95);
  const visualization = await generateVisualization(analysis);
  await job.updateProgress(100);

  return {
    visualization,
    summary: analysis.summary,
    elements: analysis.elements,
    dependencies: analysis.dependencies,
  };
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { repository, files, accessToken } = req.body;

    if (!repository || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Repository and files are required' });
    }

    if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
      return res.status(400).json({ error: 'Invalid repository format. Expected owner/repo' });
    }

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jobData: AnalysisJobData = { repository, files, accessToken };
    const job = await analysisQueue.add('analyze', jobData);

    return res.status(200).json({
      id: job.id,
      status: 'pending',
      message: 'Analysis started',
    });

  } catch (error) {
    console.error('Error starting analysis:', error);
    return res.status(500).json({ error: 'Failed to start analysis' });
  }
}

async function fetchFileContents(
  repository: string,
  files: string[],
  accessToken: string,
  onProgress: (progress: number) => void | Promise<void>
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

    await onProgress(((i + 1) / files.length) * 100);
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
  onProgress: (progress: number) => void | Promise<void>
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

    await onProgress(((i + 1) / fileContents.length) * 100);
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

type FileAnalysis = {
  functions: number;
  classes: number;
  imports: number;
  complexity: number;
  dependencies: { from: string; to: string; type: string; line: number; detail: string }[];
  elements: any[];
  functionCalls: { function: string; line: number; calledFrom: string }[];
};

function makeAnalysis(): FileAnalysis {
  return { functions: 0, classes: 0, imports: 0, complexity: 0, dependencies: [], elements: [], functionCalls: [] };
}

function analyzeFile(file: { path: string; content: string; language: string }): FileAnalysis {
  const isJsTs = ['JavaScript', 'TypeScript'].includes(file.language);
  return isJsTs ? analyzeJsTsWithAST(file) : analyzeWithRegex(file);
}

function analyzeJsTsWithAST(file: { path: string; content: string; language: string }): FileAnalysis {
  const analysis = makeAnalysis();
  const lines = file.content.split('\n');

  const ext = file.path.split('.').pop()?.toLowerCase();
  const scriptKind =
    ext === 'tsx' ? ts.ScriptKind.TSX :
    ext === 'jsx' ? ts.ScriptKind.JSX :
    ext === 'ts'  ? ts.ScriptKind.TS  :
                    ts.ScriptKind.JS;

  let sourceFile: ts.SourceFile;
  try {
    sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, scriptKind);
  } catch {
    return analyzeWithRegex(file);
  }

  function lineOf(pos: number): number {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
  }

  function snippet(node: ts.Node): string {
    const ln = lineOf(node.getStart(sourceFile));
    const start = Math.max(0, ln - 3);
    const end = Math.min(lines.length - 1, ln + 4);
    return lines.slice(start, end + 1).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
  }

  function pushFunction(name: string, node: ts.Node, prefix = 'Function') {
    const ln = lineOf(node.getStart(sourceFile));
    analysis.functions++;
    analysis.elements.push({
      id: `${file.path}_func_${name}_${ln}`,
      name,
      type: 'function',
      file: file.path,
      line: ln,
      language: file.language,
      content: snippet(node),
      details: [`${prefix}: ${name}`, `File: ${file.path}:${ln}`, `Language: ${file.language}`]
    });
  }

  function visit(node: ts.Node) {
    // Named function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      pushFunction(node.name.text, node);
    }

    // Arrow functions and function expressions assigned to variables
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = node.initializer;
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        pushFunction(node.name.text, node);
      }
    }

    // Class methods
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      pushFunction(node.name.text, node, 'Method');
    }

    // Class declarations
    if (ts.isClassDeclaration(node) && node.name) {
      const name = node.name.text;
      const ln = lineOf(node.getStart(sourceFile));
      analysis.classes++;
      analysis.elements.push({
        id: `${file.path}_class_${name}_${ln}`,
        name,
        type: 'class',
        file: file.path,
        line: ln,
        language: file.language,
        content: snippet(node),
        details: [`Class: ${name}`, `File: ${file.path}:${ln}`, `Language: ${file.language}`]
      });
    }

    // Import declarations
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = node.moduleSpecifier.text;
      const ln = lineOf(node.getStart(sourceFile));
      analysis.imports++;
      analysis.dependencies.push({ from: file.path, to: target, type: 'import', line: ln, detail: `Imports from ${target}` });
      analysis.elements.push({
        id: `${file.path}_import_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${ln}`,
        name: target,
        type: 'import',
        file: file.path,
        line: ln,
        language: file.language,
        target,
        content: `${ln}: ${lines[ln - 1]?.trim() || ''}`,
        details: [`Import: ${target}`, `File: ${file.path}:${ln}`, `Type: ${file.language} import`]
      });
    }

    // Complexity nodes
    if (
      ts.isIfStatement(node) || ts.isWhileStatement(node) || ts.isForStatement(node) ||
      ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isSwitchStatement(node) ||
      ts.isCatchClause(node) || ts.isConditionalExpression(node)
    ) {
      analysis.complexity++;
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return analysis;
}

// Fallback regex-based analysis for non-JS/TS languages (Python, Java, Go, etc.)
function analyzeWithRegex(file: { path: string; content: string; language: string }): FileAnalysis {
  const analysis = makeAnalysis();
  const lines = file.content.split('\n');

  const langPatterns: Record<string, { func: RegExp[]; cls: RegExp[]; imp: RegExp[] }> = {
    Python: {
      func: [/^(?:async\s+)?def\s+(\w+)\s*\(/],
      cls: [/^class\s+(\w+)/],
      imp: [/^(?:import|from)\s+([\w.]+)/]
    },
    Java: {
      func: [/(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/],
      cls: [/(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/],
      imp: [/^import\s+([\w.]+)/]
    },
    Go: {
      func: [/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/],
      cls: [/^type\s+(\w+)\s+struct/],
      imp: [/["']([^"']+)["']/]
    },
    Ruby: {
      func: [/^\s*def\s+(\w+)/],
      cls: [/^class\s+(\w+)/],
      imp: [/require(?:_relative)?\s+['"]([^'"]+)['"]/]
    }
  };

  const patterns = langPatterns[file.language];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineNumber = idx + 1;

    if (patterns) {
      for (const p of patterns.func) {
        const m = trimmed.match(p);
        if (m?.[1]) {
          analysis.functions++;
          const start = Math.max(0, idx - 1);
          const end = Math.min(lines.length - 1, idx + 5);
          analysis.elements.push({
            id: `${file.path}_func_${m[1]}_${lineNumber}`,
            name: m[1],
            type: 'function',
            file: file.path,
            line: lineNumber,
            language: file.language,
            content: lines.slice(start, end + 1).map((l, i) => `${start + i + 1}: ${l}`).join('\n'),
            details: [`Function: ${m[1]}`, `File: ${file.path}:${lineNumber}`, `Language: ${file.language}`]
          });
          break;
        }
      }

      for (const p of patterns.cls) {
        const m = trimmed.match(p);
        if (m?.[1]) {
          analysis.classes++;
          analysis.elements.push({
            id: `${file.path}_class_${m[1]}_${lineNumber}`,
            name: m[1],
            type: 'class',
            file: file.path,
            line: lineNumber,
            language: file.language,
            details: [`Class: ${m[1]}`, `File: ${file.path}:${lineNumber}`, `Language: ${file.language}`]
          });
          break;
        }
      }

      for (const p of patterns.imp) {
        const m = trimmed.match(p);
        if (m?.[1]) {
          analysis.imports++;
          analysis.dependencies.push({ from: file.path, to: m[1], type: 'import', line: lineNumber, detail: `Imports ${m[1]}` });
          analysis.elements.push({
            id: `${file.path}_import_${m[1].replace(/[^a-zA-Z0-9]/g, '_')}_${lineNumber}`,
            name: m[1],
            type: 'import',
            file: file.path,
            line: lineNumber,
            language: file.language,
            details: [`Import: ${m[1]}`, `File: ${file.path}:${lineNumber}`]
          });
          break;
        }
      }
    }

    if (/\b(if|else|while|for|switch|catch)\b/.test(trimmed)) {
      analysis.complexity++;
    }
  });

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
  
  // Create semantic architecture layout - ONLY for groups that have elements
  const allLayoutGroups = [
    { name: 'imports', elements: elementsByType.imports, color: '#f59e0b' },
    { name: 'interfaces', elements: elementsByType.interfaces, color: '#8b5cf6' },
    { name: 'contexts', elements: elementsByType.contexts, color: '#06b6d4' },
    { name: 'providers', elements: elementsByType.providers, color: '#10b981' },
    { name: 'hooks', elements: elementsByType.hooks, color: '#3b82f6' },
    { name: 'authMethods', elements: elementsByType.authMethods, color: '#3b82f6' },
    { name: 'profileMethods', elements: elementsByType.profileMethods, color: '#3b82f6' },
    { name: 'utilities', elements: elementsByType.utilities, color: '#6b7280' },
    { name: 'exports', elements: elementsByType.exports, color: '#87CEEB' }
  ];
  
  // Filter to only groups with elements and assign tight Y positions
  const layoutGroups = allLayoutGroups
    .filter(group => group.elements.length > 0)
    .map((group, index) => ({
      ...group,
      y: 50 + index * 80 // Tight 80px spacing between existing groups
    }));
    
  layoutGroups.forEach(group => {
    group.elements.forEach((element: any, elementIndex: number) => {
      // Horizontal spacing for elements in the same group - reduced spacing
      const nodeX = 100 + elementIndex * 180; // Tighter horizontal spacing
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
        content: element.content, // Add actual code content for code viewer
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
  
  // 1. Imports flow to interfaces (or directly to context if no interfaces)
  if (elementsByType.imports.length > 0) {
    const importNode = nodes.find(n => elementsByType.imports.some(e => e.id === n.id));
    let targetNode = nodes.find(n => elementsByType.interfaces.some(e => e.id === n.id));
    
    // If no interfaces, connect to context
    if (!targetNode && elementsByType.contexts.length > 0) {
      targetNode = nodes.find(n => elementsByType.contexts.some(e => e.id === n.id));
    }
    
    // If no context, connect to provider
    if (!targetNode && elementsByType.providers.length > 0) {
      targetNode = nodes.find(n => elementsByType.providers.some(e => e.id === n.id));
    }
    if (importNode && targetNode) {
      semanticConnections.push({
        from: { x: importNode.x + importNode.width/2, y: importNode.y + importNode.height },
        to: { x: targetNode.x + targetNode.width/2, y: targetNode.y },
        color: '#3b82f6',
        label: 'Flow',
        detail: 'Architecture flow from imports',
        strokeWidth: 3,
        animated: false
      });
    }
  }
  
  // Connect consecutive existing groups
  for (let i = 0; i < layoutGroups.length - 1; i++) {
    const currentGroup = layoutGroups[i];
    const nextGroup = layoutGroups[i + 1];
    
    const currentNode = nodes.find(n => currentGroup.elements.some(e => e.id === n.id));
    const nextNode = nodes.find(n => nextGroup.elements.some(e => e.id === n.id));
    
    if (currentNode && nextNode) {
      semanticConnections.push({
        from: { x: currentNode.x + currentNode.width/2, y: currentNode.y + currentNode.height },
        to: { x: nextNode.x + nextNode.width/2, y: nextNode.y },
        color: nextGroup.color,
        label: 'Flow',
        detail: `Architecture flow: ${currentGroup.name} → ${nextGroup.name}`,
        strokeWidth: 4,
        animated: false
      });
    }
  }
  
  // 5. Add REAL error handling flows - only for functions with actual try/catch or error keywords
  elementsByType.authMethods.forEach(authMethod => {
    const authNode = nodes.find(n => n.id === authMethod.id);
    if (authNode) {
      // Only add error path if the function actually contains error handling keywords
      const hasRealErrorHandling = authMethod.content && 
        /try\s*\{|catch\s*\(|throw\s+|\.catch\(|error\s*[=:]/i.test(authMethod.content);
      
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
      
      // ONLY add error path if there's REAL error handling in the code
      if (hasRealErrorHandling) {
        semanticConnections.push({
          from: { x: authNode.x + authNode.width/2, y: authNode.y + authNode.height },
          to: { x: authNode.x + authNode.width/2, y: authNode.y + authNode.height + 60 },
          color: '#ef4444',
          label: 'Error',
          detail: `${authMethod.name} has try/catch error handling`,
          strokeWidth: 3,
          strokeDasharray: "10,5",
          animated: true,
          isError: true
        });
      }
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
    viewBox: "0 0 4500 800", // Wider viewBox to prevent horizontal clipping, shorter for tighter spacing
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