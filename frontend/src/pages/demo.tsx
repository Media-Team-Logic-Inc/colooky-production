import { useState } from 'react';
import Link from 'next/link';
import FlexibleSubwayMap from '../components/FlexibleSubwayMap';
import { demoScenarios, getScenarioById } from '../data/demoScenarios';
import { File } from 'lucide-react';

// Mock code content for demo nodes
const mockCodeContent = {
  'signup-btn': {
    language: 'JavaScript',
    content: `import React, { useState } from 'react';
import { Button } from './ui/Button';
import SignupModal from './SignupModal';

export default function SignupButton() {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    // Track signup button click
    analytics.track('signup_button_clicked');
    setShowModal(true);
  };

  return (
    <>
      <Button 
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Sign Up Now
      </Button>
      {showModal && (
        <SignupModal 
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}`
  },
  'form-modal': {
    language: 'JavaScript', 
    content: `import React, { useState } from 'react';
import { validateEmail, validatePassword } from '../utils/validation';

export default function SignupModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-content">
        <h2>Create Account</h2>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required 
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}`
  },
  'api-call': {
    language: 'JavaScript',
    content: `// pages/api/auth/signup.js
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { validateSignupData } from '../../utils/validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Validate input data
    const validation = validateSignupData({ email, password });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Return success response
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}`
  }
};

export default function DemoPage() {
  const [currentScenario, setCurrentScenario] = useState('signup');
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Interactive Code Flow Visualization
              </h2>
              <p className="text-slate-400 max-w-3xl">
                See how Colooky transforms complex code flows into beautiful subway map visualizations. 
                Click through different scenarios to understand how code components interact in real applications.
              </p>
            </div>
            <button
              onClick={() => setShowCodeViewer(!showCodeViewer)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showCodeViewer ? 'Hide Code' : 'Show Code'}
            </button>
          </div>
          <p className="text-sm text-blue-400">
            💡 {showCodeViewer ? 'Click on any node to see the actual code!' : 'Enable code viewer and click nodes to see real code examples'}
          </p>
        </div>

        {/* Interactive Subway Map with Code Viewer */}
        <div className={`mb-8 grid gap-6 ${showCodeViewer ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="min-w-0">
            <FlexibleSubwayMap 
              scenario={getScenarioById(currentScenario) || demoScenarios[0]}
              onScenarioChange={setCurrentScenario}
              availableScenarios={demoScenarios}
              onNodeClick={(node) => {
                if (showCodeViewer && mockCodeContent[node.id]) {
                  setSelectedCode({
                    id: node.id,
                    title: node.title,
                    ...mockCodeContent[node.id]
                  });
                }
              }}
            />
          </div>
          
          {showCodeViewer && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium text-sm">
                      {selectedCode ? selectedCode.title : 'Select a node to view code'}
                    </span>
                  </div>
                  {selectedCode && (
                    <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                      {selectedCode.language}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="h-[500px] overflow-auto">
                {selectedCode ? (
                  <div className="text-sm">
                    {selectedCode.content.split('\n').map((line, index) => (
                      <div key={index} className="flex">
                        <span className="text-slate-500 text-right pr-4 py-1 w-12 flex-shrink-0 select-none border-r border-slate-700">
                          {index + 1}
                        </span>
                        <pre className="text-slate-300 pl-4 py-1 flex-1 whitespace-pre-wrap">
                          <code>{line || ' '}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <File className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                      <p>Click a node in the visualization to view its code</p>
                      <p className="text-xs mt-2">Experience the "aha" moment of seeing code and visualization together!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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