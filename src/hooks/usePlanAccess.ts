/**
 * Plan Access Logic - Pure Functions Only
 * 
 * This file contains pure functions for plan resolution and access checks.
 * Based on the clean application's usePlanAccess.ts logic.
 * 
 * Key principles:
 * - All functions are pure (no side effects)
 * - No state management
 * - No localStorage or fallbacks
 * - Synchronous calculations only
 * - Prevents race conditions
 */

import type { UserSubscription, SubscriptionTier, SubscriptionLimits, TrackId } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';

/**
 * Feature keys that match the current application structure
 */
export type FeatureKey = keyof SubscriptionLimits['features'];

/**
 * Plan Access Interface
 * Pure functions for checking plan capabilities
 */
export interface PlanAccess {
  readonly planLabel: string;
  readonly maxExperts: number;
  readonly maxTracks: number;
  readonly maxVideoSeconds: number;
  readonly maxVideoMB: number;
  readonly maxAnalysesPerPeriod: number; // -1 = unlimited
  readonly maxVideoMinutesPerPeriod: number;
  readonly maxTrainees?: number;
  
  hasFeature(feature: FeatureKey): boolean;
  canUploadVideo(videoSeconds: number, videoMB: number): boolean;
  canRunAnalysis(analysesUsed: number): boolean;
  hasMinutesLeft(minutesUsed: number): boolean;
  canAddStudent(currentCount: number): boolean;
  canSelectExpert(currentCount: number): boolean;
  canSelectTrack(currentTracksCount: number): boolean;
}

/**
 * Get plan access based on subscription
 * 
 * @param subscription - Subscription from DB only (no localStorage or fallback)
 * @returns PlanAccess | null - null if no active subscription
 * 
 * Behavior:
 * - Returns null if no subscription or not active
 * - Returns null if tier doesn't exist in SUBSCRIPTION_PLANS
 * - All functions are pure - no side effects
 * - No race conditions - all calculations are synchronous and pure
 */
export function getPlanAccess(subscription: UserSubscription | null): PlanAccess | null {
  // No fallback - if no subscription, return null
  if (!subscription || !subscription.isActive) {
    return null;
  }

  // Validation - verify tier exists in config
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  if (!plan) {
    // Production safety - if tier is invalid, return null
    console.error(`Invalid subscription tier: ${subscription.tier}`);
    return null;
  }

  // Create object with pure functions - no side effects
  // All functions use values from the subscription passed in
  // No access to external state or localStorage
  const baseMaxTracks = getMaxTracksForTier(subscription.tier);
  const bonusTracks = subscription.bonusTracks ?? 0;
  const maxTracks = baseMaxTracks + bonusTracks;

  return {
    planLabel: plan.name,
    maxExperts: plan.limits.maxExperts || 3,
    maxTracks,
    maxVideoSeconds: plan.limits.maxVideoSeconds,
    maxVideoMB: plan.limits.maxFileBytes / (1024 * 1024), // Convert bytes to MB
    maxAnalysesPerPeriod: plan.limits.maxAnalysesPerPeriod,
    maxVideoMinutesPerPeriod: plan.limits.maxVideoMinutesPerPeriod,
    maxTrainees: plan.limits.maxTrainees,

    hasFeature(feature: FeatureKey): boolean {
      return Boolean(plan.limits.features[feature]);
    },

    canUploadVideo(videoSeconds: number, videoMB: number): boolean {
      // Validation - verify values are valid
      if (videoSeconds < 0 || videoMB < 0) {
        return false;
      }
      const maxMB = plan.limits.maxFileBytes / (1024 * 1024);
      return (
        videoSeconds <= plan.limits.maxVideoSeconds &&
        videoMB <= maxMB
      );
    },

    canRunAnalysis(analysesUsed: number): boolean {
      // -1 = unlimited
      if (plan.limits.maxAnalysesPerPeriod === -1) {
        return true;
      }
      // Validation - verify value is valid
      if (analysesUsed < 0) {
        return false;
      }
      const bonusAnalyses = subscription.bonusAnalysesRemaining ?? 0;
      const effectiveLimit = plan.limits.maxAnalysesPerPeriod + bonusAnalyses;
      return analysesUsed < effectiveLimit;
    },

    hasMinutesLeft(minutesUsed: number): boolean {
      // -1 = unlimited
      if (plan.limits.maxVideoMinutesPerPeriod === -1) {
        return true;
      }
      // Validation - verify value is valid
      if (minutesUsed < 0) {
        return false;
      }
      return minutesUsed < plan.limits.maxVideoMinutesPerPeriod;
    },

    canAddStudent(currentCount: number): boolean {
      // Only coach tiers have maxTrainees
      if (!plan.limits.maxTrainees) {
        return false;
      }
      // Validation - verify value is valid
      if (currentCount < 0) {
        return false;
      }
      return currentCount < plan.limits.maxTrainees;
    },

    canSelectExpert(currentCount: number): boolean {
      const maxExperts = plan.limits.maxExperts || 3;
      // Validation - verify value is valid
      if (currentCount < 0) {
        return false;
      }
      return currentCount < maxExperts;
    },

    canSelectTrack(currentTracksCount: number): boolean {
      // Validation - verify value is valid
      if (currentTracksCount < 0) {
        return false;
      }
      return currentTracksCount < maxTracks;
    },
  };
}

/**
 * Get maximum tracks for a tier
 * Pure function - no side effects
 */
function getMaxTracksForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 1; // Only one track
    case 'creator':
      return 1; // Only one track (but can be selected from available)
    case 'pro':
      return 4; // All tracks
    case 'coach':
    case 'coach-pro':
      return 4; // All tracks
    default:
      return 1;
  }
}

/**
 * Check if track is available for user based on tier and profile
 * Pure function - no side effects
 */
export function isTrackAvailableForTier(
  trackId: TrackId,
  tier: SubscriptionTier,
  selectedTracks: TrackId[] | null,
  selectedPrimaryTrack: TrackId | null
): boolean {
  // Coach track requires coach tier
  if (trackId === 'coach') {
    return tier === 'coach' || tier === 'coach-pro';
  }

  // Free tier: only selected_primary_track is available
  if (tier === 'free') {
    return trackId === selectedPrimaryTrack;
  }

  // Creator tier: up to 1 track from selected_tracks array
  if (tier === 'creator') {
    return selectedTracks?.includes(trackId) ?? false;
  }

  // Pro and Coach tiers: all tracks available
  return true;
}

/**
 * Get available tracks for tier
 * Pure function - no side effects
 */
export function getAvailableTracksForTier(
  tier: SubscriptionTier,
  selectedTracks: TrackId[] | null,
  selectedPrimaryTrack: TrackId | null
): TrackId[] {
  if (tier === 'free') {
    return selectedPrimaryTrack ? [selectedPrimaryTrack] : [];
  }

  if (tier === 'creator') {
    return selectedTracks || [];
  }

  // Pro and Coach tiers: all tracks available
  return ['actors', 'musicians', 'creators', 'influencers', 'coach'];
}

