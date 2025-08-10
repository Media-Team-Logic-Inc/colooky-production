import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface SubwayNode {
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

interface SubwayConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
}

const EnhancedSubwayMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [legendPosition, setLegendPosition] = useState({ top: 24, right: 24 });
  const [infoPanelPosition, setInfoPanelPosition] = useState({ bottom: 24, left: 24 });
  const [isDragging, setIsDragging] = useState<'legend' | 'info' | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const nodes: SubwayNode[] = [
    {
      id: 'signup-btn',
      title: 'SignupButton.jsx',
      x: 50, y: 60, width: 120, height: 40,
      color: '#3b82f6', strokeColor: '#60a5fa',
      stepNumber: 1,
      details: [
        'File: src/components/SignupButton.jsx',
        'Triggers onClick handler',
        'Opens signup modal',
        'Line 23: setShowModal(true)'
      ]
    },
    {
      id: 'form-modal',
      title: 'SignupModal.jsx',
      x: 120, y: 130, width: 120, height: 40,
      color: '#3b82f6', strokeColor: '#60a5fa',
      stepNumber: 2,
      details: [
        'File: src/components/SignupModal.jsx',
        'Renders form with email/password fields',
        'Client-side validation',
        'Calls handleSubmit on form submission'
      ]
    },
    {
      id: 'form-submit',
      title: 'handleSubmit()',
      x: 190, y: 200, width: 120, height: 40,
      color: '#3b82f6', strokeColor: '#60a5fa',
      stepNumber: 3,
      details: [
        'Function: handleSubmit() in SignupModal.jsx',
        'Validates form data locally',
        'Makes API call to /api/auth/signup',
        'Handles loading states'
      ]
    },
    {
      id: 'api-call',
      title: '/api/auth/signup',
      x: 370, y: 130, width: 120, height: 40,
      color: '#10b981', strokeColor: '#34d399',
      stepNumber: 4,
      details: [
        'File: src/pages/api/auth/signup.js',
        'HTTP POST endpoint',
        'Validates request body',
        'Calls authentication service'
      ]
    },
    {
      id: 'jwt-validate',
      title: 'validateJWT()',
      x: 440, y: 60, width: 120, height: 40,
      color: '#8b5cf6', strokeColor: '#a78bfa',
      stepNumber: 5,
      details: [
        'File: src/lib/auth.js',
        'Function: validateJWT()',
        'Checks token expiration',
        'Verifies signature'
      ]
    },
    {
      id: 'password-hash',
      title: 'bcrypt.hash()',
      x: 590, y: 130, width: 120, height: 40,
      color: '#8b5cf6', strokeColor: '#a78bfa',
      details: [
        'Library: bcrypt',
        'Salt rounds: 12',
        'Async operation',
        'Returns hashed password'
      ]
    },
    {
      id: 'db-insert',
      title: 'User.create()',
      x: 520, y: 260, width: 120, height: 40,
      color: '#f59e0b', strokeColor: '#fbbf24',
      details: [
        'Model: User (Prisma/Mongoose)',
        'Function: User.create()',
        'Inserts to users table',
        'Returns user object'
      ]
    },
    {
      id: 'response',
      title: 'JSON Response',
      x: 370, y: 330, width: 120, height: 40,
      color: '#10b981', strokeColor: '#34d399',
      details: [
        'HTTP 201: Created',
        'Returns user object (sanitized)',
        'Includes authentication token',
        'Sets secure cookies'
      ]
    },
    {
      id: 'redirect',
      title: 'router.push()',
      x: 190, y: 300, width: 120, height: 40,
      color: '#3b82f6', strokeColor: '#60a5fa',
      details: [
        'Function: router.push()',
        'Next.js navigation',
        'Redirects to /dashboard',
        'Updates browser history'
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard.jsx',
      x: 120, y: 370, width: 120, height: 40,
      color: '#3b82f6', strokeColor: '#60a5fa',
      details: [
        'File: src/pages/dashboard.jsx',
        'Protected route',
        'Shows user welcome message',
        'Loads user-specific data'
      ]
    },
    // Error nodes
    {
      id: 'validation-error',
      title: 'ValidationError',
      x: 320, y: 220, width: 80, height: 30,
      color: '#ef4444', strokeColor: '#f87171',
      details: [
        'HTTP 400: Bad Request',
        'Returns error details',
        'Shows in UI toast/alert',
        'Form remains open'
      ]
    },
    {
      id: 'auth-error',
      title: 'AuthError',
      x: 640, y: 80, width: 80, height: 30,
      color: '#ef4444', strokeColor: '#f87171',
      details: [
        'HTTP 401: Unauthorized',
        'Invalid credentials',
        'Logs security event',
        'Returns generic error message'
      ]
    }
  ];

  const connections: SubwayConnection[] = [
    { from: { x: 110, y: 100 }, to: { x: 180, y: 130 }, color: '#64b5f6' },
    { from: { x: 180, y: 170 }, to: { x: 250, y: 200 }, color: '#64b5f6' },
    { from: { x: 310, y: 220 }, to: { x: 430, y: 170 }, color: '#10b981' },
    { from: { x: 430, y: 130 }, to: { x: 500, y: 100 }, color: '#8b5cf6' },
    { from: { x: 560, y: 80 }, to: { x: 650, y: 130 }, color: '#8b5cf6' },
    { from: { x: 650, y: 170 }, to: { x: 580, y: 260 }, color: '#f59e0b' },
    { from: { x: 520, y: 280 }, to: { x: 430, y: 330 }, color: '#10b981' },
    { from: { x: 370, y: 350 }, to: { x: 250, y: 300 }, color: '#10b981' },
    { from: { x: 190, y: 320 }, to: { x: 180, y: 370 }, color: '#64b5f6' },
    // Error connections
    { from: { x: 310, y: 230 }, to: { x: 320, y: 235 }, color: '#ef4444', animated: true },
    { from: { x: 560, y: 90 }, to: { x: 640, y: 95 }, color: '#ef4444', animated: true },
  ];

  const legendItems = [
    { color: '#3b82f6', label: 'Frontend/UI' },
    { color: '#10b981', label: 'API/Backend' },
    { color: '#f59e0b', label: 'Database' },
    { color: '#8b5cf6', label: 'Auth/Security' },
    { color: '#ef4444', label: 'Error Handling' },
    { color: '#6b7280', label: 'External Service' },
  ];

  const selectedNodeInfo = nodes.find(node => node.id === selectedNode);

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
      {/* Header */}
      <div className="text-center p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">Code Flow Visualization</h2>
        <p className="text-slate-400">User Signup Flow - From Button Click to Database</p>
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
              {legendItems.map((item, index) => (
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
            {connections.map((conn, index) => (
              <path
                key={index}
                d={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                stroke={conn.color}
                strokeWidth="3"
                fill="none"
                opacity="0.8"
                markerEnd="url(#arrowhead)"
                className={conn.animated ? "animate-pulse" : ""}
              />
            ))}
            
            {/* Render nodes */}
            {nodes.map((node) => (
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
                  This diagram shows the complete flow from when a user clicks "Sign Up" to when they land on the dashboard.
                </p>
                <p className="text-xs text-slate-300">
                  <strong>Colors represent different layers:</strong> Blue for frontend, Green for API, Purple for security, Yellow for database operations.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubwayMap;