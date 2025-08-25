-- GitHub Marketplace Subscriptions Table
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS github_marketplace_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    github_user_id BIGINT UNIQUE NOT NULL,
    github_username TEXT NOT NULL,
    github_email TEXT,
    plan_id BIGINT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_description TEXT,
    monthly_price_in_cents INTEGER,
    yearly_price_in_cents INTEGER,
    unit_count INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended')),
    marketplace_purchase_id BIGINT UNIQUE NOT NULL,
    pending_change JSONB,
    effective_date TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_github_marketplace_github_user_id ON github_marketplace_subscriptions(github_user_id);
CREATE INDEX IF NOT EXISTS idx_github_marketplace_status ON github_marketplace_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_github_marketplace_plan_id ON github_marketplace_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_github_marketplace_purchase_id ON github_marketplace_subscriptions(marketplace_purchase_id);

-- Enable Row Level Security
ALTER TABLE github_marketplace_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own marketplace subscriptions" 
ON github_marketplace_subscriptions FOR SELECT 
USING (auth.uid()::text = (SELECT user_id FROM profiles WHERE github_id = github_user_id::text));

CREATE POLICY "Service can manage all marketplace subscriptions" 
ON github_marketplace_subscriptions FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_marketplace_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_github_marketplace_subscriptions_updated_at
    BEFORE UPDATE ON github_marketplace_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_github_marketplace_subscriptions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE github_marketplace_subscriptions IS 'Stores GitHub Marketplace subscription information for users';
COMMENT ON COLUMN github_marketplace_subscriptions.github_user_id IS 'GitHub user ID from the marketplace webhook';
COMMENT ON COLUMN github_marketplace_subscriptions.marketplace_purchase_id IS 'Unique marketplace purchase ID from GitHub';
COMMENT ON COLUMN github_marketplace_subscriptions.pending_change IS 'JSON object containing pending plan changes';
COMMENT ON COLUMN github_marketplace_subscriptions.status IS 'Current subscription status: active, cancelled, or suspended';