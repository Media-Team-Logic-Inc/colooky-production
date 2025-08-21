// Error detection for code analysis visualization

interface ErrorPattern {
  pattern: RegExp;
  type: 'syntax' | 'runtime' | 'logic' | 'security' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
}

// Common error patterns across different languages
const ERROR_PATTERNS: ErrorPattern[] = [
  // JavaScript/TypeScript errors
  { 
    pattern: /console\.error|throw new Error|catch\s*\(|Promise\.reject/i, 
    type: 'runtime', 
    severity: 'error',
    message: 'Error handling detected'
  },
  { 
    pattern: /typeof.*===.*undefined|null\s*check|\.length\s*===\s*0/i, 
    type: 'logic', 
    severity: 'warning',
    message: 'Null/undefined check'
  },
  { 
    pattern: /eval\s*\(|innerHTML\s*=|document\.write/i, 
    type: 'security', 
    severity: 'error',
    message: 'Security vulnerability'
  },
  
  // Python errors
  { 
    pattern: /except\s+|raise\s+|assert\s+|try\s*:/i, 
    type: 'runtime', 
    severity: 'error',
    message: 'Exception handling'
  },
  { 
    pattern: /if\s+.*is\s+None|if\s+not\s+/i, 
    type: 'logic', 
    severity: 'warning',
    message: 'None check or validation'
  },
  
  // Java errors
  { 
    pattern: /catch\s*\(|throws?\s+|new\s+.*Exception/i, 
    type: 'runtime', 
    severity: 'error',
    message: 'Exception handling'
  },
  { 
    pattern: /if\s*\(.*!=\s*null\)|Objects\.isNull/i, 
    type: 'logic', 
    severity: 'warning',
    message: 'Null pointer check'
  },
  
  // Generic patterns
  { 
    pattern: /TODO|FIXME|HACK|XXX/i, 
    type: 'logic', 
    severity: 'warning',
    message: 'Code needs attention'
  },
  { 
    pattern: /setTimeout|setInterval|while\s*\(true\)/i, 
    type: 'performance', 
    severity: 'warning',
    message: 'Performance concern'
  },
  { 
    pattern: /password|secret|key|token.*=|api_key/i, 
    type: 'security', 
    severity: 'error',
    message: 'Potential credential exposure'
  }
];

// Detect errors in code content
export function detectErrors(content: string, filename: string): Array<{
  line: number;
  type: string;
  severity: string;
  message: string;
}> {
  const errors: Array<{
    line: number;
    type: string;
    severity: string;
    message: string;
  }> = [];

  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    ERROR_PATTERNS.forEach(pattern => {
      if (pattern.pattern.test(line)) {
        errors.push({
          line: index + 1,
          type: pattern.type,
          severity: pattern.severity,
          message: pattern.message
        });
      }
    });
  });

  return errors;
}

// Enhanced scenario with error detection
export function enhanceScenarioWithErrors(scenario: any, analysisData?: any): any {
  if (!scenario || !scenario.nodes) return scenario;

  const enhancedNodes = scenario.nodes.map((node: any) => {
    // MUCH MORE PRECISE - Only mark actual error handling, not normal code
    const hasActualErrorKeywords = node.title && (
      /^(catch|throw|fail|exception)$/i.test(node.title) ||
      /TODO:|FIXME:|HACK:/i.test(node.title) ||
      /catch\s*\(|throw\s+new|Promise\.reject/i.test(node.title)
    );

    const hasErrorInDetails = node.details && node.details.some((detail: string) => 
      /throw\s+new|catch\s*\(|try\s*\{|Promise\.reject/i.test(detail)
    );

    // Only mark nodes that are ACTUALLY error handling code
    const isErrorNode = hasActualErrorKeywords || hasErrorInDetails || 
      node.color === '#ef4444'; // Already marked as error in backend

    return {
      ...node,
      isError: isErrorNode,
      color: isErrorNode ? '#ef4444' : node.color,
      strokeColor: isErrorNode ? '#f87171' : node.strokeColor
    };
  });

  const enhancedConnections = scenario.connections.map((connection: any) => {
    // Mark connections as errors if they connect to error nodes
    const fromNode = enhancedNodes.find((n: any) => 
      Math.abs(n.x - connection.from.x) < 50 && Math.abs(n.y - connection.from.y) < 50
    );
    const toNode = enhancedNodes.find((n: any) => 
      Math.abs(n.x - connection.to.x) < 50 && Math.abs(n.y - connection.to.y) < 50
    );

    const isErrorConnection = (fromNode?.isError || toNode?.isError) || 
      connection.animated; // Animated connections often represent errors/warnings

    return {
      ...connection,
      isError: isErrorConnection,
      color: isErrorConnection ? '#ef4444' : connection.color,
      animated: isErrorConnection ? true : connection.animated
    };
  });

  // Add error legend item if we have errors
  const hasErrors = enhancedNodes.some((n: any) => n.isError) || 
    enhancedConnections.some((c: any) => c.isError);

  const enhancedLegendItems = hasErrors 
    ? [
        ...scenario.legendItems,
        { color: '#ef4444', label: 'Error/Warning' }
      ]
    : scenario.legendItems;

  return {
    ...scenario,
    nodes: enhancedNodes,
    connections: enhancedConnections,
    legendItems: enhancedLegendItems
  };
}

// Generate error-aware scenario from file analysis
export function generateErrorAwareScenario(files: string[], analysisData?: any): any {
  // This would typically be called by your analysis backend
  // For now, create a basic scenario structure that can be enhanced
  
  const baseScenario = {
    id: 'file-analysis',
    title: 'Code Flow Analysis',
    description: 'Interactive code flow with error detection',
    nodes: [],
    connections: [],
    legendItems: [
      { color: '#3b82f6', label: 'Frontend/UI' },
      { color: '#10b981', label: 'API/Backend' },
      { color: '#f59e0b', label: 'Database' },
      { color: '#8b5cf6', label: 'Auth/Security' },
      { color: '#6b7280', label: 'External Service' }
    ]
  };

  // This would be populated by your actual analysis
  return enhanceScenarioWithErrors(baseScenario, analysisData);
}

// Add step numbers to enhance visualization like the demo
export function addStepNumbers(scenario: any): any {
  if (!scenario?.nodes) return scenario;

  // Sort nodes by position to determine logical flow order
  const sortedNodes = [...scenario.nodes].sort((a, b) => {
    // Sort by Y position first (top to bottom), then X position (left to right)
    if (Math.abs(a.y - b.y) > 50) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  // Add step numbers to first 10 nodes (like the demo)
  const nodesWithSteps = scenario.nodes.map((node: any) => {
    const stepIndex = sortedNodes.findIndex(n => n.id === node.id);
    return {
      ...node,
      stepNumber: stepIndex < 10 ? stepIndex + 1 : undefined
    };
  });

  return {
    ...scenario,
    nodes: nodesWithSteps
  };
}