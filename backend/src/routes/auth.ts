import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { GitHubService } from '../services/github.js';
import { SubscriptionService } from '../services/subscription.js';
import { encryptGitHubToken, decryptGitHubToken } from '../lib/encryption.js';

const router = express.Router();

// GitHub OAuth callback
router.post('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for GitHub access token
    const githubService = new GitHubService();
    const { accessToken, user: githubUser } = await githubService.exchangeCodeForToken(code);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { githubId: githubUser.id }
    });

    if (!user) {
      // Create new user with trial subscription
      user = await prisma.user.create({
        data: {
          githubId: githubUser.id,
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
          accessToken: encryptGitHubToken(accessToken),
          subscriptionStatus: 'trial',
          subscriptionTier: 'trial',
          trialStartedAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        }
      });

      // Initialize usage tracking
      await SubscriptionService.initializeUsageTracking(user.id);
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
          accessToken: encryptGitHubToken(accessToken),
          lastLoginAt: new Date()
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (without sensitive info)
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt
      }
    });

  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth-token');
  res.json({ message: 'Logged out successfully' });
});

export default router;