import React, { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getCurrentUserProfile,
  getCurrentSubscription,
  getUsageForCurrentPeriod,
  getTrainees,
  getAnalyses,
  isAdmin,
} from '../lib/supabase-helpers';
import { SUBSCRIPTION_PLANS } from '../constants';
import type {
  UserSubscription,
  SubscriptionTier,
  Trainee,
  SavedAnalysis,
  TrackId,
} from '../types';

interface UseUserDataReturn {
  profile: any;
  subscription: UserSubscription | null;
  usage: { analysesUsed: number; periodStart: Date; periodEnd: Date } | null;
  trainees: Trainee[];
  savedAnalyses: SavedAnalysis[];
  userIsAdmin: boolean;
  setProfile: (profile: any) => void;
  setSubscription: React.Dispatch<React.SetStateAction<UserSubscription | null>>;
  setUsage: (usage: { analysesUsed: number; periodStart: Date; periodEnd: Date } | null) => void;
  setTrainees: React.Dispatch<React.SetStateAction<Trainee[]>>;
  setSavedAnalyses: React.Dispatch<React.SetStateAction<SavedAnalysis[]>>;
  setUserIsAdmin: (isAdmin: boolean) => void;
  loadUserData: (currentUser: User, forceRefresh?: boolean) => Promise<void>;
  resetUserData: () => void;
}

interface UseUserDataParams {
  setHasShownPackageModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPackageSelectionModal: React.Dispatch<React.SetStateAction<boolean>>;
  setHasShownTrackModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUpgradeFromTier: React.Dispatch<React.SetStateAction<SubscriptionTier>>;
  setUpgradeToTier: React.Dispatch<React.SetStateAction<SubscriptionTier>>;
  setShowUpgradeBenefitsModal: React.Dispatch<React.SetStateAction<boolean>>;
  subscription: UserSubscription | null;
}

export const useUserData = ({
  setHasShownPackageModal,
  setShowPackageSelectionModal,
  setHasShownTrackModal,
  setUpgradeFromTier,
  setUpgradeToTier,
  setShowUpgradeBenefitsModal,
  subscription,
}: UseUserDataParams): UseUserDataReturn => {
  const [profile, setProfile] = useState<any>(null);
  const [subscriptionState, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<{ analysesUsed: number; periodStart: Date; periodEnd: Date } | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const resetUserData = useCallback(() => {
    setProfile(null);
    setSubscription(null);
    setUsage(null);
    setTrainees([]);
    setSavedAnalyses([]);
    setHasShownPackageModal(false);
    setHasShownTrackModal(false);
    setUserIsAdmin(false);
  }, [setHasShownPackageModal, setHasShownTrackModal]);

  const loadUserData = useCallback(async (currentUser: User, forceRefresh = false, retryCount = 0) => {
    try {
      console.log('🔄 loadUserData called', { userId: currentUser.id, forceRefresh, retryCount });
      
      // Verify user is still authenticated before loading data
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (!verifiedUser || verifiedUser.id !== currentUser.id) {
        console.warn('User changed or logged out during loadUserData');
        return;
      }
      
      // Force refresh auth session if requested
      if (forceRefresh) {
        try {
          await supabase.auth.refreshSession();
          console.log('🔄 Session refreshed');
        } catch (refreshError) {
          console.warn('Could not refresh session:', refreshError);
        }
      }

      // Load profile (force fresh fetch if forceRefresh is true)
      const userProfile = await getCurrentUserProfile(forceRefresh);
      
      // If profile not found and this is after signup, retry with delays (like clean app)
      if (!userProfile && retryCount < 3) {
        console.log(`[loadUserData] Profile not found, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          loadUserData(currentUser, forceRefresh, retryCount + 1);
        }, 1000 * (retryCount + 1)); // 1s, 2s, 3s delays
        return;
      }
      
      console.log('📋 Profile loaded:', {
        subscriptionTier: userProfile?.subscription_tier,
        subscriptionStatus: userProfile?.subscription_status,
        subscriptionPeriod: userProfile?.subscription_period,
      });
      
      // Verify user is still authenticated after profile load
      const { data: { user: verifiedUser2 } } = await supabase.auth.getUser();
      if (!verifiedUser2 || verifiedUser2.id !== currentUser.id) {
        console.warn('User changed or logged out during loadUserData');
        return;
      }
      
      setProfile(userProfile);

      // Load subscription first to check if user has paid subscription
      const subData = await getCurrentSubscription();
      const hasSubscriptionRecord = subData && subData.status === 'active' && subData.plans && (subData.plans as any).tier !== 'free';
      
      // Also check profile subscription status
      const userTier = userProfile?.subscription_tier || 'free';
      
      // Clear pending package upgrade flag if subscription tier is updated after login
      if (typeof window !== 'undefined' && userTier !== 'free' && localStorage.getItem('pending_package_upgrade') === 'true') {
        const urlParams = new URLSearchParams(window.location.search);
        const expectedTier = urlParams.get('to') as SubscriptionTier | null;
        
        if (!expectedTier || userTier === expectedTier || userTier !== 'free') {
          localStorage.removeItem('pending_package_upgrade');
          console.log('✅ Package updated, cleared pending_package_upgrade flag', { userTier, expectedTier });
        }
      }
      
      const profileStatusCheck = userProfile?.subscription_status;
      const isProfileActiveCheck = profileStatusCheck === 'active';
      const isPaidTierInProfile = userTier !== 'free' && ['creator', 'pro', 'coach', 'coach-pro'].includes(userTier);
      const hasActivePaidProfile = isProfileActiveCheck && isPaidTierInProfile;
      const hasPaidSubscription = hasSubscriptionRecord || hasActivePaidProfile;
      
      // Check if user needs to select a package/track
      const isFreeTier = userTier === 'free';
      const needsTrackSelection = !userProfile?.selected_primary_track;
      
      if (hasPaidSubscription) {
        console.log('✅ User has paid subscription, skipping package selection modal', {
          hasSubscriptionRecord,
          hasActivePaidProfile,
          userTier,
          profileStatus: profileStatusCheck,
        });
        if (needsTrackSelection && userTier === 'creator' && userProfile) {
          console.warn('⚠️ Paid subscription user (creator) without tracks - showing UpgradeBenefitsModal to select tracks');
          setUpgradeFromTier('free');
          setUpgradeToTier('creator');
          setShowUpgradeBenefitsModal(true);
        } else if (needsTrackSelection) {
          console.warn('⚠️ Paid subscription user without tracks - tracks should be set automatically after payment');
        }
      } else if (userProfile && needsTrackSelection && currentUser && !subscription && isFreeTier) {
        setHasShownPackageModal(true);
        setShowPackageSelectionModal(true);
      } else if (userProfile && needsTrackSelection && currentUser && !subscription && !isFreeTier && !hasPaidSubscription) {
        console.warn('⚠️ Paid tier user without tracks and without subscription - this should not happen', {
          userTier,
          profileStatus: profileStatusCheck,
          hasSubscriptionRecord,
          hasActivePaidProfile,
        });
      }

      // Check if user is admin
      const adminStatus = await isAdmin();
      console.log('🔍 App: Admin status check result:', adminStatus, 'for user:', currentUser.email);
      setUserIsAdmin(adminStatus);

      // Determine subscription tier
      const profileTier = userProfile?.subscription_tier as SubscriptionTier | undefined;
      const profileStatus = userProfile?.subscription_status;
      // For free tier, treat null status as active (free tier is always active)
      // For other tiers, require explicit 'active' status
      const isProfileActive = profileTier === 'free' 
        ? (profileStatus === 'active' || profileStatus === null) // Free tier: null or 'active' both mean active
        : profileStatus === 'active'; // Paid tiers: must be explicitly 'active'
      
      // Validation - verify tier exists in SUBSCRIPTION_PLANS (using same validation as usePlanAccess)
      const validTiers: SubscriptionTier[] = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[];
      const isValidProfileTier = profileTier && validTiers.includes(profileTier);
      
      let finalTier: SubscriptionTier = 'free';
      let finalBillingPeriod: 'monthly' | 'yearly' = 'monthly';
      let finalStartDate: Date = new Date();
      let finalEndDate: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      let finalIsActive = false;
      
      if (subData && subData.plans && subData.status === 'active') {
        const plan = subData.plans as any;
        finalTier = plan.tier as SubscriptionTier;
        finalBillingPeriod = subData.billing_period as 'monthly' | 'yearly';
        finalStartDate = new Date(subData.start_date);
        finalEndDate = new Date(subData.end_date);
        finalIsActive = true;
      } else if (isProfileActive && isValidProfileTier) {
        finalTier = profileTier;
        finalBillingPeriod = (userProfile?.subscription_period as 'monthly' | 'yearly') || 'monthly';
        finalStartDate = userProfile?.subscription_start_date ? new Date(userProfile.subscription_start_date) : new Date();
        finalEndDate = userProfile?.subscription_end_date ? new Date(userProfile.subscription_end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        finalIsActive = true;
        console.log('✅ Using profile tier (subscription record not found yet):', {
          profileTier,
          profileStatus,
          finalTier,
        });
      } else {
        if (isProfileActive && profileTier && !validTiers.includes(profileTier)) {
          console.warn('⚠️ Profile has active status but invalid tier:', profileTier);
        }
        finalTier = 'free';
        finalIsActive = true;
        console.log('ℹ️ Defaulting to free tier:', {
          isProfileActive,
          isValidProfileTier,
          profileTier,
          profileStatus,
        });
      }
      
      console.log('📊 Setting subscription state:', {
        hasSubscriptionRecord: !!subData,
        subscriptionTier: subData?.plans?.tier,
        profileTier,
        profileStatus,
        finalTier,
        finalIsActive,
      });
      
      console.log('🔄 Setting subscription state (force update):', {
        previousTier: subscription?.tier,
        newTier: finalTier,
        previousIsActive: subscription?.isActive,
        newIsActive: finalIsActive,
      });
      
      setSubscription({
        tier: finalTier,
        billingPeriod: finalBillingPeriod,
        startDate: finalStartDate,
        endDate: finalEndDate,
        usage: {
          analysesUsed: 0,
          lastResetDate: finalStartDate,
        },
        isActive: finalIsActive,
      });
      
      // Broadcast subscription update to other tabs/windows
      if (typeof BroadcastChannel !== 'undefined' && currentUser) {
        try {
          const channel = new BroadcastChannel('viraly-subscription-sync');
          channel.postMessage({
            type: 'subscription-updated',
            userId: currentUser.id,
            tier: finalTier,
            isActive: finalIsActive,
            timestamp: Date.now(),
          });
          channel.close();
        } catch (e) {
          console.warn('Could not broadcast subscription update:', e);
        }
      }

      // Load usage and update subscription state
      const usageData = await getUsageForCurrentPeriod();
      if (usageData) {
        setUsage(usageData);
        setSubscription(prev => {
          if (!prev) return null;
          return {
            ...prev,
            usage: {
              analysesUsed: usageData.analysesUsed,
              lastResetDate: usageData.periodStart,
            },
          };
        });
      }

      // Load trainees if coach or coach-pro
      if (userProfile?.subscription_tier === 'coach' || userProfile?.subscription_tier === 'coach-pro') {
        const traineesData = await getTrainees();
        setTrainees(traineesData.map(t => ({
          id: t.id,
          name: t.name,
          email: t.email || undefined,
          phone: t.phone || undefined,
          notes: t.notes || undefined,
          createdAt: new Date(t.created_at),
          analyses: [],
        })));
      }

      // Load analyses
      const analysesData = await getAnalyses();
      const mappedAnalyses = analysesData.map(a => ({
        id: a.id,
        videoName: '',
        videoUrl: '',
        traineeId: a.trainee_id || undefined,
        traineeName: undefined,
        analysisDate: new Date(a.created_at),
        result: a.result,
        averageScore: a.average_score,
        track: a.track as TrackId,
        metadata: {
          prompt: a.prompt || undefined,
        },
      }));
      
      // Remove duplicates by ID
      const uniqueAnalyses = Array.from(
        new Map(mappedAnalyses.map(a => [a.id, a])).values()
      );
      
      setSavedAnalyses(uniqueAnalyses);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [
    subscription,
    setHasShownPackageModal,
    setShowPackageSelectionModal,
    setHasShownTrackModal,
    setUpgradeFromTier,
    setUpgradeToTier,
    setShowUpgradeBenefitsModal,
  ]);

  return {
    profile,
    subscription: subscriptionState,
    usage,
    trainees,
    savedAnalyses,
    userIsAdmin,
    setProfile,
    setSubscription,
    setUsage,
    setTrainees,
    setSavedAnalyses,
    setUserIsAdmin,
    loadUserData,
    resetUserData,
  };
};

