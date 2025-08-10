import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Move, ZoomIn, ZoomOut } from 'lucide-react';

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
}

const FlexibleSubwayMap: React.FC<FlexibleSubwayMapProps> = ({ 
  scenario, 
  onScenarioChange,
  availableScenarios = []
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [legendPosition, setLegendPosition] = useState({ top: 24, right: 24 });
  const [infoPanelPosition, setInfoPanelPosition] = useState({ bottom: 24, left: 24 });
  const [isDragging, setIsDragging] = useState<'legend' | 'info' | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const selectedNodeInfo = scenario.nodes.find(node => node.id === selectedNode);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

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
        {/* Zoom Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
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
        <div className="relative w-full h-[500px] overflow-hidden">
          <svg 
            viewBox="0 0 800 420" 
            className="w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64b5f6" />
              </marker>
            </defs>
            
            {/* Render connections */}
            {scenario.connections.map((conn, index) => {
              const midX = (conn.from.x + conn.to.x) / 2;
              const midY = (conn.from.y + conn.to.y) / 2;
              
              return (
                <g key={index}>
                  <path
                    d={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                    stroke={conn.color}
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    markerEnd="url(#arrowhead)"
                    className={conn.animated ? "animate-pulse" : ""}
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
            
            {/* Render nodes */}
            {scenario.nodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(node.id)}
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
          </svg>
        </div>

        {/* Movable Node Information Panel */}
        <div 
          className="absolute bg-slate-800/95 border border-slate-600 rounded-lg z-10 max-w-sm cursor-move"
          style={{ 
            bottom: `${infoPanelPosition.bottom}px`, 
            left: `${infoPanelPosition.left}px` 
          }}
        >
          <div 
            className="flex items-center justify-between p-2 border-b border-slate-600"
            onMouseDown={() => handleMouseDown('info')}
          >
            <h3 className="text-sm font-semibold text-white">Node Info</h3>
            <Move className="w-3 h-3 text-slate-400" />
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default FlexibleSubwayMap;