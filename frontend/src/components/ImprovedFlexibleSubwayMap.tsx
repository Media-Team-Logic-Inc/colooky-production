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
  viewBox?: string; // Added for subway layout support
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
  isError?: boolean; // NEW: Add error detection
}

interface FlowConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
  label?: string;
  detail?: string;
  isError?: boolean; // NEW: Add error connection detection
}

interface LegendItem {
  color: string;
  label: string;
}

interface ImprovedFlexibleSubwayMapProps {
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

const ImprovedFlexibleSubwayMap: React.FC<ImprovedFlexibleSubwayMapProps> = ({ 
  scenario, 
  onScenarioChange,
  availableScenarios = [],
  onNodeClick,
  repositoryInfo,
  analysisInfo
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggedNodes, setDraggedNodes] = useState<{[key: string]: {x: number, y: number}}>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const visualizationRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedNodeInfo = scenario.nodes.find(node => node.id === selectedNode);

  // Enhanced node click handler
  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node.id);
    setCodeViewerOpen(true);
    if (onNodeClick) {
      onNodeClick({
        id: node.id,
        title: node.title,
        details: node.details,
        isError: node.isError
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.1));
  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setDraggedNodes({}); // Reset node positions
  };

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string, originalX: number, originalY: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const [viewX, viewY, viewWidth, viewHeight] = (scenario.viewBox || "0 0 1000 500").split(' ').map(Number);
    
    // Convert screen coordinates to SVG coordinates
    const scaleX = viewWidth / rect.width;
    const scaleY = viewHeight / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX + viewX;
    const svgY = (e.clientY - rect.top) * scaleY + viewY;

