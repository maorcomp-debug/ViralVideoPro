import type { TrackId } from '../../types';
import type { CreatorTypeKey } from './i18n/creatorTypeLabels';

/** Set false to hide the entire viral-share module without removing files. */
export const VIRAL_SHARE_ENABLED = true;

export const VIRAL_SHARE_Z_INDEX = 1100;

/** Display order in creator-type picker (keys only — labels from i18n). */
export const CREATOR_TYPE_OPTIONS: CreatorTypeKey[] = [
  'content_creator',
  'actor',
  'singer',
  'podcaster',
  'influencer',
  'comedian',
  'video_creator',
];

const TRACK_TO_CREATOR_TYPE: Record<TrackId, CreatorTypeKey> = {
  actors: 'actor',
  musicians: 'singer',
  creators: 'content_creator',
  influencers: 'influencer',
  coach: 'content_creator',
};

export function mapTrackToCreatorType(trackId: TrackId): CreatorTypeKey {
  return TRACK_TO_CREATOR_TYPE[trackId] ?? 'content_creator';
}

/** Share is available on every track except coach analysis for a selected trainee. */
export function isViralShareBlocked(
  trackId: TrackId,
  hasSelectedTrainee: boolean
): boolean {
  return trackId === 'coach' && hasSelectedTrainee;
}

export const SHARE_CTA_URL = 'https://viraly.co.il';
