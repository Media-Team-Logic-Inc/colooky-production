import type { NextApiRequest, NextApiResponse } from 'next';
import * as ts from 'typescript';
import crypto from 'crypto';

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

    const fileContents = await fetchFileContents(repository, files, accessToken, async () => {});
    const analysis = await analyzeCodeStructure(fileContents, async () => {});
    const visualization = await generateVisualization(analysis);

    return res.status(200).json({
      id: crypto.randomUUID(),
      status: 'completed',
      visualization,
      summary: analysis.summary,
      elements: analysis.elements,
      dependencies: analysis.dependencies,
      callEdges: analysis.callEdges,
      hooks: analysis.hooks,
      importUsage: analysis.importUsage,
      props: analysis.props,
    });

  } catch (error) {
    console.error('Error analyzing repository:', error);
    return res.status(500).json({ error: 'Failed to analyze repository' });
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
    codeElements: [] as any[],
    callEdges: [] as any[],
    hooks: [] as any[],
    importUsage: [] as any[],
    props: [] as any[],
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

    // Merge elements and dependency data
    analysis.codeElements.push(...fileAnalysis.elements);
    analysis.dependencies.push(...fileAnalysis.dependencies);
    analysis.callEdges.push(...fileAnalysis.callEdges);
    analysis.hooks.push(...fileAnalysis.hooks);
    analysis.importUsage.push(...fileAnalysis.importUsage);
    analysis.props.push(...fileAnalysis.props);

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
      complexity_score: Math.round(analysis.complexity / Math.max(fileContents.length, 1)),
      main_language: mainLanguage,
      file_types: analysis.fileTypes
    },
    dependencies: analysis.dependencies,
    elements: analysis.codeElements,
    callEdges: analysis.callEdges,
    hooks: analysis.hooks,
    importUsage: analysis.importUsage,
    props: analysis.props,
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
  callEdges: { from: string; to: string; line: number; callType: 'function-call' | 'jsx-render' | 'hook' | 'state-update'; label: string }[];
  hooks: { hook: string; variable?: string; setter?: string; deps?: string[]; line: number; containingFunction: string }[];
  importUsage: { name: string; module: string; usedIn: string[] }[];
  props: { component: string; props: string[] }[];
};

function makeAnalysis(): FileAnalysis {
  return {
    functions: 0,
    classes: 0,
    imports: 0,
    complexity: 0,
    dependencies: [],
    elements: [],
    functionCalls: [],
    callEdges: [],
    hooks: [],
    importUsage: [],
    props: [],
  };
}

function analyzeFile(file: { path: string; content: string; language: string }): FileAnalysis {
  const isJsTs = ['JavaScript', 'TypeScript'].includes(file.language);
  return isJsTs ? analyzeJsTsWithAST(file) : analyzeWithRegex(file);
}

