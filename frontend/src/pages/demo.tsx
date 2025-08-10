import { useState } from 'react';
import Link from 'next/link';
import FlexibleSubwayMap from '../components/FlexibleSubwayMap';
import { demoScenarios, getScenarioById } from '../data/demoScenarios';

export default function DemoPage() {
  const [currentScenario, setCurrentScenario] = useState('signup');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                ← Back to Home
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Interactive Demo</h1>
                <p className="text-slate-400">Explore how Colooky analyzes and visualizes code flows</p>
              </div>
            </div>
            <Link 
              href="/auth/signin" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try with Your Code
            </Link>
          </div>
        </div>
      </div>

      {/* Main Demo Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Interactive Code Flow Visualization
          </h2>
          <p className="text-slate-400 max-w-3xl mx-auto">
            See how Colooky transforms complex code flows into beautiful subway map visualizations. 
            Click through different scenarios to understand how code components interact in real applications.
          </p>
        </div>

        {/* Interactive Subway Map */}
        <div className="mb-8">
          <FlexibleSubwayMap 
            scenario={getScenarioById(currentScenario) || demoScenarios[0]}
            onScenarioChange={setCurrentScenario}
            availableScenarios={demoScenarios}
          />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to analyze your own code?
          </h3>
          <p className="text-blue-100 mb-6">
            Connect your GitHub repositories and get instant insights with the same powerful visualization you just experienced.
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/signin" 
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              href="/" 
              className="inline-block bg-transparent border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}