-- Colooky Database Schema for Supabase
-- This file contains the SQL to set up the database tables and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    github_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    github_access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications JSONB DEFAULT '{"analysis_complete": true, "weekly_summary": true, "product_updates": false, "marketing": false}',
    push_notifications JSONB DEFAULT '{"analysis_complete": true, "team_invites": true, "comments": true}',
    privacy_settings JSONB DEFAULT '{"make_profile_public": false, "show_activity": true, "allow_indexing": false}',
    visual_preferences JSONB DEFAULT '{"animations": true, "high_contrast": false}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create analysis_history table
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    repository_owner TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    repository_full_name TEXT NOT NULL,
    files_analyzed TEXT[] DEFAULT '{}',
    analysis_type TEXT DEFAULT 'code_flow',
    scenario_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_plans table for Stripe integration
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'individual', 'team', 'enterprise')),
    billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'incomplete', 'past_due')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_github_id ON user_profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_user_id ON subscription_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_customer_id ON subscription_plans(stripe_customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (github_id = current_setting('app.current_user_github_id', true));

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (github_id = current_setting('app.current_user_github_id', true));

-- User settings: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

-- Analysis history: Users can only access their own analysis history
CREATE POLICY "Users can view own analysis history" ON analysis_history
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

CREATE POLICY "Users can insert own analysis history" ON analysis_history
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

-- Subscription plans: Users can only access their own subscription
CREATE POLICY "Users can view own subscription" ON subscription_plans
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

CREATE POLICY "Users can update own subscription" ON subscription_plans
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

CREATE POLICY "Users can insert own subscription" ON subscription_plans
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE github_id = current_setting('app.current_user_github_id', true)
        )
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default user settings when a new user profile is created
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic user settings creation
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON analysis_history TO authenticated;
GRANT ALL ON subscription_plans TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information from GitHub OAuth';
COMMENT ON TABLE user_settings IS 'Stores user preferences and settings';
COMMENT ON TABLE analysis_history IS 'Stores history of code analysis sessions';
COMMENT ON TABLE subscription_plans IS 'Stores Stripe subscription information';

COMMENT ON COLUMN user_profiles.github_id IS 'GitHub user ID from OAuth';
COMMENT ON COLUMN user_profiles.github_access_token IS 'GitHub access token for API calls (encrypted)';
COMMENT ON COLUMN user_settings.email_notifications IS 'JSON object for email notification preferences';
COMMENT ON COLUMN user_settings.push_notifications IS 'JSON object for push notification preferences';
COMMENT ON COLUMN user_settings.privacy_settings IS 'JSON object for privacy settings';
COMMENT ON COLUMN user_settings.visual_preferences IS 'JSON object for visualization preferences';
COMMENT ON COLUMN analysis_history.scenario_data IS 'JSON object containing the visualization scenario data';
COMMENT ON COLUMN subscription_plans.plan_type IS 'Subscription tier: free, individual, team, enterprise';