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

  // Calculate canvas bounds
  const getCanvasBounds = (nodes = scenario.nodes) => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
    
    const minX = Math.min(...nodes.map(n => n.x)) - 100;
    const minY = Math.min(...nodes.map(n => n.y)) - 100;
    const maxX = Math.max(...nodes.map(n => n.x + n.width)) + 100;
    const maxY = Math.max(...nodes.map(n => n.y + n.height)) + 100;
    
    return { minX, minY, maxX, maxY };
  };

  const bounds = getCanvasBounds();
  const canvasWidth = bounds.maxX - bounds.minX;
  const canvasHeight = bounds.maxY - bounds.minY;

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
            title="Reset Zoom"
          >
            1:1
          </button>
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
            viewBox={`${bounds.minX} ${bounds.minY} ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="xMidYMid meet"
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

            {/* Connections */}
            {scenario.connections.map((connection, index) => {
              const pathData = `M ${connection.from.x} ${connection.from.y} Q ${
                (connection.from.x + connection.to.x) / 2
              } ${
                connection.from.y < connection.to.y 
                  ? connection.from.y - 50 
                  : connection.from.y + 50
              } ${connection.to.x} ${connection.to.y}`;

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={connection.isError ? '#ef4444' : connection.color}
                    strokeWidth="3"
                    opacity={connection.isError ? 0.7 : 0.8}
                    markerEnd={`url(#arrowhead-${(connection.isError ? '#ef4444' : connection.color).replace('#', '')})`}
                    className={connection.animated ? 'animate-pulse' : ''}
                    style={{
                      strokeDasharray: connection.animated ? '8 4' : 'none',
                      animation: connection.animated ? 'dash 2s linear infinite' : 'none'
                    }}
                  />
                  {connection.label && (
                    <text
                      x={(connection.from.x + connection.to.x) / 2}
                      y={(connection.from.y + connection.to.y) / 2}
                      textAnchor="middle"
                      className="text-xs fill-slate-300"
                      dy="-5"
                    >
                      {connection.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {scenario.nodes.map((node) => (
              <g 
                key={node.id} 
                className="cursor-pointer transition-all duration-200 hover:brightness-110"
                onClick={() => handleNodeClick(node)}
                transform={`translate(${node.x}, ${node.y})`}
              >
                {/* Node background */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx="8"
                  ry="8"
                  fill={node.isError ? '#ef4444' : node.color}
                  stroke={node.isError ? '#f87171' : node.strokeColor}
                  strokeWidth="2"
                  fillOpacity="0.9"
                  className={selectedNode === node.id ? 'stroke-yellow-400 stroke-4' : ''}
                />
                
                {/* Node text */}
                <text
                  x={node.width / 2}
                  y={node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-white"
                  style={{ fontSize: '12px' }}
                >
                  {node.title}
                </text>
                
                {/* Step number if present */}
                {node.stepNumber && (
                  <circle
                    cx={-15}
                    cy={node.height / 2}
                    r="12"
                    fill={node.isError ? '#ef4444' : '#64b5f6'}
                    className="stroke-white stroke-2"
                  />
                )}
                {node.stepNumber && (
                  <text
                    x={-15}
                    y={node.height / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-white"
                  >
                    {node.stepNumber}
                  </text>
                )}
              </g>
            ))}
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