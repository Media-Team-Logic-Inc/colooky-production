-- Working RLS Policies for NextAuth + Supabase
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies completely
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('user_profiles', 'user_settings', 'subscription_plans', 'analysis_history'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END
$$;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies that work with NextAuth (service_role only for now)
-- This allows your API routes to work since they use service_role access

-- USER PROFILES
CREATE POLICY "Service role full access to user_profiles" ON user_profiles
    FOR ALL TO service_role USING (true);

-- USER SETTINGS  
CREATE POLICY "Service role full access to user_settings" ON user_settings
    FOR ALL TO service_role USING (true);

-- SUBSCRIPTION PLANS
CREATE POLICY "Service role full access to subscription_plans" ON subscription_plans
    FOR ALL TO service_role USING (true);

-- ANALYSIS HISTORY
CREATE POLICY "Service role full access to analysis_history" ON analysis_history
    FOR ALL TO service_role USING (true);

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Test query to verify service role access works
-- SELECT 'Service role can access user_profiles' as test, COUNT(*) as user_count FROM user_profiles;