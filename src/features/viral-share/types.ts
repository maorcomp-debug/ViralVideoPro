import type { AnalysisResult, TrackId } from '../../types';
import type { CreatorTypeKey } from './i18n/creatorTypeLabels';

export type { CreatorTypeKey };

export type ViralShareStep = 'consent' | 'identity' | 'preview' | 'share';

export interface SharePreviewData {
  viralScore: number;
  metrics: [string, string, string];
  insight: string;
  creatorType: CreatorTypeKey;
}

export interface ViralShareEntryProps {
  score: number;
  trackId: TrackId;
  result: AnalysisResult;
  suggestedCreatorName?: string;
  blocked?: boolean;
  /** inline = centered in ActionButtons row; standalone = full-width below score */
  layout?: 'inline' | 'standalone';
}
