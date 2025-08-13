// Subscription tier limits and features

export interface SubscriptionLimits {
  repositories: number;
  analyses_per_month: number;
  team_members: number;
  shared_repositories: number;
  export_formats: string[];
  features: string[];
  support_level: 'community' | 'email' | 'priority';
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    repositories: 3,
    analyses_per_month: 10,
    team_members: 0,
    shared_repositories: 0,
    export_formats: ['png'],
    features: [
      'basic_visualization',
      'subway_layout',
    ],
    support_level: 'community'
  },
  
  individual: {
    repositories: 25,
    analyses_per_month: 500,
    team_members: 0,
    shared_repositories: 0,
    export_formats: ['png', 'svg', 'pdf'],
    features: [
      'basic_visualization',
      'subway_layout',
      'advanced_themes',
      'priority_processing',
      'unlimited_exports'
    ],
    support_level: 'email'
  },
  
  team: {
    repositories: 100,
    analyses_per_month: 2000,
    team_members: 10,
    shared_repositories: 50,
    export_formats: ['png', 'svg', 'pdf', 'interactive_html'],
    features: [
      'basic_visualization',
      'subway_layout', 
      'advanced_themes',
      'priority_processing',
      'unlimited_exports',
      'team_collaboration',
      'shared_workspaces',
      'commenting_system',
      'team_analytics',
      'role_based_permissions'
    ],
    support_level: 'priority'
  },
  
  enterprise: {
    repositories: -1, // unlimited
    analyses_per_month: -1, // unlimited
    team_members: -1, // unlimited
    shared_repositories: -1, // unlimited
    export_formats: ['png', 'svg', 'pdf', 'interactive_html', 'json_data'],
    features: [
      'basic_visualization',
      'subway_layout',
      'advanced_themes',
      'priority_processing', 
      'unlimited_exports',
      'team_collaboration',
      'shared_workspaces',
      'commenting_system',
      'team_analytics',
      'role_based_permissions',
      'custom_branding',
      'api_access',
      'sso_integration',
      'audit_logs',
      'dedicated_support'
    ],
    support_level: 'priority'
  }
};

// Helper functions
export const hasFeature = (plan: string, feature: string): boolean => {
  return SUBSCRIPTION_LIMITS[plan]?.features.includes(feature) ?? false;
};

export const getLimit = (plan: string, limitType: keyof SubscriptionLimits): number | string[] | string => {
  return SUBSCRIPTION_LIMITS[plan]?.[limitType] ?? 0;
};

export const canInviteTeamMembers = (plan: string): boolean => {
  return hasFeature(plan, 'team_collaboration');
};

export const getMaxTeamMembers = (plan: string): number => {
  const limit = getLimit(plan, 'team_members') as number;
  return limit === -1 ? Infinity : limit;
};

export const canCommentOnVisualization = (plan: string): boolean => {
  return hasFeature(plan, 'commenting_system');
};

export const canShareRepository = (plan: string): boolean => {
  return hasFeature(plan, 'shared_workspaces');
};