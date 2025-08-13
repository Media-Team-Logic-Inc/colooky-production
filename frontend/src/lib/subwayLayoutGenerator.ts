// Subway Map Layout Generator - Creates demo-quality layouts

export interface SubwayNode {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeColor: string;
  stepNumber?: number;
  details: string[];
  isError?: boolean;
  type?: 'file' | 'function' | 'class' | 'api' | 'database' | 'auth' | 'error' | 'frontend' | 'external';
}

export interface SubwayConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
  label?: string;
  isError?: boolean;
}

// Layout templates for different analysis types
const LAYOUT_TEMPLATES = {
  // Single file analysis - linear flow
  singleFile: {
    viewBox: "0 0 1000 400",
    positions: [
      { x: 80, y: 150, lane: 'main' },
      { x: 220, y: 150, lane: 'main' },
      { x: 360, y: 150, lane: 'main' },
      { x: 500, y: 150, lane: 'main' },
      { x: 640, y: 150, lane: 'main' },
      { x: 780, y: 150, lane: 'main' },
      { x: 300, y: 80, lane: 'branch' },   // Error/validation branch
      { x: 560, y: 220, lane: 'branch' }   // Success branch
    ]
  },

  // Multi-file flow - subway style with multiple tracks
  multiFile: {
    viewBox: "0 0 1200 600",
    positions: [
      // Main flow track
      { x: 80, y: 80, lane: 'frontend' },
      { x: 200, y: 120, lane: 'frontend' },
      { x: 320, y: 160, lane: 'frontend' },
      
      // API track
      { x: 460, y: 120, lane: 'api' },
      { x: 600, y: 80, lane: 'api' },
      { x: 740, y: 120, lane: 'api' },
      
      // Database track
      { x: 880, y: 160, lane: 'database' },
      { x: 1000, y: 200, lane: 'database' },
      
      // Auth track
      { x: 460, y: 60, lane: 'auth' },
      { x: 600, y: 40, lane: 'auth' },
      
      // Error handling
      { x: 380, y: 200, lane: 'error' },
      { x: 720, y: 180, lane: 'error' }
    ]
  },

  // Complex flow - full subway map
  complex: {
    viewBox: "0 0 1400 700",
    positions: [
      // Entry points
      { x: 80, y: 100, lane: 'frontend' },
      { x: 80, y: 300, lane: 'frontend' },
      
      // Processing layer
      { x: 250, y: 150, lane: 'frontend' },
      { x: 250, y: 250, lane: 'frontend' },
      
      // API gateway
      { x: 450, y: 200, lane: 'api' },
      
      // Auth services
      { x: 600, y: 100, lane: 'auth' },
      { x: 750, y: 120, lane: 'auth' },
      
      // Business logic
      { x: 600, y: 250, lane: 'api' },
      { x: 750, y: 270, lane: 'api' },
      
      // Data layer
      { x: 950, y: 200, lane: 'database' },
      { x: 1100, y: 180, lane: 'database' },
      
      // External services
      { x: 950, y: 350, lane: 'external' },
      
      // Error handling
      { x: 400, y: 350, lane: 'error' },
      { x: 700, y: 380, lane: 'error' }
    ]
  }
};

// Color schemes for different node types
const NODE_COLORS = {
  frontend: { fill: '#3b82f6', stroke: '#60a5fa' },
  api: { fill: '#10b981', stroke: '#34d399' },
  database: { fill: '#f59e0b', stroke: '#fbbf24' },
  auth: { fill: '#8b5cf6', stroke: '#a78bfa' },
  external: { fill: '#6b7280', stroke: '#9ca3af' },
  error: { fill: '#ef4444', stroke: '#f87171' }
};

// Generate subway-style layout from analysis data
export function generateSubwayLayout(analysisData: any): {
  nodes: SubwayNode[];
  connections: SubwayConnection[];
  viewBox: string;
  legendItems: Array<{ color: string; label: string }>;
} {
  if (!analysisData?.nodes) {
    return createEmptyLayout();
  }

  // Determine layout type based on analysis complexity
  const nodeCount = analysisData.nodes.length;
  const layoutType = nodeCount <= 6 ? 'singleFile' : 
                    nodeCount <= 12 ? 'multiFile' : 'complex';
  
  const template = LAYOUT_TEMPLATES[layoutType];
  
  // Classify and position nodes
  const classifiedNodes = classifyNodes(analysisData.nodes);
  const layoutNodes = positionNodes(classifiedNodes, template);
  
  // Generate smooth connections
  const connections = generateConnections(layoutNodes, analysisData.connections);
  
  // Create legend
  const legendItems = createLegend(layoutNodes);

  return {
    nodes: layoutNodes,
    connections,
    viewBox: template.viewBox,
    legendItems
  };
}

// Classify nodes by type for better positioning
function classifyNodes(nodes: any[]): Array<any & { nodeType: string }> {
  return nodes.map(node => {
    const title = node.title?.toLowerCase() || '';
    const details = node.details?.join(' ').toLowerCase() || '';
    
    let nodeType = 'api'; // default
    
    if (title.includes('.jsx') || title.includes('.tsx') || title.includes('component') || 
        title.includes('button') || title.includes('modal') || title.includes('page')) {
      nodeType = 'frontend';
    } else if (title.includes('api/') || title.includes('endpoint') || title.includes('route')) {
      nodeType = 'api';  
    } else if (title.includes('auth') || title.includes('jwt') || title.includes('bcrypt') ||
               title.includes('login') || title.includes('validate')) {
      nodeType = 'auth';
    } else if (title.includes('database') || title.includes('db') || title.includes('.create') ||
               title.includes('user.') || title.includes('model')) {
      nodeType = 'database';
    } else if (title.includes('error') || title.includes('validation') || title.includes('exception') ||
               node.isError) {
      nodeType = 'error';
    } else if (title.includes('external') || title.includes('service') || title.includes('api')) {
      nodeType = 'external';
    }

    return { ...node, nodeType };
  });
}

