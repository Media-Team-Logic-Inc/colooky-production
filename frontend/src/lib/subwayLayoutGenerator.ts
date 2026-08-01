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
  type?: 'file' | 'function' | 'class' | 'api' | 'database' | 'auth' | 'error' | 'frontend' | 'external' | 'import' | string;
}

export interface SubwayConnection {
  id?: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
  label?: string;
  isError?: boolean;
  style?: 'solid' | 'dashed';
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

// Generate hierarchical triangular layout from analysis data
export function generateSubwayLayout(analysisData: any): {
  nodes: SubwayNode[];
  connections: SubwayConnection[];
  viewBox: string;
  legendItems: Array<{ color: string; label: string }>;
} {
  if (!analysisData?.nodes) {
    return createEmptyLayout();
  }

  
  // NEW: Use hierarchical triangular layout for any size
  const classifiedNodes = classifyNodes(analysisData.nodes);
  const layoutNodes = generateHierarchicalTriangularLayout(classifiedNodes);
  
  // Generate smooth connections
  const connections = generateConnections(layoutNodes, analysisData.connections);
  
  // Create legend
  const legendItems = createLegend(layoutNodes);

  // Calculate dynamic viewBox that GUARANTEES all nodes are visible
  const viewBox = calculateOptimalViewBox(layoutNodes);


  return {
    nodes: layoutNodes,
    connections,
    viewBox,
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

// NEW: Generate hierarchical triangular layout that scales to any size
function generateHierarchicalTriangularLayout(nodes: any[]): SubwayNode[] {
  const positioned: SubwayNode[] = [];
  
  // Sort nodes by type and importance for hierarchical flow
  const sortedNodes = [...nodes].sort((a, b) => {
    const typeOrder = ['frontend', 'api', 'auth', 'database', 'external', 'error'];
    const aIndex = typeOrder.indexOf(a.nodeType);
    const bIndex = typeOrder.indexOf(b.nodeType);
    
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.title.localeCompare(b.title); // Secondary sort by name
  });

  // Group nodes by type
  const nodesByType: Record<string, any[]> = {};
  sortedNodes.forEach(node => {
    const type = node.nodeType || 'api';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  });

  // Layout configuration for CENTERED hierarchical triangular design
  const config = {
    centerX: 800, // Center point of the entire layout
    startY: 100,
    levelHeight: 150, // Vertical spacing between hierarchy levels
    nodeSpacing: 180, // Horizontal spacing between nodes
    triangleSpread: 1.4, // How much wider each level gets
    maxNodesPerRow: Math.max(6, Math.ceil(Math.sqrt(sortedNodes.length * 0.8))) // Dynamic max nodes per row
  };

  let currentY = config.startY;
  let globalIndex = 0;
  
  // Create hierarchical levels
  const typeOrder = ['frontend', 'api', 'auth', 'database', 'external', 'error'];
  
  typeOrder.forEach((typeName, levelIndex) => {
    const typeNodes = nodesByType[typeName] || [];
    if (typeNodes.length === 0) return;
    
    
    // Calculate nodes per row for this level (triangular expansion)
    const triangularFactor = Math.pow(config.triangleSpread, levelIndex);
    const maxNodesThisLevel = Math.ceil(config.maxNodesPerRow * triangularFactor);
    const rowsNeeded = Math.ceil(typeNodes.length / maxNodesThisLevel);
    
    let nodeIndex = 0;
    
    // Create rows for this level - PROPERLY CENTERED
    for (let row = 0; row < rowsNeeded; row++) {
      const nodesInThisRow = Math.min(maxNodesThisLevel, typeNodes.length - nodeIndex);
      
      // CENTER the row horizontally around the centerX point
      const totalRowWidth = (nodesInThisRow - 1) * config.nodeSpacing;
      const rowStartX = config.centerX - (totalRowWidth / 2); // Center around centerX
      const rowY = currentY + (row * 90); // Small vertical offset for multiple rows
      
      // Position nodes in this row
      for (let i = 0; i < nodesInThisRow && nodeIndex < typeNodes.length; i++) {
        const node = typeNodes[nodeIndex];
        const x = rowStartX + (i * config.nodeSpacing);
        
        const colors = NODE_COLORS[node.nodeType as keyof typeof NODE_COLORS] || NODE_COLORS.api;
        const isErrorNode = node.nodeType === 'error' || node.isError;
        
        positioned.push({
          id: node.id,
          title: node.title,
          x: x, // Don't enforce minimum - let it be negative if needed for centering
          y: rowY,
          width: isErrorNode ? 130 : 160, // Slightly wider for better readability
          height: isErrorNode ? 40 : 50, // Slightly taller
          color: colors.fill,
          strokeColor: colors.stroke,
          stepNumber: !isErrorNode && globalIndex < 20 ? globalIndex + 1 : undefined,
          details: node.details || [],
          isError: isErrorNode,
          type: node.nodeType
        });
        
        nodeIndex++;
        globalIndex++;
      }
    }
    
    // Move to next level with proper spacing
    currentY += config.levelHeight + (rowsNeeded > 1 ? (rowsNeeded - 1) * 90 : 0);
  });

  return positioned;
}

// Calculate optimal viewBox that GUARANTEES all nodes are visible with generous padding
function calculateOptimalViewBox(nodes: SubwayNode[]): string {
  if (nodes.length === 0) return "0 0 1600 1000";
  
  // Find ACTUAL bounds of all nodes including their full width/height
  const leftEdges = nodes.map(n => n.x);
  const rightEdges = nodes.map(n => n.x + n.width);
  const topEdges = nodes.map(n => n.y);
  const bottomEdges = nodes.map(n => n.y + n.height);
  
  const minX = Math.min(...leftEdges);
  const maxX = Math.max(...rightEdges);
  const minY = Math.min(...topEdges);
  const maxY = Math.max(...bottomEdges);
  
  
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  
  // Add GENEROUS padding (30% of content size, minimum 300px)
  const paddingX = Math.max(300, contentWidth * 0.3);
  const paddingY = Math.max(200, contentHeight * 0.3);
  
  const finalMinX = minX - paddingX;
  const finalMinY = minY - paddingY;
  const finalWidth = contentWidth + (2 * paddingX);
  const finalHeight = contentHeight + (2 * paddingY);
  
  // Ensure reasonable minimum dimensions
  const viewBoxWidth = Math.max(1600, finalWidth);
  const viewBoxHeight = Math.max(1000, finalHeight);
  const viewBoxX = Math.min(finalMinX, 0);
  const viewBoxY = Math.min(finalMinY, 0);
  
  const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
  
  return viewBox;
}

// Generate beautiful curved connections like the demo
function generateConnections(nodes: SubwayNode[], originalConnections?: any[]): SubwayConnection[] {
  const connections: SubwayConnection[] = [];
  
  
  // Group nodes by type for intelligent connections
  const nodesByType: Record<string, SubwayNode[]> = {};
  nodes.forEach(node => {
    const type = node.type || 'api';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  });
  
  const typeOrder = ['frontend', 'api', 'auth', 'database', 'external'];
  
  // Create hierarchical flow connections (like demo)
  for (let i = 0; i < typeOrder.length - 1; i++) {
    const currentType = typeOrder[i];
    const nextType = typeOrder[i + 1];
    
    const currentNodes = nodesByType[currentType] || [];
    const nextNodes = nodesByType[nextType] || [];
    
    if (currentNodes.length > 0 && nextNodes.length > 0) {
      // Connect first node of current type to first node of next type
      const fromNode = currentNodes[0];
      const toNode = nextNodes[0];
      
      connections.push(createBeautifulConnection(fromNode, toNode, `hierarchy-${i}`, false));
    }
  }
  
  // Create lateral connections within types (like demo branching)
  Object.entries(nodesByType).forEach(([type, typeNodes]) => {
    if (typeNodes.length > 1) {
      for (let i = 0; i < typeNodes.length - 1; i++) {
        connections.push(createBeautifulConnection(typeNodes[i], typeNodes[i + 1], `lateral-${type}-${i}`, false));
      }
    }
  });
  
  // Connect error nodes to nearest non-error nodes with dashed lines
  const errorNodes = nodes.filter(n => n.isError);
  const mainNodes = nodes.filter(n => !n.isError);
  
  errorNodes.forEach((errorNode, index) => {
    if (mainNodes.length > 0) {
      // Find closest main node
      const closestMain = mainNodes.reduce((closest, node) => {
        const closestDistance = Math.sqrt(
          Math.pow(closest.x - errorNode.x, 2) + Math.pow(closest.y - errorNode.y, 2)
        );
        const nodeDistance = Math.sqrt(
          Math.pow(node.x - errorNode.x, 2) + Math.pow(node.y - errorNode.y, 2)
        );
        return nodeDistance < closestDistance ? node : closest;
      });
      
      connections.push(createBeautifulConnection(closestMain, errorNode, `error-${index}`, true));
    }
  });
  
  return connections;
}

// Create a beautiful connection between two nodes (like the demo)
function createBeautifulConnection(fromNode: SubwayNode, toNode: SubwayNode, id: string, isError: boolean): SubwayConnection {
  return {
    id,
    from: {
      x: fromNode.x + fromNode.width / 2,
      y: fromNode.y + fromNode.height / 2
    },
    to: {
      x: toNode.x + toNode.width / 2,
      y: toNode.y + toNode.height / 2
    },
    color: isError ? '#ef4444' : getConnectionColor(fromNode.type),
    animated: !isError,
    isError,
    style: isError ? 'dashed' : 'solid'
  };
}

// Get beautiful connection colors based on source node type
function getConnectionColor(nodeType?: string): string {
  const colorMap = {
    frontend: '#3b82f6',    // Blue like demo
    api: '#10b981',         // Green like demo
    auth: '#8b5cf6',        // Purple like demo
    database: '#f59e0b',    // Orange like demo
    external: '#6b7280',    // Gray
    error: '#ef4444'        // Red
  };
  
  return colorMap[nodeType as keyof typeof colorMap] || '#6366f1';
}


// Create legend based on node types present
function createLegend(nodes: SubwayNode[]): Array<{ color: string; label: string }> {
  const typesPresent = new Set(nodes.map(n => n.type).filter(Boolean) as string[]);
  const legend: Array<{ color: string; label: string }> = [];
  
  const legendMap: Record<string, { color: string; label: string }> = {
    'frontend': { color: '#3b82f6', label: 'Frontend/UI' },
    'api': { color: '#10b981', label: 'API/Backend' },
    'database': { color: '#f59e0b', label: 'Database' },
    'auth': { color: '#8b5cf6', label: 'Auth/Security' },
    'external': { color: '#6b7280', label: 'External Service' },
    'error': { color: '#ef4444', label: 'Error Handling' },
    'file': { color: '#94a3b8', label: 'Files' },
    'function': { color: '#60a5fa', label: 'Functions' },
    'class': { color: '#c084fc', label: 'Classes' },
    'import': { color: '#6b7280', label: 'Imports' }
  };
  
  // Add legend items for types that are present
  Object.entries(legendMap).forEach(([type, config]) => {
    if (typesPresent.has(type)) {
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
    viewBox: "0 0 1200 800", // Larger default size
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