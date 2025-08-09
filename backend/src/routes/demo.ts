import express from 'express';
import { demoSamples } from '../data/demoSamples.js';

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
    
    // Check if demoSamples loaded properly
    console.log('🔧 Demo samples available:', Object.keys(demoSamples));
    
    const samples = Object.values(demoSamples).map(sample => ({
      id: sample.id,
      name: sample.name,
      description: sample.description,
      tags: sample.tags,
      complexity: sample.complexity,
      stats: {
        fileCount: sample.analysisData.fileCount,
        functionCount: sample.analysisData.functionCount,
        classCount: sample.analysisData.classCount,
        linesOfCode: sample.analysisData.linesOfCode
      }
    }));

    console.log('🔧 Returning samples:', samples.length);
    res.json({
      success: true,
      samples
    });
  } catch (error) {
    console.error('❌ Error fetching demo samples:', error);
    console.error('❌ Error stack:', error.stack);
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
    const sample = demoSamples[sampleId as keyof typeof demoSamples];

    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Demo sample not found'
      });
    }

    // Return the complete analysis data for visualization
    res.json({
      success: true,
      analysis: {
        id: sample.id,
        repositoryName: sample.analysisData.repositoryName,
        metadata: {
          fileCount: sample.analysisData.fileCount,
          functionCount: sample.analysisData.functionCount,
          classCount: sample.analysisData.classCount,
          importCount: sample.analysisData.importCount,
          apiCallCount: sample.analysisData.apiCallCount,
          linesOfCode: sample.analysisData.linesOfCode
        },
        entities: sample.analysisData.entities,
        flows: sample.analysisData.flows,
        demo: true // Flag to indicate this is demo data
      }
    });
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
    const sample = demoSamples[sampleId as keyof typeof demoSamples];

    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Demo sample not found'
      });
    }

    const flow = sample.analysisData.flows?.find(f => f.id === flowId);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Demo flow not found'
      });
    }

    // Get entities involved in this flow
    const flowEntities = sample.analysisData.entities.filter(entity => 
      flow.steps.includes(entity.id) || flow.steps.includes(entity.name)
    );

    res.json({
      success: true,
      flow: {
        ...flow,
        entities: flowEntities
      }
    });
  } catch (error) {
    console.error('Error fetching demo flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demo flow'
    });
  }
});

export default router;