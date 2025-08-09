import React, { useEffect, useRef } from 'react';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'function' | 'class' | 'import' | 'export' | 'api_call';
  complexity?: number;
  color: string;
}

interface Connection {
  from: string;
  to: string;
  type: 'dependency' | 'flow' | 'call';
  color: string;
}

interface SubwayMapProps {
  entities: any[];
  flows: any[];
  selectedFlow?: string;
}

const SubwayMap: React.FC<SubwayMapProps> = ({ entities, flows, selectedFlow }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !entities.length) return;

    // Create subway map layout
    const nodes = createNodes(entities, flows, selectedFlow);
    const connections = createConnections(entities, flows, selectedFlow);
    
    renderSubwayMap(svgRef.current, nodes, connections);
  }, [entities, flows, selectedFlow]);

  const createNodes = (entities: any[], flows: any[], selectedFlow?: string): Node[] => {
    const selectedFlowData = flows.find(f => f.id === selectedFlow);
    const relevantEntities = selectedFlowData 
      ? entities.filter(e => selectedFlowData.steps.includes(e.id) || selectedFlowData.steps.includes(e.name))
      : entities.slice(0, 8); // Show first 8 entities if no flow selected

    return relevantEntities.map((entity, index) => {
      const angle = (index / relevantEntities.length) * 2 * Math.PI;
      const radius = Math.min(200, 50 + relevantEntities.length * 15);
      
      return {
        id: entity.id,
        name: entity.name,
        x: 300 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        type: entity.entityType,
        complexity: entity.complexity,
        color: getNodeColor(entity.entityType, entity.complexity)
      };
    });
  };

  const createConnections = (entities: any[], flows: any[], selectedFlow?: string): Connection[] => {
    const selectedFlowData = flows.find(f => f.id === selectedFlow);
    if (!selectedFlowData) return [];

    const connections: Connection[] = [];
    const steps = selectedFlowData.steps;

    // Create flow connections between sequential steps
    for (let i = 0; i < steps.length - 1; i++) {
      connections.push({
        from: steps[i],
        to: steps[i + 1],
        type: 'flow',
        color: selectedFlowData.color || '#3B82F6'
      });
    }

    return connections;
  };

  const getNodeColor = (entityType: string, complexity?: number): string => {
    if (complexity && complexity > 7) return '#EF4444'; // High complexity - red
    if (complexity && complexity > 4) return '#F59E0B'; // Medium complexity - amber
    
    switch (entityType) {
      case 'function': return '#10B981'; // Green
      case 'class': return '#8B5CF6'; // Purple  
      case 'import': return '#06B6D4'; // Cyan
      case 'export': return '#F97316'; // Orange
      case 'api_call': return '#EC4899'; // Pink
      default: return '#6B7280'; // Gray
    }
  };

  const renderSubwayMap = (svg: SVGSVGElement, nodes: Node[], connections: Connection[]) => {
    // Clear previous render
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Draw connections first (behind nodes)
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from || n.name === conn.from);
      const toNode = nodes.find(n => n.id === conn.to || n.name === conn.to);
      
      if (fromNode && toNode) {
        // Draw subway line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2 - 20; // Curve upward
        
        const path = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;
        line.setAttribute('d', path);
        line.setAttribute('stroke', conn.color);
        line.setAttribute('stroke-width', '4');
        line.setAttribute('fill', 'none');
        line.setAttribute('opacity', '0.8');
        g.appendChild(line);

        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowSize = 8;
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const arrowX = toNode.x - 20 * Math.cos(angle);
        const arrowY = toNode.y - 20 * Math.sin(angle);
        
        const points = [
          `${arrowX},${arrowY}`,
          `${arrowX - arrowSize * Math.cos(angle - Math.PI/6)},${arrowY - arrowSize * Math.sin(angle - Math.PI/6)}`,
          `${arrowX - arrowSize * Math.cos(angle + Math.PI/6)},${arrowY - arrowSize * Math.sin(angle + Math.PI/6)}`
        ].join(' ');
        
        arrow.setAttribute('points', points);
        arrow.setAttribute('fill', conn.color);
        g.appendChild(arrow);
      }
    });

    // Draw nodes (on top of connections)
    nodes.forEach(node => {
      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', node.complexity ? Math.max(12, node.complexity * 2).toString() : '12');
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('opacity', '0.9');
      g.appendChild(circle);

      // Node type icon
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', (node.y + 4).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.textContent = getNodeIcon(node.type);
      g.appendChild(text);

      // Node label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', node.x.toString());
      label.setAttribute('y', (node.y + 35).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#374151');
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '600');
      label.textContent = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
      g.appendChild(label);

      // Complexity indicator
      if (node.complexity) {
        const complexityBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        complexityBg.setAttribute('x', (node.x - 8).toString());
        complexityBg.setAttribute('y', (node.y - 25).toString());
        complexityBg.setAttribute('width', '16');
        complexityBg.setAttribute('height', '12');
        complexityBg.setAttribute('fill', '#1F2937');
        complexityBg.setAttribute('rx', '6');
        g.appendChild(complexityBg);

        const complexityText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        complexityText.setAttribute('x', node.x.toString());
        complexityText.setAttribute('y', (node.y - 17).toString());
        complexityText.setAttribute('text-anchor', 'middle');
        complexityText.setAttribute('fill', 'white');
        complexityText.setAttribute('font-size', '8');
        complexityText.setAttribute('font-weight', 'bold');
        complexityText.textContent = node.complexity.toString();
        g.appendChild(complexityText);
      }
    });
  };

  const getNodeIcon = (entityType: string): string => {
    switch (entityType) {
      case 'function': return '⚡';
      case 'class': return '📦';
      case 'import': return '📥';
      case 'export': return '📤';
      case 'api_call': return '🌐';
      default: return '📄';
    }
  };

  return (
    <div ref={containerRef} className="w-full h-96 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-white">
        <h3 className="text-lg font-semibold text-gray-900">Subway Map Visualization</h3>
        <p className="text-sm text-gray-600">Interactive code dependency flow</p>
      </div>
      <div className="relative w-full h-full">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 600 400"
          className="absolute inset-0"
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
        </svg>
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border p-3 text-xs">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Functions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>API Calls</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-blue-500"></div>
              <span>Flow Direction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubwayMap;