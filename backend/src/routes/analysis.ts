import express from 'express';
import { CodeAnalysisService } from '../services/codeAnalysis.js';
import { UsageService } from '../services/usage.js';
import { requireSubscription } from '../middleware/subscription.js';

const router = express.Router();

// Start repository analysis
router.post('/repositories/:id', requireSubscription(['trial', 'individual', 'team', 'enterprise']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const repositoryId = req.params.id;
    const { branch = 'main', forceRefresh = false } = req.body;

    // Check analysis usage limit
    const usageCheck = await UsageService.checkUsageLimit(userId, 'analyses');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        error: 'Monthly analysis limit reached',
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        upgradeUrl: '/pricing'
      });
    }

    // Start analysis
    const analysis = await CodeAnalysisService.startAnalysis(repositoryId, branch, userId, forceRefresh);
    
    // Track usage
    await UsageService.trackUsage(userId, 'analyses', 1);

    res.status(202).json({
      analysisId: analysis.id,
      status: 'started',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('Repository analysis error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Get analysis result
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user.id;

    const analysis = await CodeAnalysisService.getAnalysisResult(analysisId, userId);
    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

export default router;