// Position nodes using subway map logic
function positionNodes(nodes: any[], template: any): SubwayNode[] {
  const positioned: SubwayNode[] = [];
  const laneCounters: Record<string, number> = {};
  
  // Sort nodes by type for logical flow
  const sortedNodes = [...nodes].sort((a, b) => {
    const typeOrder = ['frontend', 'api', 'auth', 'database', 'external', 'error'];
    return typeOrder.indexOf(a.nodeType) - typeOrder.indexOf(b.nodeType);
  });

  sortedNodes.forEach((node, index) => {
    const lane = node.nodeType;
    laneCounters[lane] = (laneCounters[lane] || 0);
    
    // Find available position for this lane
    const lanePositions = template.positions.filter((p: any) => p.lane === lane || p.lane === 'main');
    const positionIndex = laneCounters[lane] % lanePositions.length;
    const position = lanePositions[positionIndex] || template.positions[index % template.positions.length];
    
    const colors = NODE_COLORS[node.nodeType as keyof typeof NODE_COLORS] || NODE_COLORS.api;
    
    // Error nodes are smaller
    const isErrorNode = node.nodeType === 'error' || node.isError;
    const width = isErrorNode ? 100 : 140;
    const height = isErrorNode ? 30 : 40;
    
    positioned.push({
      id: node.id,
      title: node.title,
      x: position.x,
      y: position.y,
      width,
      height,
      color: colors.fill,
      strokeColor: colors.stroke,
      stepNumber: node.nodeType !== 'error' && index < 8 ? index + 1 : undefined,
      details: node.details || [],
      isError: isErrorNode,
      type: node.nodeType
    });
    
    laneCounters[lane]++;
  });

  return positioned;
}

// Generate smooth curved connections like the demo
function generateConnections(nodes: SubwayNode[], originalConnections?: any[]): SubwayConnection[] {
  const connections: SubwayConnection[] = [];
  
  // Create logical flow connections between nodes
  for (let i = 0; i < nodes.length - 1; i++) {
    const fromNode = nodes[i];
    const toNode = nodes[i + 1];
    
    // Skip if both are error nodes
    if (fromNode.isError && toNode.isError) continue;
    
    // Connection points (center-right to center-left)
    const from = {
      x: fromNode.x + fromNode.width,
      y: fromNode.y + fromNode.height / 2
    };
    
    const to = {
      x: toNode.x,
      y: toNode.y + toNode.height / 2
    };
    
    connections.push({
      from,
      to,
      color: fromNode.isError || toNode.isError ? '#ef4444' : fromNode.color,
      animated: fromNode.isError || toNode.isError,
      isError: fromNode.isError || toNode.isError
    });
  }
  
  // Add error branch connections
  const errorNodes = nodes.filter(n => n.isError);
  const mainNodes = nodes.filter(n => !n.isError);
  
  errorNodes.forEach(errorNode => {
    // Connect closest main node to error node
    const closestMain = mainNodes.reduce((closest, node) => {
      const distance = Math.sqrt(
        Math.pow(node.x - errorNode.x, 2) + Math.pow(node.y - errorNode.y, 2)
      );
      const closestDistance = Math.sqrt(
        Math.pow(closest.x - errorNode.x, 2) + Math.pow(closest.y - errorNode.y, 2)
      );
      return distance < closestDistance ? node : closest;
    });
    
    connections.push({
      from: { x: closestMain.x + closestMain.width/2, y: closestMain.y + closestMain.height },
      to: { x: errorNode.x + errorNode.width/2, y: errorNode.y },
      color: '#ef4444',
      animated: true,
      isError: true
    });
  });
  
  return connections;
}

// Create legend based on node types present
function createLegend(nodes: SubwayNode[]): Array<{ color: string; label: string }> {
  const typesPresent = new Set(nodes.map(n => n.type).filter(Boolean));
  const legend: Array<{ color: string; label: string }> = [];
  
  const legendMap = {
    'frontend': { color: '#3b82f6', label: 'Frontend/UI' },
    'api': { color: '#10b981', label: 'API/Backend' },
    'database': { color: '#f59e0b', label: 'Database' },
    'auth': { color: '#8b5cf6', label: 'Auth/Security' },
    'external': { color: '#6b7280', label: 'External Service' },
    'error': { color: '#ef4444', label: 'Error Handling' },
    'file': { color: '#94a3b8', label: 'Files' },
    'function': { color: '#60a5fa', label: 'Functions' },
    'class': { color: '#c084fc', label: 'Classes' }
  } as const;
  
  // Add legend items for types that are present
  Object.entries(legendMap).forEach(([type, config]) => {
    if (typesPresent.has(type as any)) {
      legend.push(config);
    }
  });
  
  return legend;
}

// Create empty layout when no data
function createEmptyLayout() {
  return {
    nodes: [],
    connections: [],
    viewBox: "0 0 1000 500",
    legendItems: []
  };
}

// Transform existing analysis data to subway layout
export function transformToSubwayLayout(scenario: any): any {
  if (!scenario) return scenario;
  
  const subwayLayout = generateSubwayLayout(scenario);
  
  return {
    ...scenario,
    nodes: subwayLayout.nodes,
    connections: subwayLayout.connections,
    legendItems: subwayLayout.legendItems,
    viewBox: subwayLayout.viewBox,
    title: scenario.title || 'Code Flow Analysis',
    description: scenario.description || 'Interactive code flow visualization'
  };
}