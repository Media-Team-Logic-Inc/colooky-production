-- Proper RLS Policies for Production Security
-- Run this in Supabase SQL Editor

-- First, re-enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow service role full access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow service role full access to user_settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscription_plans;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscription_plans;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view own analysis history" ON analysis_history;
DROP POLICY IF EXISTS "Users can insert own analysis history" ON analysis_history;

-- Create working RLS policies using auth.uid() instead of custom settings

-- USER PROFILES: Allow service role full access, users can view/update their own
CREATE POLICY "Service role full access to user_profiles" ON user_profiles
    FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow user creation" ON user_profiles
    FOR INSERT TO service_role WITH CHECK (true);

-- USER SETTINGS: Allow service role full access, users can manage their own
CREATE POLICY "Service role full access to user_settings" ON user_settings
    FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT TO authenticated USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE email = (SELECT auth.email())
        )
    );

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE TO authenticated USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE email = (SELECT auth.email())
        )
    );

CREATE POLICY "Allow settings creation" ON user_settings
    FOR INSERT TO service_role WITH CHECK (true);

-- SUBSCRIPTION PLANS: Allow service role full access, users can view their own
CREATE POLICY "Service role full access to subscription_plans" ON subscription_plans
    FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view their own subscription" ON subscription_plans
    FOR SELECT TO authenticated USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE email = (SELECT auth.email())
        )
    );

CREATE POLICY "Allow subscription creation" ON subscription_plans
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow subscription updates" ON subscription_plans
    FOR UPDATE TO service_role USING (true);

-- ANALYSIS HISTORY: Allow service role full access, users can view/create their own
CREATE POLICY "Service role full access to analysis_history" ON analysis_history
    FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view their own analysis" ON analysis_history
    FOR SELECT TO authenticated USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE email = (SELECT auth.email())
        )
    );

CREATE POLICY "Allow analysis creation" ON analysis_history
    FOR INSERT TO service_role WITH CHECK (true);

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT, INSERT ON analysis_history TO authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Add helpful comments
COMMENT ON POLICY "Service role full access to user_profiles" ON user_profiles IS 'Allows API routes to manage user profiles';
COMMENT ON POLICY "Users can view their own settings" ON user_settings IS 'Users can only see their own settings via email match';
COMMENT ON POLICY "Service role full access to subscription_plans" ON subscription_plans IS 'Allows Stripe webhooks to update subscriptions';

-- Test the policies work by running this query (should return your user if logged in):
-- SELECT * FROM user_profiles WHERE email = (SELECT auth.email()) LIMIT 1;