    setIsDragging(nodeId);
    setDragStart({ x: svgX, y: svgY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const [viewX, viewY, viewWidth, viewHeight] = (scenario.viewBox || "0 0 1000 500").split(' ').map(Number);
    
    // Convert screen coordinates to SVG coordinates
    const scaleX = viewWidth / rect.width;
    const scaleY = viewHeight / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX + viewX;
    const svgY = (e.clientY - rect.top) * scaleY + viewY;

    // Calculate offset from drag start
    const deltaX = svgX - dragStart.x;
    const deltaY = svgY - dragStart.y;

    // Find the original node position
    const originalNode = scenario.nodes.find(n => n.id === isDragging);
    if (!originalNode) return;

    // Calculate new position with bounds checking
    const newX = Math.max(viewX + 10, Math.min(originalNode.x + deltaX, viewX + viewWidth - originalNode.width - 10));
    const newY = Math.max(viewY + 10, Math.min(originalNode.y + deltaY, viewY + viewHeight - originalNode.height - 10));

    setDraggedNodes(prev => ({
      ...prev,
      [isDragging]: { x: newX, y: newY }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragStart(null);
  };

  // Get effective node position (dragged or original)
  const getNodePosition = (node: any) => {
    const dragged = draggedNodes[node.id];
    return dragged ? dragged : { x: node.x, y: node.y };
  };

  // Enhanced PDF export - captures ONLY the visualization
  const exportToPDF = async () => {
    try {
      const svgElement = svgRef.current;
      if (!svgElement) {
        alert('Visualization not ready for export. Please try again.');
        return;
      }

      // Create clean export container
      const exportContainer = document.createElement('div');
      exportContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 1200px;
        height: 800px;
        background: #0f1419;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-sizing: border-box;
      `;

      // Header section matching demo style
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        color: #fff;
      `;
      
      const title = document.createElement('h1');
      title.style.cssText = `
        font-size: 24px;
        font-weight: 600;
        color: #64b5f6;
        margin: 0 0 8px 0;
      `;
      title.textContent = scenario.title;
      
      const subtitle = document.createElement('p');
      subtitle.style.cssText = `
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
      `;
      subtitle.textContent = scenario.description;
      
      headerDiv.appendChild(title);
      headerDiv.appendChild(subtitle);

      // Clone and prepare SVG
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      const svgContainer = document.createElement('div');
      svgContainer.style.cssText = `
        width: 100%;
        height: 680px;
        background: #1a1f29;
        border-radius: 12px;
        padding: 20px;
        box-sizing: border-box;
        position: relative;
      `;
      
      svgClone.style.cssText = `
        width: 100%;
        height: 100%;
        background: transparent;
      `;
      
      svgClone.setAttribute('width', '1120');
      svgClone.setAttribute('height', '640');

      // Add legend to export
      const legendDiv = document.createElement('div');
      legendDiv.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(26, 31, 41, 0.95);
        border: 1px solid #374151;
        border-radius: 8px;
        padding: 15px;
        font-size: 12px;
        color: #fff;
      `;
      
      scenario.legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.style.cssText = `
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        `;
        
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
          width: 16px;
          height: 16px;
          border-radius: 3px;
          margin-right: 8px;
          background: ${item.color};
        `;
        
        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.color = '#fff';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendDiv.appendChild(legendItem);
      });

      svgContainer.appendChild(svgClone);
      svgContainer.appendChild(legendDiv);
      exportContainer.appendChild(headerDiv);
      exportContainer.appendChild(svgContainer);
      document.body.appendChild(exportContainer);

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture with html2canvas
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#0f1419',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1200,
        height: 800
      });

      document.body.removeChild(exportContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      const scale = Math.min(availableWidth / (canvas.width / 2.83), availableHeight / (canvas.height / 2.83));
      const finalWidth = (canvas.width / 2.83) * scale;
      const finalHeight = (canvas.height / 2.83) * scale;
      
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${repositoryInfo?.name || 'code-analysis'}-flow-${timestamp}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Use fixed viewBox like the demo for consistent layout
  const viewBox = scenario.viewBox || "0 0 1000 500";
  const [viewX, viewY, viewWidth, viewHeight] = viewBox.split(' ').map(Number);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Visualization Area - Takes full height when code viewer closed */}
      <div 
        className={`relative overflow-hidden transition-all duration-300 ${
          codeViewerOpen ? 'h-1/2' : 'flex-1'
        }`}
        style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f29 100%)' }}
      >
        {/* Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <button
            onClick={exportToPDF}
            className="p-2 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg transition-colors"
            title="Export as PDF"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
          
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
          
          <button
            onClick={handleZoomReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-xs text-white"
            title="Reset Zoom & Positions"
          >
            Reset
          </button>
          
          {Object.keys(draggedNodes).length > 0 && (
            <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-2 text-xs text-blue-300">
              <div className="font-medium">Custom Layout</div>
              <div>{Object.keys(draggedNodes).length} nodes moved</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={`absolute top-6 right-6 z-20 transition-all duration-300 ${
          legendCollapsed ? 'w-10' : 'w-auto'
        }`}>
          <div className="bg-slate-800/95 border border-slate-600 rounded-lg backdrop-blur-sm">
            <div className="flex items-center justify-between p-3">
              <span className={`text-white font-medium ${legendCollapsed ? 'hidden' : 'block'}`}>
                Legend
              </span>
              <button
                onClick={() => setLegendCollapsed(!legendCollapsed)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {legendCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            
            {!legendCollapsed && (
              <div className="px-3 pb-3 space-y-2">
                {scenario.legendItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Visualization */}
        <div 
          ref={visualizationRef}
          className="w-full h-full overflow-hidden"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          >
            <defs>
              {/* Arrow markers for different colors */}
              {Array.from(new Set(scenario.connections.map(c => c.color))).map(color => (
                <marker
                  key={`arrowhead-${color.replace('#', '')}`}
                  id={`arrowhead-${color.replace('#', '')}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              ))}
            </defs>

            {/* Connections - Demo style curved paths with drag support */}
            {scenario.connections.map((connection, index) => {
              // Find nodes that might be dragged and update connection points
              const fromNode = scenario.nodes.find(n => 
                Math.abs(n.x - connection.from.x) < 50 && Math.abs(n.y - connection.from.y) < 50
              );
              const toNode = scenario.nodes.find(n => 
                Math.abs(n.x - connection.to.x) < 50 && Math.abs(n.y - connection.to.y) < 50
              );

              // Use dragged positions if available
              const fromPos = fromNode ? getNodePosition(fromNode) : connection.from;
              const toPos = toNode ? getNodePosition(toNode) : connection.to;
              
              // Adjust connection points to node edges
              const fromX = fromNode ? fromPos.x + fromNode.width/2 : fromPos.x;
              const fromY = fromNode ? fromPos.y + fromNode.height/2 : fromPos.y;
              const toX = toNode ? toPos.x + toNode.width/2 : toPos.x;
              const toY = toNode ? toPos.y + toNode.height/2 : toPos.y;

              // Calculate smooth curve
              const dx = toX - fromX;
              const dy = toY - fromY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Control point for smooth curves
              const controlX = fromX + dx * 0.5;
              const controlY = fromY + (distance > 200 ? dy * 0.3 : dy * 0.5);
              
              const pathData = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    className="connection"
                    fill="none"
                    stroke={connection.isError ? '#ef4444' : connection.color}
                    strokeWidth="3"
                    opacity={connection.isError ? 0.6 : 0.8}
                    markerEnd={`url(#arrowhead-${(connection.isError ? 'ef4444' : connection.color.replace('#', ''))})`}
                    style={{
                      strokeDasharray: connection.animated ? '8 4' : 'none',
                      animation: connection.animated ? 'dash 2s linear infinite' : 'none'
                    }}
                  />
                  {connection.label && (
                    <text
                      x={controlX}
                      y={controlY - 10}
                      textAnchor="middle"
                      className="text-xs fill-slate-300"
                      style={{ fontSize: '11px' }}
                    >
                      {connection.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes - Demo style with drag support */}
            {scenario.nodes.map((node) => {
              const position = getNodePosition(node);
              const isDraggingThis = isDragging === node.id;
              
              return (
                <g key={node.id}>
                  {/* Step number indicator (positioned like demo) */}
                  {node.stepNumber && (
                    <g>
                      <circle
                        cx={position.x - 15}
                        cy={position.y + node.height / 2}
                        r="12"
                        fill={node.isError ? '#ef4444' : '#64b5f6'}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <text
                        x={position.x - 15}
                        y={position.y + node.height / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold"
                        style={{ fontSize: '10px' }}
                      >
                        {node.stepNumber}
                      </text>
                    </g>
                  )}
                  
                  {/* Node with drag support */}
                  <g 
                    className="node"
                    style={{ 
                      cursor: isDraggingThis ? 'grabbing' : 'grab',
                      transition: isDraggingThis ? 'none' : 'all 0.3s ease',
                      transformOrigin: `${position.x + node.width/2}px ${position.y + node.height/2}px`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, node.id, node.x, node.y)}
                    onMouseEnter={(e) => {
                      if (!isDraggingThis) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.filter = 'brightness(1.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDraggingThis) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'brightness(1)';
                      }
                    }}
                    onClick={() => !isDraggingThis && handleNodeClick(node)}
                  >
                    {/* Node background */}
                    <rect
                      className="node-rect"
                      x={position.x}
                      y={position.y}
                      width={node.width}
                      height={node.height}
                      rx="8"
                      ry="8"
                      fill={node.isError ? '#ef4444' : node.color}
                      stroke={node.isError ? '#f87171' : node.strokeColor}
                      strokeWidth={isDraggingThis ? "3" : "2"}
                      fillOpacity="0.9"
                      style={{
                        filter: selectedNode === node.id ? 'drop-shadow(0 0 8px #fbbf24)' : 
                                isDraggingThis ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.5))' : 'none'
                      }}
                    />
                    
                    {/* Node text */}
                    <text
                      className="node-text"
                      x={position.x + node.width / 2}
                      y={position.y + node.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      style={{ 
                        fontSize: node.isError ? '10px' : '12px',
                        fontWeight: '500',
                        pointerEvents: 'none' // Prevent text from interfering with drag
                      }}
                    >
                      {node.title}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Code Viewer - Below visualization when open */}
      {codeViewerOpen && (
        <div className="h-1/2 bg-slate-800 border-t border-slate-600 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-600">
            <h3 className="text-white font-medium">
              {selectedNodeInfo ? selectedNodeInfo.title : 'Node Details'}
            </h3>
            <button
              onClick={() => setCodeViewerOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            {selectedNodeInfo ? (
              <div className="space-y-3">
                {selectedNodeInfo.isError && (
                  <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 font-medium">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      Error Detected
                    </div>
                  </div>
                )}
                
                {selectedNodeInfo.details.map((detail, index) => (
                  <div key={index} className="text-slate-300 text-sm">
                    <span className="text-slate-500">•</span> {detail}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">
                Click any node to see details
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
      `}</style>
    </div>
  );
};

export default ImprovedFlexibleSubwayMap;