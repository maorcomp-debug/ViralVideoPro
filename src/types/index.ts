// --- Types ---
export type TrackId = 'actors' | 'musicians' | 'creators' | 'coach' | 'influencers';

export interface ExpertAnalysis {
  role: string;
  insight: string;
  tips: string;
  score: number; // Individual expert score
}

export interface AnalysisResult {
  expertAnalysis: ExpertAnalysis[];
  hook: string; // The "Golden Insight"
  committee: {
    summary: string;
    finalTips: string[];
  };
}

// --- Coach Edition Types ---

export interface SavedAnalysis {
  id: string;
  videoName: string;
  videoUrl: string;
  traineeId?: string;
  traineeName?: string;
  analysisDate: Date;
  result: AnalysisResult;
  averageScore: number;
  track: TrackId;
  metadata?: {
    duration?: number;
    fileSize?: number;
    prompt?: string;
  };
}

export interface Trainee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  analyses: SavedAnalysis[];
}

export interface CoachComparison {
  id: string;
  name: string;
  analyses: SavedAnalysis[];
  comparisonDate: Date;
  insights?: string;
}

export interface CoachReport {
  id: string;
  traineeId?: string;
  traineeName?: string;
  reportDate: Date;
  analyses: SavedAnalysis[];
  summary: string;
  trends?: {
    improvement: boolean;
    areas: string[];
    recommendations: string[];
  };
}

// --- Subscription & Pricing Types ---
export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'coach';
export type BillingPeriod = 'monthly' | 'yearly';

export interface SubscriptionLimits {
  maxAnalysesPerPeriod: number; // -1 for unlimited
  maxVideoSeconds: number;
  maxFileBytes: number;
  features: {
    saveHistory: boolean;
    improvementTracking: boolean;
    comparison: boolean;
    advancedAnalysis: boolean;
    traineeManagement: boolean;
    pdfExport: boolean;
    coachDashboard: boolean;
    customExperts: boolean;
  };
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: SubscriptionLimits;
  popular?: boolean;
  badge?: string;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  startDate: Date;
  endDate: Date;
  usage: {
    analysesUsed: number;
    lastResetDate: Date;
  };
  isActive: boolean;
}

