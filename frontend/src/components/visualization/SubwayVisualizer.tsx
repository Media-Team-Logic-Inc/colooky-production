import React, { useState, useEffect } from 'react';
import { FileText, Code, Package, Globe, Database, ArrowRight, Zap, Eye, Download } from 'lucide-react';

// Sample analysis data (REPLACE THIS WITH YOUR analysis-results.json)
const sampleAnalysisData = {
  "analysis": {
    "functions": [
      {
        "name": "UserDashboard",
        "line": 5,
        "type": "function"
      },
      {
        "name": "loadUsers",
        "line": 13,
        "type": "function"
      },
      {
        "name": "handleUserClick",
        "line": 31,
        "type": "function"
      }
    ],
    "imports": [
      {
        "source": "react",
        "line": 1,
        "type": "import"
      },
      {
        "source": "axios",
        "line": 2,
        "type": "import"
      },
      {
        "source": "./services/user",
        "line": 3,
        "type": "import"
      }
    ],
    "apiCalls": [
      {
        "url": "/api/users",
        "line": 16,
        "type": "api_call"
      },
      {
        "url": "/api/users",
        "line": 27,
        "type": "api_call"
      }
    ]
  },
  "visualization": {
    "nodes": [
      {
        "id": "file:sample-code.js",
        "name": "sample-code.js",
        "type": "file",
        "position": {
          "x": 100,
          "y": 100
        },
        "color": "#1f2937"
      },
      {
        "id": "func:UserDashboard",
        "name": "UserDashboard",
        "type": "function",
        "position": {
          "x": 300,
          "y": 100
        },
        "color": "#3b82f6",
        "metadata": {
          "line": 5
        }
      },
      {
        "id": "func:loadUsers",
        "name": "loadUsers",
        "type": "function",
        "position": {
          "x": 450,
          "y": 100
        },
        "color": "#3b82f6",
        "metadata": {
          "line": 13
        }
      },
      {
        "id": "func:handleUserClick",
        "name": "handleUserClick",
        "type": "function",
        "position": {
          "x": 600,
          "y": 100
        },
        "color": "#3b82f6",
        "metadata": {
          "line": 31
        }
      },
      {
        "id": "import:0",
        "name": "react",
        "type": "import",
        "position": {
          "x": 100,
          "y": 200
        },
        "color": "#10b981",
        "metadata": {
          "line": 1
        }
      },
      {
        "id": "import:1",
        "name": "axios",
        "type": "import",
        "position": {
          "x": 100,
          "y": 260
        },
        "color": "#10b981",
        "metadata": {
          "line": 2
        }
      },
      {
        "id": "import:2",
        "name": "./services/user",
        "type": "import",
        "position": {
          "x": 100,
          "y": 320
        },
        "color": "#10b981",
        "metadata": {
          "line": 3
        }
      },
      {
        "id": "api:0",
        "name": "/api/users",
        "type": "api_call",
        "position": {
          "x": 600,
          "y": 100
        },
        "color": "#ef4444",
        "metadata": {
          "line": 16
        }
      },
      {
        "id": "api:1",
        "name": "/api/users",
        "type": "api_call",
        "position": {
          "x": 600,
          "y": 180
        },
        "color": "#ef4444",
        "metadata": {
          "line": 27
        }
      }
    ],
    "connections": [
      {
        "from": "file:sample-code.js",
        "to": "func:UserDashboard",
        "type": "contains"
      },
      {
        "from": "file:sample-code.js",
        "to": "func:loadUsers",
        "type": "contains"
      },
      {
        "from": "file:sample-code.js",
        "to": "func:handleUserClick",
        "type": "contains"
      },
      {
        "from": "import:0",
        "to": "file:sample-code.js",
        "type": "imports"
      },
      {
        "from": "import:1",
        "to": "file:sample-code.js",
        "type": "imports"
      },
      {
        "from": "import:2",
        "to": "file:sample-code.js",
        "type": "imports"
      },
      {
        "from": "func:UserDashboard",
        "to": "api:0",
        "type": "calls"
      },
      {
        "from": "func:UserDashboard",
        "to": "api:1",
        "type": "calls"
      }
    ]
  },
  "timestamp": "2025-08-02T23:07:23.237Z",
  "summary": {
    "totalNodes": 9,
    "totalConnections": 8,
    "nodeTypes": {
      "functions": 3,
      "imports": 3,
      "apiCalls": 2
    }
  }
};

