import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import fs from 'fs';
import path from 'path';

interface CodeElement {
  name: string;
  line: number;
  type: string;
}

interface FunctionElement extends CodeElement {
  type: 'function';
}

interface ImportElement extends CodeElement {
  type: 'import';
  source: string;
}

interface ApiCallElement extends CodeElement {
  type: 'api_call';
  url: string;
}

interface AnalysisResult {
  functions: FunctionElement[];
  imports: ImportElement[];
  apiCalls: ApiCallElement[];
}

interface Position {
  x: number;
  y: number;
}

interface NodeMetadata {
  line?: number;
  [key: string]: any;
}

interface VisualizationNode {
  id: string;
  name: string;
  type: 'file' | 'function' | 'import' | 'api_call';
  position: Position;
  color: string;
  metadata?: NodeMetadata;
}

interface Connection {
  from: string;
  to: string;
  type: 'contains' | 'imports' | 'calls';
}

interface VisualizationResult {
  nodes: VisualizationNode[];
  connections: Connection[];
}

interface SyntaxNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  childCount: number;
  children: SyntaxNode[];
  child(index: number): SyntaxNode | null;
}

class CodeAnalysisService {
  private parser: Parser;
  private languages: Map<string, any>;

  constructor() {
    this.parser = new Parser();
    this.languages = new Map([
      ['.js', JavaScript],
      ['.jsx', JavaScript],
      ['.ts', TypeScript.typescript],
      ['.tsx', TypeScript.tsx],
      ['.py', Python],
    ]);
  }

  static async startAnalysis(repositoryId: string, branch: string = 'main', userId?: string, forceRefresh: boolean = false): Promise<any> {
    try {
      // This would typically create a background job and return immediately
      // For now, return a mock analysis result
      return {
        id: `analysis_${repositoryId}_${Date.now()}`,
        repositoryId,
        branch,
        status: 'running',
        startedAt: new Date(),
        userId,
      };
    } catch (error) {
      console.error('Error starting analysis:', error);
      throw new Error('Failed to start code analysis');
    }
  }

  static async getAnalysisResult(analysisId: string, userId?: string): Promise<any> {
    try {
      // This would typically fetch from database
      // For now, return a mock result
      return {
        id: analysisId,
        status: 'completed',
        result: {
          functions: [],
          imports: [],
          apiCalls: [],
          fileCount: 0,
        },
        completedAt: new Date(),
        userId,
      };
    } catch (error) {
      console.error('Error getting analysis result:', error);
      throw new Error('Failed to get analysis result');
    }
  }

  private getLanguageForFile(filePath: string): any {
    const ext = path.extname(filePath).toLowerCase();
    return this.languages.get(ext) || JavaScript; // Default to JavaScript
  }

  analyzeFile(filePath: string): AnalysisResult {
    console.log(`🔍 Reading file: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.analyzeCode(content, filePath);
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
      return { functions: [], imports: [], apiCalls: [] };
    }
  }

  analyzeCode(content: string, filePath?: string): AnalysisResult {
    console.log(`📝 Parsing AST...`);
    
    try {
      // Set appropriate language
      if (filePath) {
        const language = this.getLanguageForFile(filePath);
        this.parser.setLanguage(language);
      } else {
        this.parser.setLanguage(JavaScript);
      }

      const tree = this.parser.parse(content);
      
      const functions: FunctionElement[] = [];
      const imports: ImportElement[] = [];
      const apiCalls: ApiCallElement[] = [];
      
      const traverse = (node: SyntaxNode): void => {
        switch (node.type) {
          case 'function_declaration':
          case 'function_definition': // Python
          case 'arrow_function':
          case 'function_expression':
          case 'method_definition':
            this.extractFunction(node, functions);
            break;
            
          case 'import_statement':
          case 'import_declaration':
          case 'import_from_statement': // Python
            this.extractImport(node, imports);
            break;
            
          case 'call_expression':
            this.extractApiCall(node, apiCalls);
            break;
        }

        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child) {
            traverse(child);
          }
        }
      };

      if (tree.rootNode) {
        traverse(tree.rootNode);
      }
      
      console.log(`✅ Analysis complete: ${functions.length} functions, ${imports.length} imports, ${apiCalls.length} API calls`);
      
      return { functions, imports, apiCalls };
    } catch (error) {
      console.error(`❌ Error parsing code:`, error);
      return { functions: [], imports: [], apiCalls: [] };
    }
  }

  private extractFunction(node: SyntaxNode, functions: FunctionElement[]): void {
    try {
      let name = 'anonymous';
      
      // Try to find function name
      const nameNode = node.children.find(c => c.type === 'identifier');
      if (nameNode) {
        name = nameNode.text;
      } else {
        // Handle arrow functions and other patterns
        const assignmentParent = this.findParentAssignment(node);
        if (assignmentParent) {
          name = assignmentParent;
        }
      }

      functions.push({
        name,
        line: node.startPosition.row + 1,
        type: 'function'
      });
      
      console.log(`  ✅ Found function: ${name} (line ${node.startPosition.row + 1})`);
    } catch (error) {
      console.error('Error extracting function:', error);
    }
  }

  private extractImport(node: SyntaxNode, imports: ImportElement[]): void {
    try {
      const importText = node.text;
      let source = '';
      
      // Handle different import patterns
      const sourceMatches = [
        /from\s+['"`]([^'"`]+)['"`]/,
        /import\s+['"`]([^'"`]+)['"`]/,
        /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/
      ];
      
      for (const pattern of sourceMatches) {
        const match = importText.match(pattern);
        if (match) {
          source = match[1];
          break;
        }
      }
      
      if (source) {
        imports.push({
          name: source,
          source,
          line: node.startPosition.row + 1,
          type: 'import'
        });
        
        console.log(`  📦 Found import: ${source} (line ${node.startPosition.row + 1})`);
      }
    } catch (error) {
      console.error('Error extracting import:', error);
    }
  }

  private extractApiCall(node: SyntaxNode, apiCalls: ApiCallElement[]): void {
    try {
      const callText = node.text;
      
      // Check if it's an API call
      const isApiCall = /fetch\s*\(|axios\.|http\.|request\.|\.get\(|\.post\(|\.put\(|\.delete\(/i.test(callText);
      
      if (isApiCall) {
        // Extract URL patterns
        const urlPatterns = [
          /['"`]([^'"`]*\/api[^'"`]*)['"`]/,
          /['"`](https?:\/\/[^'"`]*)['"`]/,
          /['"`]([^'"`]*\/[^'"`]*)['"`]/
        ];
        
        for (const pattern of urlPatterns) {
          const match = callText.match(pattern);
          if (match) {
            apiCalls.push({
              name: match[1],
              url: match[1],
              line: node.startPosition.row + 1,
              type: 'api_call'
            });
            
            console.log(`  🌐 Found API call: ${match[1]} (line ${node.startPosition.row + 1})`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting API call:', error);
    }
  }

  private findParentAssignment(node: SyntaxNode): string | null {
    // This is a simplified implementation
    // In a real scenario, you'd traverse up the AST to find variable assignments
    return null;
  }

  generateVisualization(analysis: AnalysisResult, fileName: string): VisualizationResult {
    console.log(`🎨 Generating visualization for ${fileName}...`);
    
    const nodes: VisualizationNode[] = [];
    const connections: Connection[] = [];
    
    // File node (center)
    nodes.push({
      id: `file:${fileName}`,
      name: fileName,
      type: 'file',
      position: { x: 100, y: 100 },
      color: '#1f2937'
    });
    
    // Function nodes (to the right)
    analysis.functions.forEach((func, index) => {
      const nodeId = `func:${func.name}`;
      nodes.push({
        id: nodeId,
        name: func.name,
        type: 'function',
        position: { 
          x: 300 + (index % 3) * 150, 
          y: 100 + Math.floor(index / 3) * 80 
        },
        color: '#3b82f6',
        metadata: { line: func.line }
      });
      
      connections.push({
        from: `file:${fileName}`,
        to: nodeId,
        type: 'contains'
      });
    });
    
    // Import nodes (to the left)
    analysis.imports.forEach((imp, index) => {
      const nodeId = `import:${index}`;
      nodes.push({
        id: nodeId,
        name: imp.source,
        type: 'import',
        position: { x: 100, y: 200 + index * 60 },
        color: '#10b981',
        metadata: { line: imp.line }
      });
      
      connections.push({
        from: nodeId,
        to: `file:${fileName}`,
        type: 'imports'
      });
    });
    
    // API call nodes (far right)
    analysis.apiCalls.forEach((api, index) => {
      const nodeId = `api:${index}`;
      nodes.push({
        id: nodeId,
        name: api.url,
        type: 'api_call',
        position: { x: 600, y: 100 + index * 80 },
        color: '#ef4444',
        metadata: { line: api.line }
      });
      
      // Connect to first function (simplified)
      if (analysis.functions.length > 0) {
        connections.push({
          from: `func:${analysis.functions[0].name}`,
          to: nodeId,
          type: 'calls'
        });
      }
    });
    
    console.log(`  📊 Created ${nodes.length} nodes and ${connections.length} connections`);
    
    return { nodes, connections };
  }

  analyzeRepository(files: Array<{ path: string; content: string }>): {
    analyses: Map<string, AnalysisResult>;
    globalVisualization: VisualizationResult;
  } {
    console.log(`🔍 Analyzing ${files.length} files...`);
    
    const analyses = new Map<string, AnalysisResult>();
    
    // Analyze each file
    files.forEach(file => {
      const analysis = this.analyzeCode(file.content, file.path);
      analyses.set(file.path, analysis);
    });
    
    // Generate global visualization
    const globalVisualization = this.generateGlobalVisualization(analyses);
    
    return { analyses, globalVisualization };
  }

  private generateGlobalVisualization(analyses: Map<string, AnalysisResult>): VisualizationResult {
    const nodes: VisualizationNode[] = [];
    const connections: Connection[] = [];
    
    let fileIndex = 0;
    
    analyses.forEach((analysis, filePath) => {
      const fileName = path.basename(filePath);
      const fileX = 200 + (fileIndex % 4) * 300;
      const fileY = 100 + Math.floor(fileIndex / 4) * 200;
      
      // Add file node
      nodes.push({
        id: `file:${filePath}`,
        name: fileName,
        type: 'file',
        position: { x: fileX, y: fileY },
        color: '#1f2937'
      });
      
      // Add function nodes for this file
      analysis.functions.forEach((func, funcIndex) => {
        const nodeId = `${filePath}:func:${func.name}`;
        nodes.push({
          id: nodeId,
          name: func.name,
          type: 'function',
          position: { 
            x: fileX + 100, 
            y: fileY + 50 + funcIndex * 30 
          },
          color: '#3b82f6',
          metadata: { line: func.line, file: filePath }
        });
        
        connections.push({
          from: `file:${filePath}`,
          to: nodeId,
          type: 'contains'
        });
      });
      
      fileIndex++;
    });
    
    return { nodes, connections };
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.languages.keys());
  }
}

export default CodeAnalysisService;
export { 
  CodeAnalysisService, 
  AnalysisResult, 
  VisualizationResult, 
  VisualizationNode, 
  Connection,
  FunctionElement,
  ImportElement,
  ApiCallElement
};