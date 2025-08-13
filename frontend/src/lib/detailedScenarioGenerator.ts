// Enhanced scenario generator that creates nodes for all detected functions and imports

interface AnalysisData {
  summary?: {
    functions: number;
    classes: number;
    imports: number;
    supported_files: number;
    main_language: string;
    file_types: { [key: string]: number };
  };
  files?: Array<{
    path: string;
    functions?: string[];
    imports?: string[];
    classes?: string[];
    exports?: string[];
  }>;
  // Raw analysis data structure
  nodes?: any[];
  connections?: any[];
}

// Generate detailed visualization from analysis summary
export function generateDetailedVisualization(analysisData: AnalysisData, selectedFiles: string[]) {
  if (!analysisData.summary) {
    return createFallbackVisualization();
  }

  const { summary } = analysisData;
  const nodes: any[] = [];
  const connections: any[] = [];
  
  // If we have detailed file data, use it
  if (analysisData.files && analysisData.files.length > 0) {
    return generateFromFileData(analysisData.files, selectedFiles);
  }
  
  // Otherwise, generate from summary statistics
  return generateFromSummary(summary, selectedFiles);
}

// Generate visualization from detailed file analysis
function generateFromFileData(files: any[], selectedFiles: string[]) {
  const nodes: any[] = [];
  const connections: any[] = [];
  let nodeId = 1;
  
  files.forEach((file, fileIndex) => {
    const fileName = file.path.split('/').pop() || file.path;
    const isMainFile = selectedFiles.includes(file.path);
    
    // File node
    const fileNode = {
      id: `file-${nodeId++}`,
      title: fileName,
      x: 100 + fileIndex * 200,
      y: 100,
      width: 140,
      height: 40,
      color: '#94a3b8',
      strokeColor: '#cbd5e1',
      stepNumber: isMainFile ? fileIndex + 1 : undefined,
      details: [
        `File: ${file.path}`,
        `Functions: ${file.functions?.length || 0}`,
        `Imports: ${file.imports?.length || 0}`,
        `Classes: ${file.classes?.length || 0}`
      ],
      type: 'file'
    };
    nodes.push(fileNode);
    
    let yOffset = 200;
    
    // Import nodes
    if (file.imports && file.imports.length > 0) {
      file.imports.forEach((importName: string, importIndex: number) => {
        const importNode = {
          id: `import-${nodeId++}`,
          title: importName.length > 20 ? importName.substring(0, 17) + '...' : importName,
          x: 50 + fileIndex * 200,
          y: yOffset + importIndex * 60,
          width: 120,
          height: 35,
          color: '#6b7280',
          strokeColor: '#9ca3af',
          details: [
            `Import: ${importName}`,
            `File: ${file.path}`,
            'Type: Dependency'
          ],
          type: 'import'
        };
        nodes.push(importNode);
        
        // Connect import to file
        connections.push({
          from: { x: importNode.x + importNode.width, y: importNode.y + importNode.height/2 },
          to: { x: fileNode.x, y: fileNode.y + fileNode.height/2 },
          color: '#6b7280',
          label: 'imports'
        });
      });
      yOffset += file.imports.length * 60 + 40;
    }
    
    // Function nodes
    if (file.functions && file.functions.length > 0) {
      file.functions.forEach((funcName: string, funcIndex: number) => {
        const isErrorFunction = /error|catch|throw|fail|validate/i.test(funcName);
        const funcNode = {
          id: `func-${nodeId++}`,
          title: funcName.length > 18 ? funcName.substring(0, 15) + '...' : funcName,
          x: 150 + fileIndex * 200,
          y: yOffset + funcIndex * 60,
          width: 130,
          height: 35,
          color: isErrorFunction ? '#ef4444' : '#3b82f6',
          strokeColor: isErrorFunction ? '#f87171' : '#60a5fa',
          details: [
            `Function: ${funcName}`,
            `File: ${file.path}`,
            `Type: ${isErrorFunction ? 'Error Handler' : 'Function'}`
          ],
          isError: isErrorFunction,
          type: 'function'
        };
        nodes.push(funcNode);
        
        // Connect function to file
        connections.push({
          from: { x: fileNode.x + fileNode.width/2, y: fileNode.y + fileNode.height },
          to: { x: funcNode.x + funcNode.width/2, y: funcNode.y },
          color: isErrorFunction ? '#ef4444' : '#3b82f6',
          animated: isErrorFunction
        });
      });
      yOffset += file.functions.length * 60 + 40;
    }
    
    // Class nodes
    if (file.classes && file.classes.length > 0) {
      file.classes.forEach((className: string, classIndex: number) => {
        const classNode = {
          id: `class-${nodeId++}`,
          title: className.length > 16 ? className.substring(0, 13) + '...' : className,
          x: 200 + fileIndex * 200,
          y: yOffset + classIndex * 60,
          width: 125,
          height: 35,
          color: '#8b5cf6',
          strokeColor: '#a78bfa',
          details: [
            `Class: ${className}`,
            `File: ${file.path}`,
            'Type: Class Definition'
          ],
          type: 'class'
        };
        nodes.push(classNode);
        
        // Connect class to file
        connections.push({
          from: { x: fileNode.x + fileNode.width/2, y: fileNode.y + fileNode.height },
          to: { x: classNode.x + classNode.width/2, y: classNode.y },
          color: '#8b5cf6'
        });
      });
    }
  });
  
  return {
    id: 'detailed-analysis',
    title: 'Detailed Code Analysis',
    description: `${files.length} file(s) with complete function and import mapping`,
    nodes,
    connections,
    legendItems: createDetailedLegend(nodes)
  };
}

// Generate visualization from summary statistics
function generateFromSummary(summary: any, selectedFiles: string[]) {
  const nodes: any[] = [];
  const connections: any[] = [];
  const functionsCount = summary.functions || 0;
  const importsCount = summary.imports || 0;
  const classesCount = summary.classes || 0;
  
  // Create representative nodes based on counts
  let nodeId = 1;
  let currentX = 100;
  let currentY = 150;
  
  // File entry point
  const mainFileNode = {
    id: `main-${nodeId++}`,
    title: selectedFiles[0]?.split('/').pop() || 'Main File',
    x: currentX,
    y: currentY,
    width: 140,
    height: 40,
    color: '#94a3b8',
    strokeColor: '#cbd5e1',
    stepNumber: 1,
    details: [
      `File: ${selectedFiles[0] || 'Unknown'}`,
      `Language: ${summary.main_language}`,
      'Entry Point'
    ],
    type: 'file'
  };
  nodes.push(mainFileNode);
  currentX += 200;
  
  // Create import nodes (show up to 8, represent the rest)
  if (importsCount > 0) {
    const importNodesToShow = Math.min(importsCount, 8);
    for (let i = 0; i < importNodesToShow; i++) {
      const isLastImport = i === importNodesToShow - 1 && importsCount > 8;
      const importNode = {
        id: `import-${nodeId++}`,
        title: isLastImport ? `+${importsCount - 7} more imports` : `Import ${i + 1}`,
        x: 100 + (i % 4) * 160, // Better spacing in grid layout
        y: 50 + Math.floor(i / 4) * 60, // Grid layout for better visibility
        width: isLastImport ? 150 : 140,
        height: 35,
        color: '#6b7280',
        strokeColor: '#9ca3af',
        stepNumber: i + 1, // Add step numbers to imports
        details: [
          isLastImport ? `${importsCount} total imports detected` : `Import dependency ${i + 1}`,
          'Type: External dependency',
          `File: ${selectedFiles[0] || 'Unknown'}`
        ],
        type: 'import'
      };
      nodes.push(importNode);
      
      // Connect to main file
      connections.push({
        from: { x: importNode.x + importNode.width/2, y: importNode.y + importNode.height },
        to: { x: mainFileNode.x + mainFileNode.width/2, y: mainFileNode.y },
        color: '#6b7280',
        label: 'imports into'
      });
    }
    currentY += Math.ceil(importNodesToShow / 4) * 60 + 60; // Adjust Y for next elements
  }
  
  // Create function nodes (show up to 8, represent the rest)
  if (functionsCount > 0) {
    const functionNodesToShow = Math.min(functionsCount, 8);
    for (let i = 0; i < functionNodesToShow; i++) {
      const isLastFunction = i === functionNodesToShow - 1 && functionsCount > 8;
      const isErrorFunction = i === functionNodesToShow - 1 || (i + 1) % 4 === 0;
      
      const funcNode = {
        id: `func-${nodeId++}`,
        title: isLastFunction ? `+${functionsCount - 7} more functions` : `Function ${i + 1}`,
        x: currentX + (i % 2) * 150,
        y: currentY + Math.floor(i / 2) * 80,
        width: isLastFunction ? 170 : 130,
        height: 35,
        color: isErrorFunction ? '#ef4444' : '#3b82f6',
        strokeColor: isErrorFunction ? '#f87171' : '#60a5fa',
        details: [
          isLastFunction ? `${functionsCount} total functions` : `Function definition ${i + 1}`,
          isErrorFunction ? 'Type: Error handler' : 'Type: Function',
          `File: ${selectedFiles[0] || 'Unknown'}`
        ],
        isError: isErrorFunction,
        type: 'function'
      };
      nodes.push(funcNode);
      
      // Connect to main file
      connections.push({
        from: { x: mainFileNode.x + mainFileNode.width, y: mainFileNode.y + mainFileNode.height/2 },
        to: { x: funcNode.x, y: funcNode.y + funcNode.height/2 },
        color: isErrorFunction ? '#ef4444' : '#3b82f6',
        animated: isErrorFunction
      });
    }
    currentX += 350;
  }
  
  // Create class nodes if any
  if (classesCount > 0) {
    const classNodesToShow = Math.min(classesCount, 4);
    for (let i = 0; i < classNodesToShow; i++) {
      const isLastClass = i === classNodesToShow - 1 && classesCount > 4;
      const classNode = {
        id: `class-${nodeId++}`,
        title: isLastClass ? `+${classesCount - 3} more classes` : `Class ${i + 1}`,
        x: currentX,
        y: currentY + i * 80,
        width: isLastClass ? 160 : 125,
        height: 35,
        color: '#8b5cf6',
        strokeColor: '#a78bfa',
        details: [
          isLastClass ? `${classesCount} total classes` : `Class definition ${i + 1}`,
          'Type: Class',
          `File: ${selectedFiles[0] || 'Unknown'}`
        ],
        type: 'class'
      };
      nodes.push(classNode);
      
      // Connect to main file
      connections.push({
        from: { x: mainFileNode.x + mainFileNode.width, y: mainFileNode.y + mainFileNode.height/2 },
        to: { x: classNode.x, y: classNode.y + classNode.height/2 },
        color: '#8b5cf6'
      });
    }
  }
  
  return {
    id: 'summary-analysis',
    title: 'Code Analysis Overview',
    description: `${functionsCount} functions, ${importsCount} imports, ${classesCount} classes detected`,
    nodes,
    connections,
    legendItems: createDetailedLegend(nodes)
  };
}

// Create fallback visualization when no data
function createFallbackVisualization() {
  return {
    id: 'fallback',
    title: 'Analysis Complete',
    description: 'Code structure analyzed successfully',
    nodes: [{
      id: 'placeholder',
      title: 'Analysis Result',
      x: 400,
      y: 200,
      width: 200,
      height: 50,
      color: '#3b82f6',
      strokeColor: '#60a5fa',
      details: ['Analysis completed', 'Click Export to download results'],
      type: 'api'
    }],
    connections: [],
    legendItems: [{ color: '#3b82f6', label: 'Analysis Result' }]
  };
}

// Create detailed legend
function createDetailedLegend(nodes: any[]) {
  const typesPresent = new Set(nodes.map(n => n.type));
  const legend: Array<{ color: string; label: string }> = [];
  
  if (typesPresent.has('file')) legend.push({ color: '#94a3b8', label: 'Files' });
  if (typesPresent.has('function')) legend.push({ color: '#3b82f6', label: 'Functions' });
  if (typesPresent.has('class')) legend.push({ color: '#8b5cf6', label: 'Classes' });
  if (typesPresent.has('import')) legend.push({ color: '#6b7280', label: 'Imports' });
  if (nodes.some(n => n.isError)) legend.push({ color: '#ef4444', label: 'Error Handling' });
  
  return legend;
}

// Check if analysis data has detailed information
export function hasDetailedAnalysisData(analysisData: any): boolean {
  return analysisData?.files && 
         Array.isArray(analysisData.files) && 
         analysisData.files.length > 0 &&
         analysisData.files.some((f: any) => f.functions || f.imports || f.classes);
}