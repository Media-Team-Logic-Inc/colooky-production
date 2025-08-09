import express from 'express';
// Temporarily disable demo data import to isolate the issue
// import { demoSamples } from '../data/demoSamples.js';

const router = express.Router();

// Health check for demo routes
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Demo routes healthy' });
});

// Get all available demo samples
router.get('/samples', async (req, res) => {
  try {
    // Debug CORS request
    console.log('🔧 Demo samples request from origin:', req.headers.origin);
    console.log('🔧 Request headers:', req.headers);
    
    // Temporarily return mock data to test if the route works
    const samples = [{
      id: 'test-sample',
      name: 'Test E-commerce Auth',
      description: 'Mock authentication flow for testing',
      tags: ['test', 'auth'],
      complexity: 'beginner',
      stats: {
        fileCount: 5,
        functionCount: 10,
        classCount: 2,
        linesOfCode: 200
      }
    }];

    console.log('🔧 Returning mock samples:', samples.length);
    res.json({
      success: true,
      samples
    });
  } catch (error) {
    console.error('❌ Error fetching demo samples:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demo samples'
    });
  }
});

// Get specific demo analysis data
router.get('/analysis/:sampleId', async (req, res) => {
  try {
    const { sampleId } = req.params;
    
    // Return mock analysis data
    if (sampleId === 'test-sample') {
      res.json({
        success: true,
        analysis: {
          id: 'test-sample',
          repositoryName: 'test-auth-demo',
          metadata: {
            fileCount: 5,
            functionCount: 10,
            classCount: 2,
            importCount: 15,
            apiCallCount: 4,
            linesOfCode: 200
          },
          entities: [{
            id: 'login-endpoint',
            entityType: 'function',
            name: 'login',
            filePath: '/routes/auth.js',
            complexity: 3,
            metadata: {
              description: 'Main login endpoint',
              tags: ['auth', 'endpoint'],
              httpMethod: 'POST',
              route: '/api/auth/login',
              requiresAuth: false
            }
          }],
          flows: [{
            id: 'login-flow',
            name: 'User Login',
            description: 'Basic login flow',
            steps: ['login-endpoint'],
            color: '#3B82F6'
          }],
          demo: true
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Demo sample not found'
      });
    }
  } catch (error) {
    console.error('Error fetching demo analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demo analysis'
    });
  }
});

// Get demo flow visualization data
router.get('/flow/:sampleId/:flowId', async (req, res) => {
  try {
    const { sampleId, flowId } = req.params;

    if (sampleId === 'test-sample' && flowId === 'login-flow') {
      res.json({
        success: true,
        flow: {
          id: 'login-flow',
          name: 'User Login',
          description: 'Basic login flow',
          steps: ['login-endpoint'],
          color: '#3B82F6',
          entities: [{
            id: 'login-endpoint',
            entityType: 'function',
            name: 'login',
            filePath: '/routes/auth.js',
            complexity: 3,
            metadata: {
              description: 'Main login endpoint',
              tags: ['auth', 'endpoint'],
              httpMethod: 'POST',
              route: '/api/auth/login',
              requiresAuth: false
            }
          }]
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Demo flow not found'
      });
    }
  } catch (error) {
    console.error('Error fetching demo flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demo flow'
    });
  }
});

export default router;