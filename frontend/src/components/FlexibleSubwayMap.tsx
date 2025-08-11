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
}

const FlexibleSubwayMap: React.FC<FlexibleSubwayMapProps> = ({ 
  scenario, 
  onScenarioChange,
  availableScenarios = [],
  onNodeClick
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
  const getCanvasBounds = () => {
    if (!scenario.nodes.length) return { width: 2400, height: 1400, minX: 0, minY: 0 };
    
    const positions = scenario.nodes.map(node => ({
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

  const bounds = getCanvasBounds();

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

  // Export visualization as PDF
  const exportToPDF = async () => {
    try {
      // Find the main visualization container (the div containing the SVG)
      const visualizationDiv = mapRef.current?.querySelector('div[style*="transform"]');
      if (!visualizationDiv) {
        console.error('Visualization container not found');
        return;
      }

      // Create a temporary container with white background for the export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.width = '1200px';
      exportContainer.style.height = 'auto';
      
      // Add title and metadata
      const titleElement = document.createElement('h1');
      titleElement.textContent = scenario.title;
      titleElement.style.color = '#000';
      titleElement.style.fontSize = '24px';
      titleElement.style.marginBottom = '10px';
      titleElement.style.fontFamily = 'Arial, sans-serif';
      titleElement.style.textAlign = 'center';
      
      const descElement = document.createElement('p');
      descElement.textContent = scenario.description;
      descElement.style.color = '#666';
      descElement.style.fontSize = '14px';
      descElement.style.marginBottom = '20px';
      descElement.style.fontFamily = 'Arial, sans-serif';
      descElement.style.textAlign = 'center';
      
      exportContainer.appendChild(titleElement);
      exportContainer.appendChild(descElement);
      
      // Clone the entire visualization div
      const vizClone = visualizationDiv.cloneNode(true) as HTMLElement;
      
      // Reset transform and ensure proper sizing for export
      vizClone.style.transform = 'scale(0.8)';
      vizClone.style.transformOrigin = 'top center';
      vizClone.style.background = '#ffffff';
      vizClone.style.width = '100%';
      vizClone.style.height = 'auto';
      vizClone.style.overflow = 'visible';
      
      // Update SVG background and text colors
      const svgElement = vizClone.querySelector('svg');
      if (svgElement) {
        svgElement.style.background = '#ffffff';
        
        // Update text colors for better visibility on white background
        const textElements = svgElement.querySelectorAll('text');
        textElements.forEach(text => {
          const currentFill = text.getAttribute('fill');
          if (currentFill === '#fff' || currentFill === 'white' || currentFill === '#ffffff') {
            text.setAttribute('fill', '#000000');
          } else if (currentFill && currentFill.includes('#')) {
            // Keep colored text as is for better visualization
          } else {
            // Default dark text for readability
            text.setAttribute('fill', '#333333');
          }
        });
        
        // Ensure connections are visible
        const pathElements = svgElement.querySelectorAll('path');
        pathElements.forEach(path => {
          const currentStroke = path.getAttribute('stroke');
          if (currentStroke === 'white' || currentStroke === '#fff') {
            path.setAttribute('stroke', '#333333');
          }
        });
      }
      
      exportContainer.appendChild(vizClone);
      document.body.appendChild(exportContainer);

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture as canvas with better settings
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Good quality without being too large
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: exportContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3' // Larger format to accommodate the visualization
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
      const filename = `${scenario.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pdf`;
      
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

        {/* SVG Flow Diagram */}
        <div 
          className="relative w-full h-[600px] overflow-auto border border-slate-600 rounded-lg bg-slate-900"
          onWheel={handleWheelZoom}
        >
          <div 
            className="transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
              width: `${bounds.width * zoom}px`,
              height: `${bounds.height * zoom}px`,
              minWidth: `${bounds.width}px`,
              minHeight: `${bounds.height}px`
            }}
          >
            <svg 
              width={bounds.width} 
              height={bounds.height}
              viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} 
              className="block"
              preserveAspectRatio="xMinYMin meet"
            >
            <defs>
              {/* Create arrow markers for each unique color */}
              {Array.from(new Set(scenario.connections.map((conn, index) => getConnectionColor(conn, index)))).map(color => (
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
            
            {/* Render nodes first */}
            {scenario.nodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNode(node.id);
                  if (onNodeClick) {
                    onNodeClick(node);
                  }
                }}
                style={{ transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
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
            ))}
            
            {/* Render connections on top of nodes */}
            {scenario.connections.map((conn, index) => {
              const midX = (conn.from.x + conn.to.x) / 2;
              const midY = (conn.from.y + conn.to.y) / 2;
              const connectionColor = getConnectionColor(conn, index);
              
              return (
                <g key={index}>
                  <path
                    d={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                    stroke={connectionColor}
                    strokeWidth="4"
                    fill="none"
                    opacity="0.7"
                    markerEnd={`url(#${getArrowMarkerId(connectionColor)})`}
                    className={conn.animated ? "animate-pulse" : ""}
                    style={{
                      filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))',
                      transition: 'all 0.3s ease'
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
                    This diagram shows {scenario.description.toLowerCase()}.
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