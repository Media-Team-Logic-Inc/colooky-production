import { createClient } from '@supabase/supabase-js';

// Validate environment variables with fallbacks for development
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not configured. Database features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(
  supabaseUrl,
  supabaseAnonKey
) : null;

// Service role client for server-side operations
export const supabaseAdmin = supabaseUrl && (process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey) ? createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
) : null;

// Database schema types
export interface UserProfile {
  id: string;
  github_id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  github_access_token?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'dark' | 'light' | 'auto';
  notifications_enabled: boolean;
  email_notifications: {
    analysis_complete: boolean;
    weekly_summary: boolean;
    product_updates: boolean;
    marketing: boolean;
  };
  push_notifications: {
    analysis_complete: boolean;
    team_invites: boolean;
    comments: boolean;
  };
  privacy_settings: {
    make_profile_public: boolean;
    show_activity: boolean;
    allow_indexing: boolean;
  };
  visual_preferences: {
    animations: boolean;
    high_contrast: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface AnalysisHistory {
  id: string;
  user_id: string;
  repository_owner: string;
  repository_name: string;
  repository_full_name: string;
  files_analyzed: string[];
  analysis_type: string;
  scenario_data: any;
  created_at: string;
}

// Helper functions
export const getUserProfile = async (githubId: string): Promise<UserProfile | null> => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot fetch user profile');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('github_id', githubId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const createUserProfile = async (userData: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot create user profile');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot update user profile');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot fetch user settings');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
};

export const createUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  const defaultSettings = {
    user_id: userId,
    theme: 'dark' as const,
    notifications_enabled: true,
    email_notifications: {
      analysis_complete: true,
      weekly_summary: true,
      product_updates: false,
      marketing: false,
    },
    push_notifications: {
      analysis_complete: true,
      team_invites: true,
      comments: true,
    },
    privacy_settings: {
      make_profile_public: false,
      show_activity: true,
      allow_indexing: false,
    },
    visual_preferences: {
      animations: true,
      high_contrast: false,
    },
    ...settings
  };

  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot create user settings');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .insert([defaultSettings])
    .select()
    .single();

  if (error) {
    console.error('Error creating user settings:', error);
    return null;
  }

  return data;
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not configured, cannot update user settings');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user settings:', error);
    return null;
  }

  return data;
};

export const saveAnalysisHistory = async (analysisData: Partial<AnalysisHistory>): Promise<AnalysisHistory | null> => {
  if (!supabase) {
    console.warn('Supabase client not configured, cannot save analysis history');
    return null;
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .insert([analysisData])
    .select()
    .single();

  if (error) {
    console.error('Error saving analysis history:', error);
    return null;
  }

  return data;
};

export const getUserAnalysisHistory = async (userId: string, limit = 10): Promise<AnalysisHistory[]> => {
  if (!supabase) {
    console.warn('Supabase client not configured, cannot fetch analysis history');
    return [];
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching analysis history:', error);
    return [];
  }

  return data || [];
};

export const deleteAnalysisHistory = async (analysisId: string): Promise<boolean> => {
  if (!supabase) {
    console.warn('Supabase client not configured, cannot delete analysis history');
    return false;
  }

  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', analysisId);

  if (error) {
    console.error('Error deleting analysis history:', error);
    return false;
  }

  return true;
};