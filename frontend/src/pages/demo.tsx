import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SubwayMap from '../components/SubwayMap';

// Demo API types
interface DemoSample {
  id: string;
  name: string;
  description: string;
  tags: string[];
  complexity: string;
  stats: {
    fileCount: number;
    functionCount: number;
    classCount: number;
    linesOfCode: number;
  };
}

interface DemoAnalysis {
  id: string;
  repositoryName: string;
  metadata: {
    fileCount: number;
    functionCount: number;
    classCount: number;
    importCount: number;
    apiCallCount: number;
    linesOfCode: number;
  };
  entities: Array<{
    id: string;
    entityType: string;
    name: string;
    filePath: string;
    complexity?: number;
    metadata: {
      description: string;
      tags: string[];
      httpMethod?: string;
      route?: string;
      requiresAuth?: boolean;
      requiresRole?: string;
    };
  }>;
  flows: Array<{
    id: string;
    name: string;
    description: string;
    steps: string[];
    color: string;
  }>;
  demo: boolean;
}

export default function DemoPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [selectedSample, setSelectedSample] = useState<DemoSample | null>(null);
  const [analysis, setAnalysis] = useState<DemoAnalysis | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load demo samples on mount
  useEffect(() => {
    loadDemoSamples();
  }, []);

  const loadDemoSamples = async () => {
    try {
      setLoading(true);
      // Use custom domain for API in production, fallback to Railway URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.colooky.com'
        : 'https://colooky-production-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/demo/samples`);
      
      if (!response.ok) {
        throw new Error('Failed to load demo samples');
      }
      
      const data = await response.json();
      setSamples(data.samples || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo samples');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleAnalysis = async (sampleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use custom domain for API in production, fallback to Railway URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.colooky.com'
        : 'https://colooky-production-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/demo/analysis/${sampleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load demo analysis');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
      setSelectedFlow(data.analysis.flows?.[0]?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleSelect = (sample: DemoSample) => {
    setSelectedSample(sample);
    loadSampleAnalysis(sample.id);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'function': return '⚡';
      case 'class': return '📦';
      case 'import': return '📥';
      case 'export': return '📤';
      case 'api_call': return '🌐';
      default: return '📄';
    }
  };

  if (loading && !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interactive Demo</h1>
                <p className="text-gray-600">Explore how Colooky analyzes and visualizes code</p>
              </div>
            </div>
            <Link href="/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Try with Your Code
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!selectedSample ? (
          /* Sample Selection */
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose a Demo Project</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSampleSelect(sample)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{sample.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(sample.complexity)}`}>
                      {sample.complexity}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{sample.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {sample.tags.map((tag) => (
                      <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>📁 {sample.stats.fileCount} files</div>
                    <div>⚡ {sample.stats.functionCount} functions</div>
                    <div>📦 {sample.stats.classCount} classes</div>
                    <div>📏 {sample.stats.linesOfCode} lines</div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Explore Analysis →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : analysis ? (
          /* Analysis View */
          <div>
            {/* Analysis Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedSample.name}</h2>
                  <p className="text-gray-600">{selectedSample.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSample(null);
                    setAnalysis(null);
                    setSelectedFlow(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
                >
                  ← Back to Samples
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{analysis.metadata.fileCount}</div>
                  <div className="text-sm text-blue-700">Files</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{analysis.metadata.functionCount}</div>
                  <div className="text-sm text-green-700">Functions</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{analysis.metadata.classCount}</div>
                  <div className="text-sm text-purple-700">Classes</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{analysis.metadata.importCount}</div>
                  <div className="text-sm text-orange-700">Imports</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-pink-600">{analysis.metadata.apiCallCount}</div>
                  <div className="text-sm text-pink-700">API Calls</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-600">{analysis.metadata.linesOfCode}</div>
                  <div className="text-sm text-gray-700">Lines</div>
                </div>
              </div>
            </div>

            {/* Subway Map Visualization */}
            <div className="mb-8">
              <SubwayMap 
                entities={analysis.entities}
                flows={analysis.flows}
                selectedFlow={selectedFlow}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Flow Selection */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Flows</h3>
                  <p className="text-sm text-gray-600 mb-4">Select a flow to highlight it in the subway map above</p>
                  <div className="space-y-3">
                    {analysis.flows.map((flow) => (
                      <button
                        key={flow.id}
                        onClick={() => setSelectedFlow(flow.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedFlow === flow.id
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: flow.color }}
                          ></div>
                          <h4 className="font-medium text-gray-900">{flow.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{flow.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Entity List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Components</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analysis.entities
                      .filter(entity => {
                        if (!selectedFlow) return true;
                        const flow = analysis.flows.find(f => f.id === selectedFlow);
                        return flow?.steps.includes(entity.id) || flow?.steps.includes(entity.name);
                      })
                      .map((entity) => (
                        <div
                          key={entity.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getEntityTypeIcon(entity.entityType)}</span>
                              <div>
                                <h4 className="font-semibold text-gray-900">{entity.name}</h4>
                                <p className="text-sm text-gray-500">{entity.filePath}</p>
                              </div>
                            </div>
                            {entity.complexity && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entity.complexity > 7 ? 'bg-red-100 text-red-800' :
                                entity.complexity > 4 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                Complexity: {entity.complexity}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{entity.metadata.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entity.metadata.tags.map((tag) => (
                              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {entity.metadata.httpMethod && (
                            <div className="text-xs text-gray-500 space-x-4">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {entity.metadata.httpMethod}
                              </span>
                              <span className="font-mono">{entity.metadata.route}</span>
                              {entity.metadata.requiresAuth && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  🔒 Auth Required
                                </span>
                              )}
                              {entity.metadata.requiresRole && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  Role: {entity.metadata.requiresRole}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to analyze your own code?
              </h3>
              <p className="text-blue-100 mb-6">
                Get instant insights into your repositories with the same powerful analysis you just experienced.
              </p>
              <div className="space-x-4">
                <Link href="/auth/signin" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Get Started Free
                </Link>
                <button
                  onClick={() => {
                    setSelectedSample(null);
                    setAnalysis(null);
                    setSelectedFlow(null);
                  }}
                  className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Try Another Demo
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}