// Built-in noise filter — skip call edges for these names
const CALL_NOISE = new Set([
  'console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'parseInt', 'parseFloat',
  'map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every', 'includes', 'flat', 'flatMap',
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat', 'join', 'reverse', 'sort',
  'split', 'trim', 'replace', 'toLowerCase', 'toUpperCase', 'indexOf', 'startsWith', 'endsWith',
  'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'allSettled', 'race', 'any',
  'keys', 'values', 'entries', 'assign', 'freeze', 'create', 'fromEntries',
  'log', 'error', 'warn', 'info', 'debug', 'from', 'of', 'isArray',
  'call', 'apply', 'bind', 'toString', 'valueOf',
  'get', 'set', 'has', 'delete', 'clear',
  'preventDefault', 'stopPropagation', 'stopImmediatePropagation',
  'encodeURIComponent', 'decodeURIComponent', 'fetch',
]);

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

  // --- AST helper functions ---

  function isNoisyCall(name: string): boolean {
    const top = name.split('.')[0];
    return CALL_NOISE.has(top) || CALL_NOISE.has(name);
  }

  function isComponentName(name: string): boolean {
    const BUILTINS = new Set([
      'Error', 'Promise', 'String', 'Number', 'Boolean', 'Object',
      'Array', 'Function', 'Symbol', 'Date', 'RegExp', 'Map', 'Set',
      'WeakMap', 'WeakSet',
    ]);
    return name.length > 0 && name[0] >= 'A' && name[0] <= 'Z' && !BUILTINS.has(name);
  }

  function getCalleeName(expr: ts.Expression): string | null {
    if (ts.isIdentifier(expr)) return expr.text;
    if (ts.isPropertyAccessExpression(expr)) {
      const obj = getCalleeName(expr.expression);
      return obj ? `${obj}.${expr.name.text}` : expr.name.text;
    }
    return null;
  }

  function getBindingElementName(el: ts.ArrayBindingElement | undefined): string | undefined {
    if (!el || ts.isOmittedExpression(el)) return undefined;
    if (ts.isBindingElement(el) && ts.isIdentifier(el.name)) return el.name.text;
    return undefined;
  }

  function extractComponentProps(params: ts.NodeArray<ts.ParameterDeclaration>): string[] {
    if (!params.length) return [];
    const first = params[0];
    if (ts.isObjectBindingPattern(first.name)) {
      return first.name.elements
        .filter((el): el is ts.BindingElement => ts.isBindingElement(el) && ts.isIdentifier(el.name))
        .map(el => (el.name as ts.Identifier).text);
    }
    return [];
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

  // --- Pass 1: collect all imported identifiers ---
  // importedNames: identifier text → module path
  const importedNames = new Map<string, string>();

  function collectImports(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const modulePath = node.moduleSpecifier.text;
      const clause = node.importClause;
      if (clause) {
        // default import: import Foo from '...'
        if (clause.name) {
          importedNames.set(clause.name.text, modulePath);
        }
        const bindings = clause.namedBindings;
        if (bindings) {
          if (ts.isNamespaceImport(bindings)) {
            // import * as Foo from '...'
            importedNames.set(bindings.name.text, modulePath);
          } else if (ts.isNamedImports(bindings)) {
            // import { Foo, Bar } from '...'
            bindings.elements.forEach(el => {
              importedNames.set(el.name.text, modulePath);
            });
          }
        }
      }
    }
    ts.forEachChild(node, collectImports);
  }
  ts.forEachChild(sourceFile, collectImports);

  // importUsageMap: identifier name → Set of function scopes that use it
  const importUsageMap = new Map<string, Set<string>>();
  importedNames.forEach((_, name) => {
    importUsageMap.set(name, new Set());
  });

  // --- Pass 2: scope-aware traversal ---

  function visit(node: ts.Node, scope: string) {
    // Named function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      pushFunction(name, node);
      // Extract props if component
      if (isComponentName(name) && node.parameters) {
        const propList = extractComponentProps(node.parameters);
        if (propList.length > 0) {
          analysis.props.push({ component: name, props: propList });
        }
      }
      // Recurse into children with new scope
      ts.forEachChild(node, child => visit(child, name));
      return;
    }

    // Variable declarations: arrow/function expressions OR array destructuring (hooks)
    if (ts.isVariableStatement(node)) {
      ts.forEachChild(node, child => visit(child, scope));
      return;
    }

    if (ts.isVariableDeclarationList(node)) {
      ts.forEachChild(node, child => visit(child, scope));
      return;
    }

    if (ts.isVariableDeclaration(node)) {
      const ln = lineOf(node.getStart(sourceFile));

      // Arrow function / function expression assigned to variable
      if (ts.isIdentifier(node.name) && node.initializer) {
        const init = node.initializer;
        const varName = node.name.text;

        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          pushFunction(varName, node);
          // Extract props if component
          if (isComponentName(varName) && init.parameters) {
            const propList = extractComponentProps(init.parameters);
            if (propList.length > 0) {
              analysis.props.push({ component: varName, props: propList });
            }
          }
          // Recurse into body with new scope
          ts.forEachChild(node, child => visit(child, varName));
          return;
        }
      }

      // Array destructuring: useState / useReducer hooks
      if (ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callee = getCalleeName(node.initializer.expression);
        if (callee === 'useState' || callee === 'useReducer') {
          const elements = node.name.elements;
          const variable = getBindingElementName(elements[0]);
          const setter = getBindingElementName(elements[1]);
          analysis.hooks.push({
            hook: callee,
            variable,
            setter,
            line: ln,
            containingFunction: scope,
          });
          // Still recurse with same scope (not a new function scope)
          ts.forEachChild(node, child => visit(child, scope));
          return;
        }
      }

      // Fall through: recurse with same scope
      ts.forEachChild(node, child => visit(child, scope));
      return;
    }

    // Method declarations inside classes
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      pushFunction(name, node, 'Method');
      ts.forEachChild(node, child => visit(child, name));
      return;
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
      ts.forEachChild(node, child => visit(child, name));
      return;
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
      // Don't recurse into import declarations for call edges
      return;
    }

    // Call expressions
    if (ts.isCallExpression(node)) {
      const callee = getCalleeName(node.expression);
      const ln = lineOf(node.getStart(sourceFile));

      if (callee && scope) {
        // useEffect / useCallback / useMemo — extract deps array
        if (callee === 'useEffect' || callee === 'useCallback' || callee === 'useMemo') {
          const depsArg = node.arguments[callee === 'useEffect' || callee === 'useCallback' ? 1 : 1];
          let deps: string[] = [];
          if (depsArg && ts.isArrayLiteralExpression(depsArg)) {
            deps = depsArg.elements
              .filter(ts.isIdentifier)
              .map(id => (id as ts.Identifier).text);
          }
          analysis.hooks.push({
            hook: callee,
            deps,
            line: ln,
            containingFunction: scope,
          });
          analysis.callEdges.push({
            from: scope,
            to: callee,
            line: ln,
            callType: 'hook' as const,
            label: callee,
          });
        }
        // useContext
        else if (callee === 'useContext') {
          const contextArg = node.arguments[0];
          const contextName = contextArg && ts.isIdentifier(contextArg) ? contextArg.text : 'context';
          analysis.hooks.push({
            hook: 'useContext',
            variable: contextName,
            line: ln,
            containingFunction: scope,
          });
          analysis.callEdges.push({
            from: scope,
            to: contextName,
            line: ln,
            callType: 'hook' as const,
            label: 'useContext',
          });
        }
        // Generic call edges (skip noise)
        else if (!isNoisyCall(callee)) {
          analysis.callEdges.push({
            from: scope,
            to: callee,
            line: ln,
            callType: 'function-call' as const,
            label: callee,
          });
        }

        // Track import usage: if callee top-level name is an imported identifier
        const topName = callee.split('.')[0];
        if (importedNames.has(topName) && scope) {
          importUsageMap.get(topName)?.add(scope);
        }
      }

      // Recurse into arguments and callee expression
      ts.forEachChild(node, child => visit(child, scope));
      return;
    }

    // JSX elements: uppercase tag = component render
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName;
      const tag = ts.isIdentifier(tagName)
        ? tagName.text
        : ts.isPropertyAccessExpression(tagName)
          ? `${(tagName.expression as ts.Identifier).text}.${tagName.name.text}`
          : null;
      if (tag && isComponentName(tag.split('.')[0]) && scope) {
        const ln = lineOf(node.getStart(sourceFile));
        analysis.callEdges.push({
          from: scope,
          to: tag,
          line: ln,
          callType: 'jsx-render' as const,
          label: `renders <${tag}>`,
        });
      }
      ts.forEachChild(node, child => visit(child, scope));
      return;
    }

    // Identifiers: track import usage
    if (ts.isIdentifier(node) && scope) {
      const name = node.text;
      if (importedNames.has(name)) {
        importUsageMap.get(name)?.add(scope);
      }
    }

    // Complexity tracking
    if (
      ts.isIfStatement(node) || ts.isWhileStatement(node) || ts.isForStatement(node) ||
      ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isSwitchStatement(node) ||
      ts.isCatchClause(node) || ts.isConditionalExpression(node)
    ) {
      analysis.complexity++;
    }

    ts.forEachChild(node, child => visit(child, scope));
  }

  ts.forEachChild(sourceFile, node => visit(node, ''));

  // Materialise importUsage from the map
  importUsageMap.forEach((usedInSet, name) => {
    const modulePath = importedNames.get(name)!;
    const usedIn = Array.from(usedInSet);
    if (usedIn.length > 0) {
      analysis.importUsage.push({ name, module: modulePath, usedIn });
    }
  });

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
    { color: '#06b6d4', label: 'Renders (JSX)' },
    { color: '#10b981', label: 'Provider/Context' },
    { color: '#3b82f6', label: 'Functions/Methods' },
    { color: '#7c3aed', label: 'State (useState)' },
    { color: '#60a5fa', label: 'Function Calls' },
    { color: '#6b7280', label: 'Utilities' },
    { color: '#ef4444', label: 'Error Handling' },
  ];

  // --- Visualization helper functions ---

  function findNodeByName(name: string, allNodes: any[], nameMap: Map<string, any>): any | null {
    if (!name) return null;
    if (nameMap.has(name)) return nameMap.get(name);
    return allNodes.find(n =>
      n.id.includes(`_${name}_`) || n.id.endsWith(`_${name}`) || n.title === name
    ) || null;
  }

  function findImportNode(importName: string, module: string, allNodes: any[]): any | null {
    const moduleSlug = module.replace(/[^a-zA-Z0-9]/g, '_');
    const nameSlug = importName.replace(/[^a-zA-Z0-9]/g, '_');
    return allNodes.find(n =>
      n.id.includes('import') && (
        n.id.includes(moduleSlug) ||
        n.id.includes(nameSlug) ||
        n.title === importName ||
        n.title.includes(importName.substring(0, 8))
      )
    ) || null;
  }

  // --- Node layout (semantic grouping — unchanged) ---

  const elementsByType = {
    imports: analysis.elements.filter((e: any) => e.type === 'import'),
    exports: analysis.elements.filter((e: any) => e.type === 'export'),
    contexts: analysis.elements.filter((e: any) => e.name.toLowerCase().includes('context')),
    providers: analysis.elements.filter((e: any) => e.name.toLowerCase().includes('provider')),
    hooks: analysis.elements.filter((e: any) => e.name.startsWith('use')),
    authMethods: analysis.elements.filter((e: any) => /sign|auth|login|logout|verify/i.test(e.name)),
    profileMethods: analysis.elements.filter((e: any) => /profile|update|switch|fetch/i.test(e.name)),
    utilities: analysis.elements.filter((e: any) =>
      !e.name.toLowerCase().includes('context') &&
      !e.name.toLowerCase().includes('provider') &&
      !e.name.startsWith('use') &&
      !/sign|auth|login|logout|verify|profile|update|switch|fetch/i.test(e.name) &&
      e.type === 'function'
    ),
    interfaces: analysis.elements.filter((e: any) =>
      e.type === 'class' || e.name.includes('Type') || e.name.includes('Interface')
    )
  };

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

  const layoutGroups = allLayoutGroups
    .filter(group => group.elements.length > 0)
    .map((group, index) => ({
      ...group,
      y: 50 + index * 80
    }));

  let globalIndex = 0;

  layoutGroups.forEach(group => {
    group.elements.forEach((element: any, elementIndex: number) => {
      const nodeX = 100 + elementIndex * 180;
      const nodeY = group.y;

      const isErrorFunction = /error|catch|throw|fail|reject|invalid|exception|abort/i.test(element.name);
      const isValidationFunction = /valid|check|verify|confirm|test|assert/i.test(element.name);

      const nodeColor =
        isErrorFunction ? '#ef4444' :
        isValidationFunction ? '#f59e0b' :
        group.color;

      const strokeColor =
        isErrorFunction ? '#f87171' :
        isValidationFunction ? '#fbbf24' :
        nodeColor === '#f59e0b' ? '#fbbf24' :
        nodeColor === '#8b5cf6' ? '#a78bfa' :
        nodeColor === '#06b6d4' ? '#38bdf8' :
        nodeColor === '#10b981' ? '#34d399' :
        nodeColor === '#3b82f6' ? '#60a5fa' :
        nodeColor === '#6b7280' ? '#9ca3af' :
        '#B0E0E6';

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
        group: group.name,
        content: element.content,
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

  // --- Build node lookup maps ---
  const nodeByName = new Map<string, any>();
  const nodeById = new Map<string, any>();
  nodes.forEach(n => {
    nodeById.set(n.id, n);
    nodeByName.set(n.title, n);
    const idParts = n.id.split('_');
    if (idParts.length >= 3) {
      const rawName = idParts.slice(2, -1).join('_');
      nodeByName.set(rawName, n);
    }
  });

  // --- Real connections ---
  const realConnections: any[] = [];

  // 1. Hook/state nodes — inserted first so their IDs exist for connection lookup
  if (analysis.hooks && analysis.hooks.length > 0) {
    const stateHooks = analysis.hooks.filter(
      (h: any) => h.hook === 'useState' || h.hook === 'useReducer'
    );
    stateHooks.forEach((hook: any, i: number) => {
      const label = hook.variable ? `${hook.variable} state` : `State ${i + 1}`;
      const stateNode = {
        id: `hook_state_${hook.variable || i}_${hook.line}`,
        title: label.length > 20 ? label.substring(0, 18) + '...' : label,
        x: 100 + i * 200,
        y: 180,
        width: 160,
        height: 40,
        color: '#7c3aed',
        strokeColor: '#a78bfa',
        stepNumber: undefined,
        isError: false,
        group: 'state',
        details: [
          `State: ${hook.variable || 'unknown'}`,
          `Setter: ${hook.setter || 'unknown'}`,
          `In: ${hook.containingFunction}`,
          `Line: ${hook.line}`,
          'Type: React State — changes cause re-render'
        ]
      };
      nodes.push(stateNode);
      if (hook.variable) nodeByName.set(hook.variable, stateNode);
      if (hook.setter) nodeByName.set(hook.setter, stateNode);
      nodeByName.set(label, stateNode);

      // Connect container function → state node
      const containerNode = findNodeByName(hook.containingFunction, nodes, nodeByName);
      if (containerNode) {
        realConnections.push({
          fromId: containerNode.id,
          toId: stateNode.id,
          from: { x: containerNode.x + containerNode.width / 2, y: containerNode.y + containerNode.height },
          to: { x: stateNode.x + stateNode.width / 2, y: stateNode.y },
          color: '#7c3aed',
          label: 'manages',
          detail: `${hook.containingFunction} manages ${hook.variable} state`,
          strokeWidth: 2,
          animated: false,
        });
      }
    });
  }

  // 2. Real call edges (call graph + JSX render tree)
  if (analysis.callEdges && analysis.callEdges.length > 0) {
    const seen = new Set<string>();
    analysis.callEdges.forEach((edge: any) => {
      const key = `${edge.from}→${edge.to}`;
      if (seen.has(key)) return;

      const fromNode = findNodeByName(edge.from, nodes, nodeByName);
      const toNode = findNodeByName(edge.to, nodes, nodeByName);

      if (fromNode && toNode && fromNode.id !== toNode.id) {
        seen.add(key);

        const isJsx = edge.callType === 'jsx-render';
        const isHook = edge.callType === 'hook';

        realConnections.push({
          fromId: fromNode.id,
          toId: toNode.id,
          from: { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height },
          to: { x: toNode.x + toNode.width / 2, y: toNode.y },
          color: isJsx ? '#06b6d4' : isHook ? '#8b5cf6' : '#60a5fa',
          label: edge.label || edge.callType,
          detail: `${edge.from} → ${edge.to}`,
          strokeWidth: isJsx ? 2 : 3,
          strokeDasharray: isJsx ? '6,3' : undefined,
          animated: false,
        });
      }
    });
  }

  // 3. Import usage edges
  if (analysis.importUsage && analysis.importUsage.length > 0) {
    const importSeen = new Set<string>();
    analysis.importUsage.forEach((usage: any) => {
      usage.usedIn.forEach((funcName: string) => {
        const key = `${usage.name}→${funcName}`;
        if (importSeen.has(key)) return;
        const importNode = findImportNode(usage.name, usage.module, nodes);
        const funcNode = findNodeByName(funcName, nodes, nodeByName);
        if (importNode && funcNode && importNode.id !== funcNode.id) {
          importSeen.add(key);
          realConnections.push({
            fromId: importNode.id,
            toId: funcNode.id,
            from: { x: importNode.x + importNode.width / 2, y: importNode.y + importNode.height },
            to: { x: funcNode.x + funcNode.width / 2, y: funcNode.y },
            color: '#f59e0b',
            label: 'used by',
            detail: `${usage.name} used in ${funcName}`,
            strokeWidth: 1.5,
            animated: false,
          });
        }
      });
    });
  }

  connections.push(...realConnections);

  return {
    id: 'semantic-architecture-analysis',
    title: `Semantic Architecture Flow - ${analysis.summary.main_language}`,
    description: `Intelligent architecture visualization showing real call graph, JSX render tree, hook semantics, and import usage`,
    viewBox: '0 0 4500 800',
    nodes,
    connections,
    legendItems
  };
}
