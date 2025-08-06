import express from 'express';
import { prisma } from '../config/database';
import { GitHubService } from '../services/github';
import { UsageService } from '../services/usage';
import { requireSubscription } from '../middleware/subscription';
import { decryptGitHubToken } from '../lib/encryption';

const router = express.Router();

// Get user's repositories
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const repositories = await prisma.repository.findMany({
      where: {
        OR: [
          { userId },
          {
            organization: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { analysisResults: true }
        },
        analysisResults: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            commitSha: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ repositories });
  } catch (error) {
    console.error('Get repositories error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Sync repositories from GitHub
router.post('/sync', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Check repository limit
    const usageCheck = await UsageService.checkUsageLimit(userId, 'repositories');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        error: 'Repository limit reached',
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        upgradeUrl: '/pricing'
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub token not found' });
    }
    
    const decryptedToken = decryptGitHubToken(user.accessToken);
    const githubService = new GitHubService(decryptedToken);
    
    const githubRepos = await githubService.getUserRepositories();
    
    // Sync repositories to database
    const syncedRepos = [];
    for (const repo of githubRepos) {
      const existingRepo = await prisma.repository.findUnique({
        where: { githubId: repo.id }
      });

      if (!existingRepo) {
        // Check if we're within limits before creating
        const currentCount = await prisma.repository.count({
          where: { userId }
        });
        
        if (currentCount >= usageCheck.limit && usageCheck.limit !== -1) {
          break; // Stop syncing if we hit the limit
        }

        const newRepo = await prisma.repository.create({
          data: {
            githubId: repo.id,
            userId,
            name: repo.name,
            fullName: repo.full_name,
            defaultBranch: repo.default_branch || 'main',
            isPrivate: repo.private,
            description: repo.description,
            language: repo.language,
            htmlUrl: repo.html_url
          }
        });
        syncedRepos.push(newRepo);
      }
    }

    res.json({ 
      message: `Synced ${syncedRepos.length} repositories`,
      repositories: syncedRepos 
    });

  } catch (error) {
    console.error('Repository sync error:', error);
    res.status(500).json({ error: 'Failed to sync repositories' });
  }
});

export default router;