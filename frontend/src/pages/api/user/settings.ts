import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getUserProfile, getUserSettings, updateUserSettings, createUserSettings } from '../../../lib/supabase';
import { authOptions } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.githubId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const githubId = session.user.githubId as string;

    if (req.method === 'GET') {
      // Debug: Check what we're looking for
      console.log('Looking for user profile with githubId:', githubId);
      
      // Get user settings
      const userProfile = await getUserProfile(githubId);
      if (!userProfile) {
        console.log('No user profile found for githubId:', githubId);
        return res.status(404).json({ 
          error: 'User profile not found',
          debug: {
            githubId: githubId,
            sessionUser: session.user
          }
        });
      }

      const settings = await getUserSettings(userProfile.id);
      return res.status(200).json(settings);

    } else if (req.method === 'POST') {
      // Save user settings
      const userProfile = await getUserProfile(githubId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const {
        theme,
        notifications,
        privacy,
        visualPrefs,
        profileData,
        user_preferences
      } = req.body;

      // Transform the frontend data structure to match our database schema
      const settingsData = {
        theme: theme || 'dark',
        notifications_enabled: user_preferences?.notifications_enabled ?? true,
        email_notifications: notifications?.email || {
          analysis_complete: true,
          weekly_summary: true,
          product_updates: false,
          marketing: false,
        },
        push_notifications: notifications?.push || {
          analysis_complete: true,
          team_invites: true,
          comments: true,
        },
        privacy_settings: privacy || {
          make_profile_public: false,
          show_activity: true,
          allow_indexing: false,
        },
        visual_preferences: visualPrefs || {
          animations: true,
          high_contrast: false,
        },
      };

      // Check if settings already exist
      const existingSettings = await getUserSettings(userProfile.id);
      
      let result;
      if (existingSettings) {
        // Update existing settings
        result = await updateUserSettings(userProfile.id, settingsData);
      } else {
        // Create new settings
        result = await createUserSettings(userProfile.id, settingsData);
      }

      if (!result) {
        return res.status(500).json({ error: 'Failed to save settings' });
      }

      // Also update profile data if provided
      if (profileData) {
        const { updateUserProfile } = await import('../../../lib/supabase');
        await updateUserProfile(userProfile.id, {
          name: profileData.displayName || userProfile.name,
          username: profileData.githubUsername || userProfile.username,
          bio: profileData.bio || userProfile.bio,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Settings saved successfully',
        settings: result
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}