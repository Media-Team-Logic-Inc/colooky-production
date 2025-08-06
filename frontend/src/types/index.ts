export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  subscriptionTier: 'trial' | 'individual' | 'team' | 'enterprise';
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired';
  trialEndsAt?: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  isPrivate: boolean;
  lastAnalyzed?: string;
  analysisCount: number;
}

export interface AnalysisResult {
  id: string;
  repositoryId: string;
  commitSha: string;
  branch: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  fileCount: number;
  functionCount: number;
  classCount: number;
  importCount: number;
  apiCallCount: number;
  visualizationData: VisualizationData;
  createdAt: string;
}

export interface VisualizationData {
  nodes: VisualizationNode[];
  connections: VisualizationConnection[];
  layout: 'subway' | 'tree' | 'force';
  theme: 'dark' | 'light';
}

export interface VisualizationNode {
  id: string;
  name: string;
  type: 'file' | 'function' | 'class' | 'import' | 'api_call' | 'response';
  position: { x: number; y: number };
  color: string;
  metadata?: {
    line?: number;
    parameters?: string[];
    complexity?: number;
  };
}

export interface VisualizationConnection {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'contains' | 'returns' | 'resolves';
  strength?: number;
}

export interface Usage {
  repositories: { current: number; limit: number };
  analyses: { current: number; limit: number };
  exports: { current: number; limit: number };
}

export interface PromoCode {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_trial';
  discountValue: number;
  validUntil?: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tier: string;
  status: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}