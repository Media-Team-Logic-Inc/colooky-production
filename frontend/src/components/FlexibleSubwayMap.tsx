import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Move, ZoomIn, ZoomOut, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface FlowScenario {
  id: string;
  title: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  legendItems: LegendItem[];
}

export interface FlowNode {
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
}

interface FlowConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
  label?: string;
  detail?: string;
}

interface LegendItem {
  color: string;
  label: string;
}

interface FlexibleSubwayMapProps {
  scenario: FlowScenario;
  onScenarioChange?: (scenarioId: string) => void;
  availableScenarios?: FlowScenario[];
  onNodeClick?: (nodeDetails: any) => void;
  repositoryInfo?: {
    owner: string;
    name: string;
    full_name: string;
  };
  analysisInfo?: {
    selectedFiles?: string[];
    fileCount?: number;
    analysisType?: string;
  };
}

const FlexibleSubwayMap: React.FC<FlexibleSubwayMapProps> = ({ 
  scenario, 
  onScenarioChange,
  availableScenarios = [],
  onNodeClick,
  repositoryInfo,
  analysisInfo
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [legendPosition, setLegendPosition] = useState({ top: 24, right: 24 });
  const [infoPanelPosition, setInfoPanelPosition] = useState({ bottom: 24, left: 24 });
  const [isDragging, setIsDragging] = useState<'legend' | 'info' | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const selectedNodeInfo = scenario.nodes.find(node => node.id === selectedNode);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.1));

  const handleMouseDown = (panel: 'legend' | 'info') => {
    setIsDragging(panel);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging === 'legend') {
      setLegendPosition({ 
        top: Math.max(0, y - 50), 
        right: Math.max(0, rect.width - x - 100)
      });
    } else if (isDragging === 'info') {
      setInfoPanelPosition({ 
        bottom: Math.max(0, rect.height - y - 50), 
        left: Math.max(0, x - 100)
      });
    }
  };

  const handleMouseUp = () => setIsDragging(null);

  // Calculate dynamic canvas bounds based on actual node positions
  const getCanvasBounds = (nodes = scenario.nodes) => {
    if (!nodes.length) return { width: 2400, height: 1400, minX: 0, minY: 0 };
    
    const positions = nodes.map(node => ({
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height
    }));
    
    const minX = Math.min(...positions.map(p => p.x)) - 100;
    const minY = Math.min(...positions.map(p => p.y)) - 100;
    const maxX = Math.max(...positions.map(p => p.x + p.width)) + 100;
    const maxY = Math.max(...positions.map(p => p.y + p.height)) + 100;
    
    return {
      width: Math.max(maxX - minX, 2400),
      height: Math.max(maxY - minY, 1400),
      minX,
      minY
    };
  };

  // Handle mouse wheel zoom with center-based zooming
  const handleWheelZoom = (event: React.WheelEvent) => {
    event.preventDefault();
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const delta = event.deltaY;
    const zoomSpeed = 0.001;
    const oldZoom = zoom;
    const newZoom = Math.max(0.1, Math.min(3, zoom - delta * zoomSpeed));
    
    if (newZoom !== oldZoom) {
      // Zoom towards center
      const zoomRatio = newZoom / oldZoom;
      const newPanOffset = {
        x: panOffset.x + (centerX - centerX * zoomRatio),
        y: panOffset.y + (centerY - centerY * zoomRatio)
      };
      
      setPanOffset(newPanOffset);
      setZoom(newZoom);
    }
  };

  // Advanced layout algorithm to reduce node overlap
  const optimizeNodeLayout = (nodes: FlowNode[]) => {
    if (nodes.length < 10) return nodes; // Skip for small layouts
    
    const optimizedNodes = [...nodes];
    const minDistance = 150; // Minimum distance between nodes
    const iterations = 3; // Number of optimization passes
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < optimizedNodes.length; i++) {
        for (let j = i + 1; j < optimizedNodes.length; j++) {
          const nodeA = optimizedNodes[i];
          const nodeB = optimizedNodes[j];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance && distance > 0) {
            // Calculate push vector
            const pushX = (dx / distance) * (minDistance - distance) * 0.5;
            const pushY = (dy / distance) * (minDistance - distance) * 0.5;
            
            // Apply push (half to each node)
            nodeA.x -= pushX;
            nodeA.y -= pushY;
            nodeB.x += pushX;
            nodeB.y += pushY;
          }
        }
      }
    }
    
    return optimizedNodes;
  };
  
  // Apply layout optimization for better visualization
  const optimizedScenario = {
    ...scenario,
    nodes: scenario.nodes.length > 15 ? optimizeNodeLayout(scenario.nodes) : scenario.nodes
  };
  
  const bounds = getCanvasBounds();
  const optimizedBounds = getCanvasBounds(optimizedScenario.nodes);

  // Get dynamic line color based on connection type and nodes
  const getConnectionColor = (connection: FlowConnection, index: number) => {
    // Try to find the source node to match its color
    const fromNode = scenario.nodes.find(node => 
      connection.from.x >= node.x - 10 && connection.from.x <= node.x + node.width + 10 &&
      connection.from.y >= node.y - 10 && connection.from.y <= node.y + node.height + 10
    );
    
    const toNode = scenario.nodes.find(node => 
      connection.to.x >= node.x - 10 && connection.to.x <= node.x + node.width + 10 &&
      connection.to.y >= node.y - 10 && connection.to.y <= node.y + node.height + 10
    );
    
    // If we have a source node, use its color with some transparency
    if (fromNode) {
      return fromNode.color;
    }
    
    // If we have a target node, use its color
    if (toNode) {
      return toNode.color;
    }
    
    // Fallback to connection's existing color or default
    return connection.color || '#64b5f6';
  };

  // Get arrow marker ID for different colors
  const getArrowMarkerId = (color: string) => {
    return `arrowhead-${color.replace('#', '')}`;
  };

  // Export visualization as PDF with improved SVG handling
  const exportToPDF = async () => {
    try {
      // Find the SVG element directly
      const svgElement = mapRef.current?.querySelector('svg');
      if (!svgElement) {
        console.error('SVG element not found');
        return;
      }

      // Create a temporary container for proper PDF generation
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Add title and metadata
      const titleElement = document.createElement('h1');
      const repoName = repositoryInfo ? repositoryInfo.full_name : 'Repository';
      
      // Create comprehensive title with file info
      let titleText = `${scenario.title} - ${repoName}`;
      if (analysisInfo?.fileCount) {
        const fileInfo = analysisInfo.fileCount > 1 
          ? `${analysisInfo.fileCount} files` 
          : analysisInfo.selectedFiles?.[0] || '1 file';
        titleText += ` (${fileInfo})`;
      }
      
      titleElement.textContent = titleText;
      titleElement.style.color = '#000';
      titleElement.style.fontSize = '24px';
      titleElement.style.marginBottom = '10px';
      titleElement.style.fontFamily = 'Arial, sans-serif';
      titleElement.style.textAlign = 'center';
      
      const descElement = document.createElement('p');
      let description = scenario.description;
      if (analysisInfo?.selectedFiles && analysisInfo.selectedFiles.length <= 3) {
        // Show individual filenames for small selections
        const fileNames = analysisInfo.selectedFiles.map(f => f.split('/').pop()).join(', ');
        description += ` - Files: ${fileNames}`;
      }
      descElement.textContent = description;
      descElement.style.color = '#666';
      descElement.style.fontSize = '14px';
      descElement.style.marginBottom = '20px';
      descElement.style.fontFamily = 'Arial, sans-serif';
      descElement.style.textAlign = 'center';
      
      exportContainer.appendChild(titleElement);
      exportContainer.appendChild(descElement);
      
      // Clone and prepare SVG for export
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      
      // Determine if this is a large analysis
      const nodeCount = optimizedScenario.nodes.length;
      const isLargeAnalysis = nodeCount > 20;
      
      // Set proper dimensions for PDF
      const originalWidth = parseFloat(svgClone.getAttribute('width') || '1000');
      const originalHeight = parseFloat(svgClone.getAttribute('height') || '600');
      
      // Scale for better readability
      const pdfScale = isLargeAnalysis ? 0.7 : 0.9;
      const finalWidth = originalWidth * pdfScale;
      const finalHeight = originalHeight * pdfScale;
      
      svgClone.setAttribute('width', finalWidth.toString());
      svgClone.setAttribute('height', finalHeight.toString());
      svgClone.style.background = '#ffffff';
      
      // Ensure all text and paths are visible on white background
      const textElements = svgClone.querySelectorAll('text');
      textElements.forEach(text => {
        const currentFill = text.getAttribute('fill');
        if (currentFill === '#fff' || currentFill === 'white' || currentFill === '#ffffff' || !currentFill) {
          text.setAttribute('fill', '#000000');
        }
      });
      
      // Make sure connection lines are visible
      const pathElements = svgClone.querySelectorAll('path');
      pathElements.forEach(path => {
        const currentStroke = path.getAttribute('stroke');
        if (currentStroke === 'white' || currentStroke === '#fff' || currentStroke === '#ffffff') {
          path.setAttribute('stroke', '#333333');
        }
      });
      
      // Create wrapper div for the SVG
      const svgWrapper = document.createElement('div');
      svgWrapper.style.display = 'flex';
      svgWrapper.style.justifyContent = 'center';
      svgWrapper.style.marginTop = '20px';
      svgWrapper.appendChild(svgClone);
      
      exportContainer.appendChild(svgWrapper);
      document.body.appendChild(exportContainer);

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture as canvas with optimized settings for SVG
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality for crisp output
        useCORS: true,
        allowTaint: true,
        logging: false,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0
      });

      // Create PDF with format based on analysis size
      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdfFormat = isLargeAnalysis ? 'a2' : 'a3'; // Even larger format for big analyses
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: pdfFormat
      });

      // Calculate dimensions to fit the page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = canvas.width / canvas.height;
      
      let finalWidth = pdfWidth - 20; // 10mm margin on each side
      let finalHeight = finalWidth / imgAspectRatio;
      
      // If height is too big, scale based on height instead
      if (finalHeight > pdfHeight - 20) {
        finalHeight = pdfHeight - 20;
        finalWidth = finalHeight * imgAspectRatio;
      }
      
      // Center the image
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const repoNameForFile = repositoryInfo ? repositoryInfo.name : 'analysis';
      const filename = `${repoNameForFile}_${scenario.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pdf`;
      
      pdf.save(filename);
      
      // Clean up
      document.body.removeChild(exportContainer);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700">
      {/* Header with scenario selector */}
      <div className="text-center p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">{scenario.title}</h2>
        <p className="text-slate-400 mb-4">{scenario.description}</p>
        
        {availableScenarios.length > 1 && onScenarioChange && (
          <div className="flex flex-wrap justify-center gap-2">
            {availableScenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => onScenarioChange(s.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  s.id === scenario.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div 
        ref={mapRef}
        className="relative p-6"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          {/* PDF Export Button */}
          <button
            onClick={exportToPDF}
            className="p-2 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg transition-colors group"
            title="Export as PDF"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
          
          {/* Divider */}
          <div className="w-full h-px bg-slate-600 my-1" />
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <div className="text-xs text-slate-400 text-center">{Math.round(zoom * 100)}%</div>
        </div>

        {/* Movable Legend */}
        <div 
          className="absolute bg-slate-800/95 border border-slate-600 rounded-lg z-10 cursor-move"
          style={{ 
            top: `${legendPosition.top}px`, 
            right: `${legendPosition.right}px`,
            minWidth: legendCollapsed ? 'auto' : '120px'
          }}
        >
          <div 
            className="flex items-center justify-between p-2 border-b border-slate-600"
            onMouseDown={() => handleMouseDown('legend')}
          >
            <h3 className="text-sm font-semibold text-white">Legend</h3>
            <div className="flex items-center gap-1">
              <Move className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setLegendCollapsed(!legendCollapsed)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                {legendCollapsed ? 
                  <ChevronDown className="w-3 h-3 text-slate-400" /> : 
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                }
              </button>
            </div>
          </div>
          {!legendCollapsed && (
            <div className="p-3">
              {scenario.legendItems.map((item, index) => (
                <div key={index} className="flex items-center mb-2 last:mb-0">
                  <div 
                    className="w-4 h-4 rounded mr-2 flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced CSS animations for maximum visual impact */}
        <style>{`
          @keyframes connectionFlow {
            0% { stroke-dashoffset: 12; }
            100% { stroke-dashoffset: 0; }
          }
          
          @keyframes marchingAnts {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -20; }
          }
          
          @keyframes pulseGlow {
            0% { filter: drop-shadow(0 0 5px currentColor) brightness(1); }
            50% { filter: drop-shadow(0 0 15px currentColor) brightness(1.3); }
            100% { filter: drop-shadow(0 0 5px currentColor) brightness(1); }
          }
          
          @keyframes nodeAppear {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          .error-connection {
            animation: marchingAnts 1s linear infinite;
          }
          
          .pulsing-node {
            animation: pulseGlow 2s ease-in-out infinite;
          }
          
          .appearing-node {
            animation: nodeAppear 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}</style>
        
        {/* SVG Flow Diagram */}
        <div 
          className="relative w-full h-[600px] overflow-auto border border-slate-600 rounded-lg bg-slate-900"
        >
          <div 
            className="transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
              width: `${optimizedBounds.width * zoom}px`,
              height: `${optimizedBounds.height * zoom}px`,
              minWidth: `${optimizedBounds.width}px`,
              minHeight: `${optimizedBounds.height}px`
            }}
          >
            <svg 
              width={optimizedBounds.width} 
              height={optimizedBounds.height}
              viewBox={`${optimizedBounds.minX} ${optimizedBounds.minY} ${optimizedBounds.width} ${optimizedBounds.height}`} 
              className="block"
              preserveAspectRatio="xMinYMin meet"
            >
            <defs>
              {/* Create arrow markers for each unique color */}
              {Array.from(new Set(optimizedScenario.connections.map((conn, index) => getConnectionColor(conn, index)))).map(color => (
                <marker 
                  key={color}
                  id={getArrowMarkerId(color)} 
                  markerWidth="10" 
                  markerHeight="7" 
                  refX="9" 
                  refY="3.5" 
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              ))}
              {/* Fallback default arrow */}
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64b5f6" />
              </marker>
            </defs>
            
            {/* Render nodes first with step numbers and enhanced animations */}
            {optimizedScenario.nodes.map((node, nodeIndex) => {
              const stepNumber = nodeIndex + 1;
              return (
                <g key={node.id}>
                  {/* Step number circle */}
                  <circle
                    cx={node.x - 15}
                    cy={node.y + node.height / 2}
                    r="12"
                    fill={node.color}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2"
                  />
                  <text
                    x={node.x - 15}
                    y={node.y + node.height / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {stepNumber}
                  </text>
                  
                  {/* Enhanced node with stunning hover effects */}
                  <g
                    className={`cursor-pointer appearing-node ${selectedNode === node.id ? 'pulsing-node' : ''}`}
                    onClick={() => {
                      setSelectedNode(node.id);
                      if (onNodeClick) {
                        onNodeClick(node);
                      }
                    }}
                    style={{ 
                      transformOrigin: `${node.x + node.width/2}px ${node.y + node.height/2}px`,
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      animationDelay: `${nodeIndex * 0.1}s`
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.filter = `brightness(1.25) drop-shadow(0 6px 20px ${node.color}40)`;
                      e.currentTarget.style.zIndex = '100';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'brightness(1)';
                      e.currentTarget.style.zIndex = 'auto';
                    }}
                  >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="8"
                  ry="8"
                  fill={node.color}
                  stroke={node.strokeColor}
                  strokeWidth="2"
                  fillOpacity="0.9"
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="500"
                >
                  {node.title}
                </text>
                
                {/* Step number circles */}
                {node.stepNumber && (
                  <>
                    <circle
                      cx={node.x - 5}
                      cy={node.y + node.height / 2}
                      r="12"
                      fill="#64b5f6"
                    />
                    <text
                      x={node.x - 5}
                      y={node.y + node.height / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {node.stepNumber}
                    </text>
                  </>
                )}
                  </g>
                </g>
              );
            })}
            
            {/* Render elegant curved connections */}
            {optimizedScenario.connections.map((conn, index) => {
              const connectionColor = getConnectionColor(conn, index);
              
              // Create smooth curved paths
              const dx = conn.to.x - conn.from.x;
              const dy = conn.to.y - conn.from.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Control points for natural curves
              const curvature = Math.min(distance * 0.25, 80);
              const midX = (conn.from.x + conn.to.x) / 2;
              const midY = (conn.from.y + conn.to.y) / 2;
              
              // Perpendicular offset for elegant curve
              const perpX = -dy / distance * curvature;
              const perpY = dx / distance * curvature;
              
              const controlX = midX + perpX;
              const controlY = midY + perpY;
              
              const curvePath = `M ${conn.from.x} ${conn.from.y} Q ${controlX} ${controlY} ${conn.to.x} ${conn.to.y}`;
              
              // Determine connection type and animation
              const isErrorConnection = connectionColor === '#ef4444' || connectionColor === '#f87171';
              const isAnimated = conn.animated || isErrorConnection;
              
              return (
                <g key={index}>
                  <path
                    d={curvePath}
                    stroke={connectionColor}
                    strokeWidth={isErrorConnection ? "4" : "3"}
                    fill="none"
                    opacity={isErrorConnection ? "0.9" : "0.8"}
                    markerEnd={`url(#${getArrowMarkerId(connectionColor)})`}
                    className={isErrorConnection ? 'error-connection' : ''}
                    style={{
                      filter: isErrorConnection 
                        ? 'drop-shadow(0px 3px 6px rgba(239, 68, 68, 0.4))' 
                        : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
                      transition: 'all 0.3s ease',
                      strokeDasharray: isErrorConnection 
                        ? '10 5' 
                        : (conn.animated ? '8 4' : 'none'),
                      animation: isErrorConnection 
                        ? 'marchingAnts 1s linear infinite' 
                        : (conn.animated ? 'connectionFlow 2s linear infinite' : 'none')
                    }}
                  />
                  {conn.label && (
                    <g>
                      <rect
                        x={midX - 25}
                        y={midY - 10}
                        width="50"
                        height="20"
                        fill="rgba(0, 0, 0, 0.8)"
                        rx="10"
                        ry="10"
                      />
                      <text
                        x={midX}
                        y={midY + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize="10"
                        fontWeight="500"
                      >
                        {conn.label}
                      </text>
                      {conn.detail && (
                        <title>{conn.detail}</title>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            </svg>
          </div>
        </div>

        {/* Movable Node Information Panel */}
        <div 
          className="absolute bg-slate-800/95 border border-slate-600 rounded-lg z-10 max-w-sm cursor-move"
          style={{ 
            bottom: `${infoPanelPosition.bottom}px`, 
            left: `${infoPanelPosition.left}px`,
            minWidth: infoPanelCollapsed ? 'auto' : '200px'
          }}
        >
          <div 
            className="flex items-center justify-between p-2 border-b border-slate-600"
            onMouseDown={() => handleMouseDown('info')}
          >
            <h3 className="text-sm font-semibold text-white">Node Info</h3>
            <div className="flex items-center gap-1">
              <Move className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setInfoPanelCollapsed(!infoPanelCollapsed)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                {infoPanelCollapsed ? 
                  <ChevronUp className="w-3 h-3 text-slate-400" /> : 
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                }
              </button>
            </div>
          </div>
          {!infoPanelCollapsed && (
            <div className="p-3">
              {selectedNodeInfo ? (
                <>
                  <h4 className="text-blue-400 font-semibold mb-2">{selectedNodeInfo.title}</h4>
                  {selectedNodeInfo.details.map((detail, index) => (
                    <p key={index} className="text-xs text-slate-300 mb-1">• {detail}</p>
                  ))}
                </>
              ) : (
                <>
                  <h4 className="text-blue-400 font-semibold mb-2">Click any node to see details</h4>
                  <p className="text-xs text-slate-300 mb-1">
                    This diagram shows {optimizedScenario.description.toLowerCase()}.
                  </p>
                  <p className="text-xs text-slate-300">
                    <strong>Colors represent different layers:</strong> Each color represents a different system component or responsibility.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlexibleSubwayMap;