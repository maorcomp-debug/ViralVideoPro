import { useState, useEffect, useCallback } from 'react';
import type { UserSubscription, SubscriptionTier, BillingPeriod, SubscriptionLimits, TrackId } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';
import { getUsageForCurrentPeriod } from '../lib/supabase-helpers';
import { getPlanAccess, isTrackAvailableForTier, getAvailableTracksForTier } from './usePlanAccess';

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

    // Use pure function from usePlanAccess for consistency
    const planAccess = getPlanAccess(subscription);
    if (!planAccess) {
      return { allowed: false, message: 'חבילה לא פעילה. יש לחדש את המנוי' };
    }
    
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

    // Check analysis limit using pure function
    if (!planAccess.canRunAnalysis(analysesUsed)) {
      if (subscription.tier === 'free') {
        // Free tier: 2 analyses per month (resets monthly)
        const now = new Date();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          allowed: false, 
          message: `סיימת את ניתוח הטעימה החינמי. ניתוח נוסף יתאפשר בעוד ${daysLeft} ימים (תחילת חודש הבא) או שדרג לחבילה משלמת כדי להמשיך` 
        };
      } else {
        // Paid tiers: check within subscription period
        return { 
          allowed: false, 
          message: `סיימת את הניתוחים בתקופת המנוי (המכסה נוצלה במלואה). הניהול יתאפס בתקופת החיוב הבאה או שניתן לשדרג לחבילה גבוהה יותר.` 
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
    
    // Use pure function from usePlanAccess for consistency
    const planAccess = getPlanAccess(subscription);
    if (!planAccess) return false;
    
    return planAccess.hasFeature(feature);
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
      const planAccess = getPlanAccess(subscription);
      return planAccess?.hasFeature('traineeManagement') ?? false;
    }

    // Use pure function from usePlanAccess for consistency
    // This ensures the same logic is used everywhere
    return isTrackAvailableForTier(
      trackId,
      subscription.tier,
      profile.selected_tracks as TrackId[] | null,
      profile.selected_primary_track as TrackId | null
    );
  }, [subscription]);

  const shouldShowTrackRestrictions = useCallback((trackId: TrackId, user: any): boolean => {
    // Don't show restrictions if user is not logged in
    if (!user) return false;
    
    // Admin email has no restrictions
    if (user.email === 'viralypro@gmail.com') return false;
    
    return !isTrackAvailable(trackId, user, profile);
  }, [profile, isTrackAvailable]);

  const getAvailableTracks = useCallback((profile: any): TrackId[] => {
    if (!profile || !subscription) return [];
    
    // Use pure function from usePlanAccess for consistency
    return getAvailableTracksForTier(
      subscription.tier,
      profile.selected_tracks as TrackId[] | null,
      profile.selected_primary_track as TrackId | null
    );
  }, [subscription]);

  const getMaxExperts = useCallback((): number => {
    if (!subscription) return 3; // Default for free tier
    
    // Use pure function from usePlanAccess for consistency
    const planAccess = getPlanAccess(subscription);
    return planAccess?.maxExperts || 3;
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

