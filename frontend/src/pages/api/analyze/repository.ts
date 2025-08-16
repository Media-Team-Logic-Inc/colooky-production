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
    { color: '#3b82f6', label: 'Functions' },
    { color: '#10b981', label: 'Classes' },
    { color: '#f59e0b', label: 'Imports/Validation' },
    { color: '#87CEEB', label: 'Exports' }, // Baby blue for exports
    { color: '#ef4444', label: 'Error Handling' },
    { color: '#8b5cf6', label: 'Function Calls' }
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
  
  // Create intelligent layout based on file count and elements
  const totalFiles = Object.keys(fileGroups).length;
  const totalElements = analysis.elements.length;
  
  // Adjust layout based on content size
  let columnsPerFile, elementSpacing, fileSpacing, verticalSpacing;
  
  if (totalElements <= 5) {
    // Small analysis: horizontal spread like demo
    columnsPerFile = totalElements; // All in one row
    elementSpacing = 300;
    fileSpacing = 500; 
    verticalSpacing = 150;
  } else if (totalElements <= 15) {
    // Medium analysis: horizontal focus with 2 rows max
    columnsPerFile = Math.ceil(totalElements / 2);
    elementSpacing = 250;
    fileSpacing = 400;
    verticalSpacing = 120;
  } else {
    // Large analysis: more compact but still horizontal
    columnsPerFile = Math.ceil(totalElements / 3);
    elementSpacing = 180;
    fileSpacing = 350;
    verticalSpacing = 90;
  }

  Object.keys(fileGroups).forEach((filePath, fileIndex) => {
    const fileElements = fileGroups[filePath];
    const fileX = 100 + (fileIndex % 4) * fileSpacing;
    const fileY = 100 + Math.floor(fileIndex / 4) * 200;
    filePositions[filePath] = { x: fileX, y: fileY };
    
    // Create nodes for each element within the file
    fileElements.forEach((element: any, elementIndex: number) => {
      const nodeX = fileX + (elementIndex % columnsPerFile) * elementSpacing;
      const nodeY = fileY + Math.floor(elementIndex / columnsPerFile) * verticalSpacing;
      
      // Detect error handling functions
      const isErrorFunction = /error|catch|throw|fail|reject|invalid|exception|abort/i.test(element.name);
      const isValidationFunction = /valid|check|verify|confirm|test|assert/i.test(element.name);
      
      const nodeColor = 
        isErrorFunction ? '#ef4444' : // Red for error functions
        isValidationFunction ? '#f59e0b' : // Orange for validation functions
        element.type === 'function' ? '#3b82f6' :
        element.type === 'class' ? '#10b981' :
        element.type === 'import' ? '#f59e0b' :
        element.type === 'export' ? '#87CEEB' : '#8b5cf6'; // Baby blue for exports
        
      const strokeColor = 
        isErrorFunction ? '#f87171' : // Light red stroke for error functions
        isValidationFunction ? '#fbbf24' : // Light orange stroke for validation
        element.type === 'function' ? '#60a5fa' :
        element.type === 'class' ? '#34d399' :
        element.type === 'import' ? '#fbbf24' :
        element.type === 'export' ? '#B0E0E6' : '#a78bfa'; // Light baby blue stroke

      // Adjust node size based on analysis size
      const nodeWidth = totalElements <= 5 ? 180 : totalElements <= 15 ? 140 : 105;
      const nodeHeight = totalElements <= 5 ? 50 : 40;
      
      nodes.push({
        id: element.id,
        title: element.name.length > (nodeWidth/8) ? element.name.substring(0, Math.floor(nodeWidth/8)) + '...' : element.name,
        x: nodeX,
        y: nodeY,
        width: nodeWidth,
        height: nodeHeight,
        color: nodeColor,
        strokeColor: strokeColor,
        stepNumber: globalIndex + 1,
        isError: isErrorFunction, // Add error flag for proper rendering
        isValidation: isValidationFunction, // Add validation flag
        details: element.details || [
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

  // Add intelligent flow connections with error handling detection
  Object.keys(fileGroups).forEach(filePath => {
    const fileElements = fileGroups[filePath];
    
    for (let i = 0; i < fileElements.length - 1; i++) {
      const currentNode = nodes.find(n => n.id === fileElements[i].id);
      const nextNode = nodes.find(n => n.id === fileElements[i + 1].id);
      
      if (currentNode && nextNode) {
        // Detect error handling patterns
        const isErrorFunction = /error|catch|throw|fail|reject|invalid|exception|abort/i.test(nextNode.title);
        const isValidationFunction = /valid|check|verify|confirm|test|assert/i.test(nextNode.title);
        const isSuccessFunction = /success|complete|done|finish|resolve|ok|save|create|update/i.test(nextNode.title);
        
        // Create main success path (blue solid arrow)
        if (!isErrorFunction) {
          connections.push({
            from: { x: currentNode.x + currentNode.width, y: currentNode.y + currentNode.height / 2 },
            to: { x: nextNode.x, y: nextNode.y + nextNode.height / 2 },
            color: isSuccessFunction ? '#10b981' : '#3b82f6', // Green for success, blue for normal flow
            label: isSuccessFunction ? 'Success' : 'Flow',
            detail: `Normal execution: ${currentNode.title} → ${nextNode.title}`,
            strokeWidth: 3,
            animated: false
          });
        }
        
        // For validation functions, add both success and error paths
        if (isValidationFunction) {
          // Look for error functions that might be called on validation failure
          const errorFunctions = fileElements.slice(i + 1).filter(el => 
            /error|catch|throw|fail|reject|invalid|exception/i.test(el.name)
          );
          
          if (errorFunctions.length > 0) {
            const errorNode = nodes.find(n => n.id === errorFunctions[0].id);
            if (errorNode) {
              // Add error path (red dashed arrow)
              connections.push({
                from: { x: currentNode.x + currentNode.width/2, y: currentNode.y + currentNode.height },
                to: { x: errorNode.x + errorNode.width/2, y: errorNode.y },
                color: '#ef4444',
                label: 'Error',
                detail: `Error handling: ${currentNode.title} → ${errorNode.title}`,
                strokeWidth: 3,
                strokeDasharray: "10,5", // Dashed line for error paths
                animated: true, // Animated red ants effect
                isError: true
              });
            }
          }
        }
      }
    }
  });

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
    id: 'repository-analysis',
    title: `Code Flow Analysis - ${analysis.summary.main_language}`,
    description: `Detailed analysis showing ${analysis.summary.functions} functions, ${analysis.summary.classes} classes, and ${analysis.dependencies.length} dependencies with line-level connections`,
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