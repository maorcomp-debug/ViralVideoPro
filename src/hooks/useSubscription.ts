import { useState, useEffect, useCallback } from 'react';
import type { UserSubscription, SubscriptionTier, BillingPeriod, SubscriptionLimits, TrackId } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';
import { getUsageForCurrentPeriod } from '../lib/supabase-helpers';

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  usage: { analysesUsed: number; periodStart: Date; periodEnd: Date } | null;
  showSubscriptionModal: boolean;
  hasPremiumAccess: boolean;
  setSubscription: React.Dispatch<React.SetStateAction<UserSubscription | null>>;
  setUsage: (usage: { analysesUsed: number; periodStart: Date; periodEnd: Date } | null) => void;
  setShowSubscriptionModal: (show: boolean) => void;
  checkSubscriptionLimits: () => Promise<{ allowed: boolean; message?: string }>;
  incrementUsage: () => Promise<void>;
  canUseFeature: (feature: keyof SubscriptionLimits['features']) => boolean;
  isTrackAvailable: (trackId: TrackId, user: any, profile: any) => boolean;
  shouldShowTrackRestrictions: (trackId: TrackId, user: any) => boolean;
  getAvailableTracks: (profile: any) => TrackId[];
  getMaxExperts: () => number;
}

export const useSubscription = (
  user: any,
  profile: any
): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<{ analysesUsed: number; periodStart: Date; periodEnd: Date } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Calculate premium access based on subscription
  const hasPremiumAccess = subscription ? subscription.tier !== 'free' : false;

  // Reset usage counters monthly/yearly
  useEffect(() => {
    if (!subscription) return;
    
    const now = new Date();
    const lastReset = new Date(subscription.usage.lastResetDate);
    const periodDays = subscription.billingPeriod === 'monthly' ? 30 : 365;
    
    if (now.getTime() - lastReset.getTime() > periodDays * 24 * 60 * 60 * 1000) {
      setSubscription(prev => prev ? {
        ...prev,
        usage: {
          analysesUsed: 0,
          lastResetDate: now,
        },
      } : null);
    }
  }, [subscription]);

  const checkSubscriptionLimits = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!subscription) {
      return { allowed: false, message: 'יש לבחור חבילה תחילה' };
    }

    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    
    // For free tier, always allow (we only check usage limits)
    // For paid tiers, check if subscription is active
    if (subscription.tier !== 'free') {
      if (!subscription.isActive || new Date() > subscription.endDate) {
        return { allowed: false, message: 'המנוי פג תוקף. יש לחדש את המנוי' };
      }
    }

    // Get current usage from database (always fresh)
    const currentUsage = await getUsageForCurrentPeriod();
    if (!currentUsage) {
      return { allowed: false, message: 'שגיאה בטעינת נתוני שימוש' };
    }

    const analysesUsed = currentUsage.analysesUsed;
    const limit = plan.limits.maxAnalysesPerPeriod;

    // Check analysis limit based on tier
    if (subscription.tier === 'free') {
      // Free tier: 2 analyses per month (resets monthly)
      if (analysesUsed >= limit) {
        const now = new Date();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          allowed: false, 
          message: `סיימת את 2 הניתוחים החינמיים לחודש זה. הניתוחים יתאפסו בעוד ${daysLeft} ימים (תחילת חודש) או שדרג לחבילה כדי להמשיך` 
        };
      }
    } else if (limit === -1) {
      // Unlimited (coach tier)
      return { allowed: true };
    } else {
      // Paid tiers: check within subscription period
      if (analysesUsed >= limit) {
        return { 
          allowed: false, 
          message: `סיימת את הניתוחים בתקופת המנוי. יתאפס בתקופת החיוב הבאה או שדרג לחבילה גבוהה יותר` 
        };
      }
    }

    return { allowed: true };
  }, [subscription]);

  const incrementUsage = useCallback(async () => {
    // Usage is automatically tracked via analyses table
    // Just update local state for immediate UI feedback
    setSubscription(prev => prev ? {
      ...prev,
      usage: {
        ...prev.usage,
        analysesUsed: (prev.usage.analysesUsed || 0) + 1,
      },
    } : null);
    
    // Reload usage data from Supabase
    if (user) {
      const usageData = await getUsageForCurrentPeriod();
      if (usageData) {
        setUsage(usageData);
      }
    }
  }, [user]);

  const canUseFeature = useCallback((feature: keyof SubscriptionLimits['features']): boolean => {
    // Admin email gets all features
    if (user?.email === 'viralypro@gmail.com') return true;
    if (!subscription) return false;
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    return plan.limits.features[feature];
  }, [user, subscription]);

  const isTrackAvailable = useCallback((trackId: TrackId, user: any, profile: any): boolean => {
    // If no user logged in, allow viewing but not using
    if (!user) return false;
    
    // Admin email gets all tracks
    if (user.email === 'viralypro@gmail.com') return true;
    
    // If profile or subscription haven't loaded yet, don't block tracks (wait for data to load)
    if (!profile || !subscription) {
      return true; // Don't show restrictions until data is loaded
    }

    // Coach track always requires traineeManagement feature
    if (trackId === 'coach') {
      return canUseFeature('traineeManagement');
    }

    const tier = subscription.tier;

    // Free tier: only selected_primary_track is available
    if (tier === 'free') {
      return trackId === profile.selected_primary_track;
    }

    // Creator tier: up to 2 tracks from selected_tracks array
    if (tier === 'creator') {
      const selectedTracks = profile.selected_tracks || [];
      return selectedTracks.includes(trackId);
    }

    // Pro and Coach tiers: all tracks available (except coach requires feature)
    return true;
  }, [subscription, canUseFeature]);

  const shouldShowTrackRestrictions = useCallback((trackId: TrackId, user: any): boolean => {
    // Don't show restrictions if user is not logged in
    if (!user) return false;
    
    // Admin email has no restrictions
    if (user.email === 'viralypro@gmail.com') return false;
    
    return !isTrackAvailable(trackId, user, profile);
  }, [profile, isTrackAvailable]);

  const getAvailableTracks = useCallback((profile: any): TrackId[] => {
    if (!profile || !subscription) return [];
    
    const tier = subscription.tier;
    
    if (tier === 'free') {
      return profile.selected_primary_track ? [profile.selected_primary_track as TrackId] : [];
    }
    
    if (tier === 'creator') {
      return (profile.selected_tracks || []) as TrackId[];
    }
    
    // Pro and Coach tiers: all tracks available
    return ['actors', 'musicians', 'creators', 'influencers', 'coach'] as TrackId[];
  }, [subscription]);

  const getMaxExperts = useCallback((): number => {
    if (!subscription) return 3; // Default for free tier
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    return plan.limits.maxExperts || 3;
  }, [subscription]);

  return {
    subscription,
    usage,
    showSubscriptionModal,
    hasPremiumAccess,
    setSubscription,
    setUsage,
    setShowSubscriptionModal,
    checkSubscriptionLimits,
    incrementUsage,
    canUseFeature,
    isTrackAvailable,
    shouldShowTrackRestrictions,
    getAvailableTracks,
    getMaxExperts,
  };
};

