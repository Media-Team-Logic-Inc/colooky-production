-- Additional tables needed for team functionality

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- for URLs like /team/acme-corp
    description TEXT,
    avatar_url TEXT,
    subscription_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team memberships with roles
CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    invited_by UUID REFERENCES user_profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    accepted_by UUID REFERENCES user_profiles(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared repositories (team-level repository access)
CREATE TABLE IF NOT EXISTS team_repositories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    repository_owner TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    repository_full_name TEXT NOT NULL,
    added_by UUID REFERENCES user_profiles(id),
    permissions TEXT DEFAULT 'read' CHECK (permissions IN ('read', 'write', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, repository_full_name)
);

-- Update analysis_history to support team context
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Comments on visualizations
CREATE TABLE IF NOT EXISTS visualization_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- null for personal comments
    content TEXT NOT NULL,
    parent_id UUID REFERENCES visualization_comments(id), -- for replies
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_repositories_team_id ON team_repositories(team_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_team_id ON analysis_history(team_id);
CREATE INDEX IF NOT EXISTS idx_visualization_comments_analysis_id ON visualization_comments(analysis_id);