const ColookySubwayVisualizer = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [analysisData, setAnalysisData] = useState(sampleAnalysisData);
  const [showStats, setShowStats] = useState(true);

  // Get icon for node type
  const getNodeIcon = (type) => {
    const icons = {
      file: FileText,
      function: Code,
      import: Package,
      api_call: Globe,
      database: Database
    };
    return icons[type] || Code;
  };

  // Get color scheme for node type
  const getNodeColors = (type) => {
    const colors = {
      file: { bg: '#1f2937', border: '#374151', text: '#ffffff' },
      function: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
      import: { bg: '#10b981', border: '#059669', text: '#ffffff' },
      api_call: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
      database: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }
    };
    return colors[type] || colors.function;
  };

  // Generate path for connections
  const generatePath = (from, to, type) => {
    const isImport = type === 'imports';
    const isCalls = type === 'calls';
    
    if (isImport) {
      // Curved line from import to file
      const midX = (from.x + to.x) / 2;
      const midY = from.y - 30;
      return `M ${from.x + 120} ${from.y + 20} Q ${midX} ${midY} ${to.x} ${to.y + 20}`;
    } else if (isCalls) {
      // Curved line from function to API
      const midX = (from.x + to.x) / 2;
      const midY = from.y - 40;
      return `M ${from.x + 120} ${from.y + 20} Q ${midX} ${midY} ${to.x} ${to.y + 20}`;
    } else {
      // Straight line for contains
      return `M ${from.x + 120} ${from.y + 20} L ${to.x} ${to.y + 20}`;
    }
  };

  // Load analysis from file (simulated)
  const loadAnalysisFile = () => {
    // In real app, this would read the analysis-results.json file
    setAnalysisData(sampleAnalysisData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Colooky Subway Map</h1>
              <p className="text-blue-200">Code Flow Visualization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={loadAnalysisFile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Load Analysis</span>
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Panel */}
          {showStats && (
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Functions</span>
                    <span className="text-blue-400 font-semibold">{analysisData.analysis.functions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Imports</span>
                    <span className="text-green-400 font-semibold">{analysisData.analysis.imports.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">API Calls</span>
                    <span className="text-red-400 font-semibold">{analysisData.analysis.apiCalls.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Total Nodes</span>
                    <span className="text-purple-400 font-semibold">{analysisData.visualization.nodes.length}</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-slate-600 rounded"></div>
                    <span className="text-slate-300 text-sm">File</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-slate-300 text-sm">Function</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-slate-300 text-sm">Import</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-slate-300 text-sm">API Call</span>
                  </div>
                </div>
              </div>

              {/* Node Details */}
              {selectedNode && (
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Node Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-sm">Name:</span>
                      <p className="text-white font-medium">{selectedNode.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Type:</span>
                      <p className="text-white capitalize">{selectedNode.type.replace('_', ' ')}</p>
                    </div>
                    {selectedNode.metadata?.line && (
                      <div>
                        <span className="text-slate-400 text-sm">Line:</span>
                        <p className="text-white">{selectedNode.metadata.line}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subway Map Visualization */}
          <div className={`${showStats ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-xl p-6 min-h-[600px]">
              <div className="relative w-full h-full overflow-hidden">
                <svg 
                  viewBox="0 0 800 500" 
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                >
                  {/* Grid Pattern */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
                    </pattern>
                    
                    {/* Arrow markers */}
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64b5f6" opacity="0.8" />
                    </marker>
                  </defs>
                  
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Connections */}
                  {analysisData.visualization.connections.map((connection, index) => {
                    const fromNode = analysisData.visualization.nodes.find(n => n.id === connection.from);
                    const toNode = analysisData.visualization.nodes.find(n => n.id === connection.to);
                    
                    if (!fromNode || !toNode) return null;
                    
                    const pathData = generatePath(fromNode.position, toNode.position, connection.type);
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill="none"
                        stroke={connection.type === 'imports' ? '#10b981' : connection.type === 'calls' ? '#ef4444' : '#64b5f6'}
                        strokeWidth="3"
                        opacity="0.7"
                        markerEnd="url(#arrowhead)"
                        className="transition-all duration-300 hover:opacity-100 hover:stroke-width-4"
                      />
                    );
                  })}

                  {/* Nodes */}
                  {analysisData.visualization.nodes.map((node, index) => {
                    const colors = getNodeColors(node.type);
                    const Icon = getNodeIcon(node.type);
                    const isHovered = hoveredNode?.id === node.id;
                    const isSelected = selectedNode?.id === node.id;
                    
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.position.x}, ${node.position.y})`}
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedNode(node)}
                      >
                        {/* Node background */}
                        <rect
                          x="0"
                          y="0"
                          width="120"
                          height="40"
                          rx="8"
                          fill={colors.bg}
                          stroke={isSelected ? '#fbbf24' : colors.border}
                          strokeWidth={isSelected ? "3" : "2"}
                          className={`transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
                          filter={isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : ''}
                        />
                        
                        {/* Icon */}
                        <foreignObject x="8" y="8" width="24" height="24">
                          <Icon className="w-6 h-6 text-white" />
                        </foreignObject>
                        
                        {/* Text */}
                        <text
                          x="38"
                          y="25"
                          fill={colors.text}
                          fontSize="12"
                          fontWeight="500"
                          className="pointer-events-none"
                        >
                          {node.name.length > 12 ? `${node.name.slice(0, 12)}...` : node.name}
                        </text>
                        
                        {/* Line number badge */}
                        {node.metadata?.line && (
                          <circle
                            cx="110"
                            cy="10"
                            r="8"
                            fill="#fbbf24"
                            className={`transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}
                          />
                        )}
                        {node.metadata?.line && (
                          <text
                            x="110"
                            y="14"
                            fill="#000"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {node.metadata.line}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Data Preview */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Raw Analysis Data Preview</h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              {JSON.stringify(analysisData.analysis, null, 2).slice(0, 500)}...
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColookySubwayVisualizer;