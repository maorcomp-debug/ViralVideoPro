import './src/i18n';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { GlobalStyle, fadeIn, shimmer, pulse, glowReady, breathingHigh } from './src/styles/globalStyles';
import { SettingsPage } from './src/components/pages/SettingsPage';
import { AdminPage } from './src/components/pages/AdminPage';
import { OrderReceivedPage } from './src/components/pages/OrderReceivedPage';
import { PaymentRedirectPage } from './src/components/pages/PaymentRedirectPage';
import { SubscriptionModal } from './src/components/modals/SubscriptionModal';
import { SubscriptionBillingModal } from './src/components/modals/SubscriptionBillingModal';
import { UpgradeBenefitsModal } from './src/components/modals/UpgradeBenefitsModal';
import { AuthModal } from './src/components/modals/AuthModal';
import { CapabilitiesModal } from './src/components/modals/CapabilitiesModal';
import { CoachGuideModal } from './src/components/modals/CoachGuideModal';
import { TrackSelectionModal } from './src/components/modals/TrackSelectionModal';
import { PackageSelectionModal } from './src/components/modals/PackageSelectionModal';
import { TakbullPaymentModal } from './src/components/modals/TakbullPaymentModal';
import { ComparisonModal } from './src/components/modals/ComparisonModal';
import { CoachDashboardModal } from './src/components/modals/CoachDashboardModal';
import { AppLogo } from './src/components/AppLogo';
import { LanguageDropdown } from './src/components/LanguageDropdown';
import { AppContainer, Header } from './src/styles/components';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalTabs,
  ModalTab,
  TrackDescriptionText,
  ModalBody,
  ModalRow,
  ModalRole,
  ModalDesc,
} from './src/styles/modal';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './src/lib/supabase';
import {
  getCurrentUserProfile,
  getCurrentSubscription,
  updateCurrentUserProfile,
  getUsageForCurrentPeriod,
  uploadVideo,
  saveVideoToDatabase,
  saveAnalysis,
  getTrainees,
  saveTrainee,
  getAnalyses,
  findPreviousAnalysisByVideo,
  isAdmin,
  getAllUsers,
  updateUserProfile,
  deleteUser,
  createUser,
  getAllAnalyses,
  getAllVideos,
  getUserAnalyses,
  getUserVideos,
  getUserUsageStats,
  getAdminStats,
  redeemCoupon,
} from './src/lib/supabase-helpers';
import type { User } from '@supabase/supabase-js';
import type {
  TrackId,
  ExpertAnalysis,
  AnalysisResult,
  SavedAnalysis,
  Trainee,
  CoachComparison,
  CoachReport,
  SubscriptionTier,
  BillingPeriod,
  SubscriptionLimits,
  SubscriptionPlan,
  UserSubscription,
} from './src/types';
import {
  SUBSCRIPTION_PLANS,
  TRACK_DESCRIPTIONS,
  EXPERTS_BY_TRACK,
  getMaxVideoSeconds,
  getMaxFileBytes,
  getUploadLimitText,
} from './src/constants';
import {
  Title,
  Subtitle,
  Description,
  CTAButton,
  CapabilitiesButton,
  CoachButton,
  TraineeGrid,
  UpgradeMessageBox,
  TraineeCard,
  TraineeName,
  TraineeInfo,
  TraineeActions,
  TraineeActionButton,
  EmptyState,
  TraineeForm,
  FormInput,
  FormTextarea,
  SectionLabel,
  ExpertControlBar,
  ExpertControlText,
  ExpertToggleGroup,
  ExpertToggleButton,
  Grid,
  TrackCard,
  PremiumCoachCard,
  FeatureCard,
  FeatureTitle,
  FeatureDesc,
  UploadContainer,
  UploadContent,
  UploadIcon,
  UploadTitle,
  UploadSubtitle,
  FileInput,
  UploadButton,
  FullSizePreview,
  RemoveFileBtn,
  PdfUploadWrapper,
  PdfUploadLabel,
  PdfFileInfo,
  RemovePdfBtnSmall,
  InputWrapper,
  MainInput,
  ActionButton,
  ErrorMsg,
  ResponseArea,
  SectionTitleExternal,
  CompactResultBox,
  HookText,
  ExpertsGrid,
  ExpertResultCard,
  ExpertScore,
  ExpertSectionTitle,
  ExpertText,
  CommitteeSection,
  CommitteeText,
  CommitteeTips,
  FinalScore,
  ActionButtonsContainer,
  SecondaryButton,
  PrimaryButton,
  PremiumBadge,
  LogoPlaceholder,
  HiddenLogoInput,
  Divider,
  PackagesButton,
} from './src/styles/indexStyles';
import {
  PhoneStarIcon,
  TheaterMasksIcon,
  MicrophoneIcon,
  MusicNoteIcon,
  CinematicCameraIcon,
  RefreshIcon,
  UploadIconSmall,
  EyeIcon,
  BulbIcon,
  SparklesIcon,
  SubtleSparkleIcon,
  SubtleDocumentIcon,
  PdfIcon,
  NoEntryIcon,
  CloseIcon,
  CoachIcon,
  ComparisonIcon,
} from './src/components/icons';

const TRACKS = [
  { id: 'actors', label: 'שחקנים ואודישנים', icon: <TheaterMasksIcon /> },
  { id: 'musicians', label: 'זמרים ומוזיקאים', icon: <MusicNoteIcon /> },
  { id: 'creators', label: 'יוצרי תוכן וכוכבי רשת', icon: <PhoneStarIcon /> },
  { id: 'influencers', label: 'משפיענים ומותגים', icon: <MicrophoneIcon /> },
  { id: 'coach', label: 'מסלול פרימיום', icon: <CoachIcon />, isPremium: true },
];

const App = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // Use both: React Router can briefly lag on F5 refresh – window.location is source of truth for route
  const currentPath = typeof window !== 'undefined' && window.location.pathname
    ? window.location.pathname
    : location.pathname;
  
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'initial' | 'upgrade'>('initial');
  const [authModalUpgradePackage, setAuthModalUpgradePackage] = useState<string | null>(null);
  const [redeemCodeFromUrl, setRedeemCodeFromUrl] = useState<string | null>(null);
  const [redeemPackageFromUrl, setRedeemPackageFromUrl] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Determine current page from route
  const isHomePage = currentPath === '/';
  const isSettingsPage = currentPath === '/settings';
  const isAdminPage = currentPath === '/admin';
  const isAnalysisPage = currentPath.startsWith('/analysis');
  const isCreatorPage = currentPath === '/creator';
  
  const [activeTrack, setActiveTrack] = useState<TrackId>('actors');
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('actors');
  
  // Subscription State (from Supabase)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<{ analysesUsed: number; minutesUsed: number; periodStart: Date; periodEnd: Date } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const updatingSubscriptionRef = useRef(false);
  
  // Calculate premium access based on subscription
  const hasPremiumAccess = subscription ? subscription.tier !== 'free' : false;
  
  // Results
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [previousResult, setPreviousResult] = useState<AnalysisResult | null>(null);
  const [isImprovementMode, setIsImprovementMode] = useState(false);

  // Coach Edition State
  const [coachMode, setCoachMode] = useState<'coach' | 'trainee' | null>(null);
  const [coachTrainingTrack, setCoachTrainingTrack] = useState<TrackId>('actors'); // תחום האימון שנבחר במסלול Coach
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'deep'>('standard'); // סוג הניתוח: רגיל או מעמיק (עובד גם ל-Pro)
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null); // לזיהוי סרטון זהה (name + size)
  // Coach Edition State (from Supabase)
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<string | null>(null);
  const [showCoachDashboard, setShowCoachDashboard] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showCoachGuide, setShowCoachGuide] = useState(false);
  const [showTrackSelectionModal, setShowTrackSelectionModal] = useState(false);
  const [showPackageSelectionModal, setShowPackageSelectionModal] = useState(false);
  const [showSubscriptionBillingModal, setShowSubscriptionBillingModal] = useState(false);
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [showTakbullPayment, setShowTakbullPayment] = useState(false);
  const [takbullPaymentUrl, setTakbullPaymentUrl] = useState<string>('');
  const [takbullOrderReference, setTakbullOrderReference] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasShownPackageModal, setHasShownPackageModal] = useState(false);
  const [showUpgradeBenefitsModal, setShowUpgradeBenefitsModal] = useState(false);
  const [upgradeFromTier, setUpgradeFromTier] = useState<SubscriptionTier>('free');
  const [upgradeToTier, setUpgradeToTier] = useState<SubscriptionTier>('free');
  const [hasShownTrackModal, setHasShownTrackModal] = useState(false);
  const [showUpgradeCompletionMessage, setShowUpgradeCompletionMessage] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadUserDataInProgressRef = useRef(false);
  const gotValidSessionFromGetSessionRef = useRef(false);
  const lastLoadUserDataUserIdRef = useRef<string | null>(null);
  const lastLoadUserDataTimeRef = useRef<number>(0);
  const AUTH_LOAD_THROTTLE_MS = 15000;

  // Profile & Subscription cache helpers
  const PROFILE_CACHE_KEY = 'viral_profile_cache';
  const SUBSCRIPTION_CACHE_KEY = 'viral_subscription_cache';
  const ADMIN_STATUS_CACHE_KEY = 'viral_admin_status';
  
  const saveProfileToCache = (profileData: any) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
    } catch (e) {
      console.warn('Failed to cache profile:', e);
    }
  };
  
  const loadProfileFromCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('Failed to load cached profile:', e);
      return null;
    }
  };
  
  const saveSubscriptionToCache = (subscriptionData: any) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subscriptionData));
    } catch (e) {
      console.warn('Failed to cache subscription:', e);
    }
  };
  
  const loadSubscriptionFromCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
      if (!cached) return null;
      const subscriptionData = JSON.parse(cached);
      // Convert date strings back to Date objects (JSON.stringify converts Date to string)
      if (subscriptionData) {
        if (subscriptionData.startDate && typeof subscriptionData.startDate === 'string') {
          subscriptionData.startDate = new Date(subscriptionData.startDate);
        }
        if (subscriptionData.endDate && typeof subscriptionData.endDate === 'string') {
          subscriptionData.endDate = new Date(subscriptionData.endDate);
        }
        if (subscriptionData.usage?.lastResetDate && typeof subscriptionData.usage.lastResetDate === 'string') {
          subscriptionData.usage.lastResetDate = new Date(subscriptionData.usage.lastResetDate);
        }
      }
      return subscriptionData;
    } catch (e) {
      console.warn('Failed to load cached subscription:', e);
      return null;
    }
  };
  
  const clearProfileCache = () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      sessionStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
      sessionStorage.removeItem(ADMIN_STATUS_CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  };

  const loadAdminStatusFromCache = (userId: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const cached = sessionStorage.getItem(ADMIN_STATUS_CACHE_KEY);
      if (!cached) return false;
      const { uid, admin } = JSON.parse(cached);
      return uid === userId && admin === true;
    } catch {
      return false;
    }
  };

  const saveAdminStatusToCache = (userId: string, isAdmin: boolean) => {
    if (typeof window === 'undefined' || !isAdmin) return;
    try {
      sessionStorage.setItem(ADMIN_STATUS_CACHE_KEY, JSON.stringify({ uid: userId, admin: true }));
    } catch (e) {
      console.warn('Failed to cache admin status:', e);
    }
  };

  // Helper function to reset all user-related state
  const resetUserState = () => {
    setProfile(null);
    setSubscription(null);
    setUsage(null);
    setTrainees([]);
    setSavedAnalyses([]);
    setHasShownPackageModal(false);
    setHasShownTrackModal(false);
    setUserIsAdmin(false);
    clearProfileCache();
    lastLoadUserDataUserIdRef.current = null;
    lastLoadUserDataTimeRef.current = 0;
  };

  // Auto-save subscription to cache whenever it changes
  useEffect(() => {
    if (subscription) {
      saveSubscriptionToCache(subscription);
    }
  }, [subscription]);

  // תצוגה מקדימה: מאלצים טעינת הווידאו כשמועלה קובץ (מחשב + מובייל) כדי שהמסגרת תמיד תציג פריים
  useEffect(() => {
    if (!previewUrl || !file?.type.startsWith('video')) return;
    const t = setTimeout(() => {
      const video = videoRef.current;
      if (video && video.src) {
        try {
          video.load();
        } catch (_) {}
      }
    }, 100);
    return () => clearTimeout(t);
  }, [previewUrl, file]);

  // Admin state is managed by loadUserData - no fast-path needed here

  // Load user data from Supabase (with protection against duplicate calls)
  // Wrapped in useCallback to prevent recreation on every render and fix React hooks error #300
  // MUST be defined BEFORE useEffect that uses it
  const loadUserData = useCallback(async (currentUser: User, forceRefresh = false, skipSessionRefresh = false) => {
    try {
      // Only log if forceRefresh is true or if it's a significant call
      if (forceRefresh) {
        console.log('🔄 loadUserData called', { userId: currentUser.id, forceRefresh });
      }
      setIsLoadingProfile(true);
      
      // Do NOT call supabase.auth.getUser() here – after F5 it can hang and block the whole flow.
      // We already have currentUser from getSession/onAuthStateChange; load profile by ID directly.
      // Skip refreshSession on auth events (SIGNED_IN/INITIAL_SESSION) – it can hang on fresh load.
      if (forceRefresh && !skipSessionRefresh) {
        try {
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('refreshSession timeout')), 2500)
            ),
          ]);
        } catch (refreshError) {
          // Continue – profile can still load with current session
        }
      }

      // Load profile by userId (avoids getUser() inside helper – prevents hang after F5)
      let userProfile = await getCurrentUserProfile(forceRefresh, currentUser.id);
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!userProfile && retryCount < maxRetries) {
        console.log(`[loadUserData] Profile not found, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 300 + retryCount * 200)); // 300ms, 500ms, 700ms – faster UX
        userProfile = await getCurrentUserProfile(true, currentUser.id);
        retryCount++;
      }
      
      // Only log profile load details if forceRefresh (to reduce console noise)
      if (userProfile && forceRefresh) {
        console.log('📋 Profile loaded:', {
          subscriptionTier: userProfile.subscription_tier,
          subscriptionStatus: userProfile.subscription_status,
          subscriptionPeriod: userProfile.subscription_period,
          primaryTrack: userProfile.selected_primary_track,
          tracks: userProfile.selected_tracks,
        });
      } else if (!userProfile) {
        console.warn('⚠️ Profile not found or failed to load after retries:', {
          userId: currentUser.id,
          forceRefresh,
          retryCount,
        });
      }
      
      // Do not call getUser() again here – can hang after F5; we already have currentUser

      // Fallback for initial signup: if DB trigger didn't copy signup_primary_track to profile, sync from user_metadata
      // (ensures "אקשן!" works right after registration with the new initial form)
      const meta = currentUser.user_metadata || {};
      if (userProfile && (!userProfile.selected_primary_track || !userProfile.subscription_tier) && (meta.signup_primary_track || meta.signup_tier)) {
        try {
          await updateCurrentUserProfile({
            ...(meta.signup_primary_track ? { selected_primary_track: meta.signup_primary_track } : {}),
            ...(meta.signup_tier ? { subscription_tier: meta.signup_tier } : {}),
          });
          const updated = await getCurrentUserProfile(true, currentUser.id);
          if (updated) userProfile = updated;
        } catch (e) {
          console.warn('Fallback sync signup metadata to profile failed:', e);
        }
      }
      
      // IMPORTANT: Always set profile, even if null (to prevent stale data)
      // But don't set to null if we're in the middle of an upgrade flow
      const isUpgradeFlow = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).get('upgrade') === 'success';
      
      if (userProfile) {
        // ⚠️⚠️⚠️ CRITICAL - DO NOT ADD RETRY LOGIC HERE ⚠️⚠️⚠️
        // 
        // Retry logic was REMOVED after fixing signup race condition.
        // Database trigger creates profile with metadata correctly from the start.
        // DO NOT add retry logic or profile update verification here - it's not needed!
        //
        // PROBLEM SOLVED: Race condition where profile wasn't ready when loadUserData ran.
        // SOLUTION: Trigger creates profile correctly, so no retries needed.
        //
        // ⚠️ DO NOT ADD RETRY LOGIC - Trigger handles everything correctly ⚠️
        // Date fixed: 2026-01-16
        // Status: WORKING - DO NOT TOUCH
        // VERSION: 2.3 - Profile created by trigger with metadata - complete immediately
        
        // Creator (and other multi-track tiers): if cache has more selected_tracks than server
        // (e.g. user added track and refreshed before DB write completed), keep cache's list
        // so the additional track doesn't disappear on refresh
        let profileToSet = userProfile;
        const tier = userProfile?.subscription_tier;
        const canHaveMultipleTracks = tier === 'creator' || tier === 'pro' || tier === 'coach' || tier === 'coach-pro';
        if (canHaveMultipleTracks && userProfile) {
          const cached = loadProfileFromCache();
          const serverCount = (userProfile.selected_tracks && userProfile.selected_tracks.length) || 0;
          const cachedCount = (cached?.selected_tracks && cached.selected_tracks.length) || 0;
          if (cachedCount > serverCount && cached?.selected_tracks?.length) {
            profileToSet = { ...userProfile, selected_tracks: cached.selected_tracks };
          }
        }
        setProfile(profileToSet);
        // Cache profile for instant load on refresh
        saveProfileToCache(profileToSet);
        // Only log profile load if forceRefresh (to reduce console noise)
        if (forceRefresh) {
          console.log('✅ Profile loaded successfully:', {
            tier: userProfile.subscription_tier,
            primaryTrack: userProfile.selected_primary_track,
            tracks: userProfile.selected_tracks,
            subscriptionStatus: userProfile.subscription_status,
          });
        }
      } else {
        // Profile not found - this shouldn't happen for registered users
        // But don't clear profile if we're in upgrade flow (might be loading)
        if (!isUpgradeFlow) {
          setProfile(null);
          console.warn('⚠️ Profile not found for user - this may cause issues');
        }
      }

      // Load subscription by userId (avoids getUser() – prevents hang after F5)
      const subData = await getCurrentSubscription(currentUser.id);
      const hasSubscriptionRecord = subData && subData.status === 'active' && subData.plans && (subData.plans as any).tier !== 'free';
      
      // Also check profile subscription status - sometimes profile is updated before subscription record exists
      const userTier = userProfile?.subscription_tier || 'free';
      
      // Clear pending package upgrade flag if subscription tier is updated after login
      // This happens when user logs back in and their package is already updated
      // Only clear if tier is actually different from what was expected (meaning upgrade completed)
      if (typeof window !== 'undefined' && userTier !== 'free' && localStorage.getItem('pending_package_upgrade') === 'true') {
        // Check if we have upgrade info in URL or state
        const urlParams = new URLSearchParams(window.location.search);
        const expectedTier = urlParams.get('to') as SubscriptionTier | null;
        
        // If tier matches expected upgrade tier, or if tier is not free, clear the flag
        if (!expectedTier || userTier === expectedTier || userTier !== 'free') {
          localStorage.removeItem('pending_package_upgrade');
          console.log('✅ Package updated, cleared pending_package_upgrade flag', { userTier, expectedTier });
        }
      }
      const profileStatusCheck = userProfile?.subscription_status;
      const isProfileActiveCheck = profileStatusCheck === 'active';
      const isPaidTierInProfile = userTier !== 'free' && ['creator', 'pro', 'coach', 'coach-pro'].includes(userTier);
      const hasActivePaidProfile = isProfileActiveCheck && isPaidTierInProfile;
      
      // User has paid subscription if either subscription record exists OR profile shows active paid tier
      const hasPaidSubscription = hasSubscriptionRecord || hasActivePaidProfile;
      
      // DISABLED: Package and track selection modals after signup
      // User already selected package and track during registration
      // These modals were causing issues with immediate login flow
      // const isFreeTier = userTier === 'free';
      // const needsTrackSelection = !userProfile?.selected_primary_track;
      // 
      // All package and track selection is now handled during registration in AuthModal
      // No need to show modals after login - user enters directly with selected settings

      // Check if user is admin (critical for admin panel access)
      const adminStatus = await isAdmin();
      // Only log admin check if forceRefresh (to reduce console noise)
      if (forceRefresh) {
        console.log('🔑 Admin check for', currentUser.email, ':', adminStatus ? 'Admin' : 'User');
      }
      setUserIsAdmin(adminStatus);
      if (adminStatus) saveAdminStatusToCache(currentUser.id, true);
      
      // If admin, trigger refresh event for admin panel
      if (adminStatus) {
        // Dispatch event to refresh admin panel data
        window.dispatchEvent(new CustomEvent('admin_data_refresh'));
      }

      // Determine subscription tier: prioritize subscription record, but use profile if subscription record doesn't exist yet
      // This ensures immediate update after payment when profile is updated but subscription record may not be created yet
      const profileTier = userProfile?.subscription_tier as SubscriptionTier | undefined;
      const profileStatus = userProfile?.subscription_status;
      const isProfileActive = profileStatus === 'active';
      const validTiers: SubscriptionTier[] = ['free', 'creator', 'pro', 'coach', 'coach-pro'];
      const isValidProfileTier = profileTier && validTiers.includes(profileTier);
      
      // Use subscription record tier if available, otherwise use profile tier if active and valid
      let finalTier: SubscriptionTier = 'free';
      let finalBillingPeriod: 'monthly' | 'yearly' = 'monthly';
      let finalStartDate: Date = new Date();
      let finalEndDate: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      let finalIsActive = false;
      
      if (subData && subData.plans && subData.status === 'active') {
        // Use subscription record (most reliable)
        const plan = subData.plans as any;
        finalTier = plan.tier as SubscriptionTier;
        finalBillingPeriod = subData.billing_period as 'monthly' | 'yearly';
        finalStartDate = new Date(subData.start_date);
        finalEndDate = new Date(subData.end_date);
        finalIsActive = true;
      } else if (isProfileActive && isValidProfileTier) {
        // Use profile tier if active (handles case where profile updated but subscription record not created yet)
        // IMPORTANT: This is critical for immediate update after payment
        finalTier = profileTier;
        finalBillingPeriod = (userProfile?.subscription_period as 'monthly' | 'yearly') || 'monthly';
        finalStartDate = userProfile?.subscription_start_date ? new Date(userProfile.subscription_start_date) : new Date();
        finalEndDate = userProfile?.subscription_end_date ? new Date(userProfile.subscription_end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        finalIsActive = true;
        // Only log if forceRefresh (to reduce console noise)
        if (forceRefresh) {
          console.log('✅ Using profile tier (subscription record not found yet):', {
            profileTier,
            profileStatus,
            finalTier,
          });
        }
      } else {
        // Default to free tier ONLY if profile is not active or tier is invalid
        // Don't default to free if we just paid - check if profile was recently updated
        if (isProfileActive && profileTier && !validTiers.includes(profileTier)) {
          console.warn('⚠️ Profile has active status but invalid tier:', profileTier);
        }
        finalTier = 'free';
        finalIsActive = true; // Free tier never expires
        // Only log if forceRefresh (to reduce console noise)
        if (forceRefresh) {
          console.log('ℹ️ Defaulting to free tier:', {
            isProfileActive,
            isValidProfileTier,
            profileTier,
            profileStatus,
          });
        }
      }
      
      // Only log subscription state changes when tier actually changes (to reduce console noise)
      // Note: We can't use subscription from closure here as it might be stale, so we just log if forceRefresh
      if (forceRefresh) {
        console.log('📊 Setting subscription state:', {
          hasSubscriptionRecord: !!subData,
          subscriptionTier: subData?.plans?.tier,
          profileTier,
          profileStatus,
          finalTier,
          finalIsActive,
        });
      }
      
      const subscriptionData = {
        tier: finalTier,
        billingPeriod: finalBillingPeriod,
        startDate: finalStartDate,
        endDate: finalEndDate,
        usage: {
          analysesUsed: 0, // Will be loaded separately
          lastResetDate: finalStartDate,
        },
        isActive: finalIsActive,
      };
      
      setSubscription(subscriptionData);
      saveSubscriptionToCache(subscriptionData); // Cache for instant refresh
      
      // Broadcast subscription update to other tabs/windows if tier changed
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

      // Load usage and update subscription state (but preserve tier!)
      // Always load fresh usage data to ensure accuracy (includes both analyses and minutes)
      const usageData = await getUsageForCurrentPeriod();
      if (usageData) {
        setUsage(usageData);
        // Update subscription with current usage, but preserve tier and other subscription data
        // Note: minutesUsed is in usage state, not in subscription.usage (subscription.usage only has analyses)
        setSubscription(prev => {
          if (!prev) return null;
          return {
            ...prev, // Preserve tier, billingPeriod, startDate, endDate, isActive
            usage: {
              analysesUsed: usageData.analysesUsed,
              lastResetDate: usageData.periodStart,
            },
          };
        });
      } else {
        // If usage data is null, set it to empty to prevent display issues
        setUsage({
          analysesUsed: 0,
          minutesUsed: 0,
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
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
          analyses: [], // Will be loaded separately
        })));
      }

      // Load analyses
      const analysesData = await getAnalyses();
      const mappedAnalyses = analysesData.map(a => ({
        id: a.id,
        videoName: '', // Will be loaded from video if exists
        videoUrl: '',
        traineeId: a.trainee_id || undefined,
        traineeName: undefined, // Will be resolved from trainees
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
    } finally {
      setIsLoadingProfile(false);
    }
  }, []); // Empty deps - all state setters are stable, subscription comparison removed to prevent infinite loops

  // Initialize Supabase Auth
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Load cached profile & subscription immediately for instant UI (prevents email flash on refresh)
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
    
    const cachedSubscription = loadSubscriptionFromCache();
    if (cachedSubscription) {
      setSubscription(cachedSubscription);
    }
    
    // Set up BroadcastChannel to sync subscription updates across multiple tabs/windows
    const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
      ? new BroadcastChannel('viraly-subscription-sync') 
      : null;
    
    // Listen for subscription updates from other tabs/windows - IMMEDIATE update
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        // IMMEDIATE reload when subscription is updated in another tab (no delay)
        if (event.data.type === 'subscription-updated' && user && user.id === event.data.userId) {
          // No setTimeout - update immediately
          (async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser && currentUser.id === user.id) {
              // Use the latest loadUserData from closure - IMMEDIATE update
              await loadUserData(currentUser, true).catch(err => console.error('Error in broadcast reload:', err));
              console.log('✅ Subscription synced IMMEDIATELY from other tab');
            }
          })();
        }
      };
    }
    
    // Try to get session quickly, but don't block UI if it takes too long
    // Set a timeout to ensure loadingAuth is always set to false, even if getSession hangs
    timeoutId = setTimeout(() => {
      if (mounted) setLoadingAuth(false);
    }, 1500); // 1.5s max – unblock UI quickly
    
    // Check initial session (only once on mount)
    // This is non-blocking - if it takes too long, timeout will unblock the UI
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoadingAuth(false);
          return;
        }
        
        // Update user state immediately if session exists
        setUser(session?.user ?? null);
        setLoadingAuth(false);
        if (session?.user) gotValidSessionFromGetSessionRef.current = true;
        
        // CRITICAL: Restore admin status from cache immediately (F5 on home page – show "פאנל ניהול" button)
        if (session?.user && loadAdminStatusFromCache(session.user.id)) {
          setUserIsAdmin(true);
        }
        
        // CRITICAL: Also load user data when getSession returns with session (e.g. F5 on home page)
        // Defer one tick so Supabase client is ready – avoids profile/subscription requests hanging
        if (session?.user && !loadUserDataInProgressRef.current) {
          loadUserDataInProgressRef.current = true;
          setTimeout(() => {
            loadUserData(session.user, true, true)
              .catch((err) => console.error('Error loading user data from getSession:', err))
              .finally(() => { loadUserDataInProgressRef.current = false; });
          }, 0);
        }
      })
      .catch(async (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ Error in getSession promise:', error);
        if (mounted) {
          setLoadingAuth(false);
          const msg = error?.message ?? '';
          if (msg.includes('Refresh Token') || msg.includes('refresh_token') || msg.includes('Invalid')) {
            await supabase.auth.signOut();
            setUser(null);
            resetUserState();
          }
        }
      });

    // Listen for auth changes (this handles both initial session and subsequent changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Log only important auth state changes (skip TOKEN_REFRESHED to reduce noise)
      if (event !== 'TOKEN_REFRESHED') {
        console.log('[App] Auth state changed:', event, session?.user?.id);
      }
      
      // Update user state
      setUser(session?.user ?? null);
      
      // Handle INITIAL_SESSION event (when app first loads)
      if (event === 'INITIAL_SESSION') {
        if (!session?.user) {
          console.log('[App] User logged out');
        } else {
          console.log('[App] User logged in:', { id: session.user.id, email: session.user.email });
        }
      }
      
      // If this is an email confirmation event, close other tabs/windows that might be showing old data
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is from email verification (has hash in URL)
        const urlHash = window.location.hash;
        if (urlHash.includes('access_token') || urlHash.includes('type=recovery')) {
          console.log('📧 Email verification detected, this window should be the active one');
          // Optionally, we could try to close other windows, but that's not always possible
          // Instead, we'll rely on BroadcastChannel to sync data
        }
      }
      
      if (session?.user) {
        if (loadUserDataInProgressRef.current) return;
        // Throttle: avoid repeated loadUserData when Supabase re-emits SIGNED_IN every few seconds
        const now = Date.now();
        if (lastLoadUserDataUserIdRef.current === session.user.id && now - lastLoadUserDataTimeRef.current < AUTH_LOAD_THROTTLE_MS) return;
        loadUserDataInProgressRef.current = true;
        lastLoadUserDataUserIdRef.current = session.user.id;
        lastLoadUserDataTimeRef.current = now;
        const shouldForceRefresh = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION';
        const runLoad = () => {
          loadUserData(session!.user, shouldForceRefresh, true)
            .then(() => console.log('✅ User data loaded from onAuthStateChange:', { event, userId: session!.user.id }))
            .catch((err) => console.error('Error loading user data in auth state change:', err))
            .finally(() => { loadUserDataInProgressRef.current = false; });
        };
        if (shouldForceRefresh) setTimeout(runLoad, 0);
        else runLoad();
      } else {
        // Session is null (signed out or invalid refresh token). Always reset so we don't show stale "logged in" state.
        // When refresh token is invalid, Supabase emits SIGNED_OUT then INITIAL_SESSION null – we must clear user.
        resetUserState();
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [loadUserData]); // Include loadUserData in dependencies

  // Check for upgrade success parameter and show UpgradeBenefitsModal
  // This must be after all state and function declarations
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const upgradeParam = searchParams.get('upgrade');
    const fromTier = searchParams.get('from') as SubscriptionTier | null;
    const toTier = searchParams.get('to') as SubscriptionTier | null;
    
    if (upgradeParam === 'success' && fromTier && toTier) {
      setUpgradeFromTier(fromTier);
      setUpgradeToTier(toTier);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_package_upgrade');
      }
      // Always show modal if upgrade param is present (even if tiers match - might be a refresh)
      // But only if we have valid tier info
      if (fromTier && toTier) {
        console.log('✅ Opening UpgradeBenefitsModal after payment');
        setShowUpgradeBenefitsModal(true);
        
        // Remove parameters from URL but keep _t for cache busting
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('upgrade');
        newSearchParams.delete('from');
        newSearchParams.delete('to');
        // Keep _t parameter for cache busting
        const newSearch = newSearchParams.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
        
        // IMMEDIATELY reload user data to update subscription state and profile
        // This ensures profile is loaded for track selection instantly
        if (user) {
          (async () => {
            try {
              console.log('🔄 Reloading user data IMMEDIATELY after upgrade modal opens');
              await loadUserData(user, true);
              console.log('✅ Subscription refreshed IMMEDIATELY after upgrade modal');
            } catch (e) {
              console.error('Error reloading user data after upgrade:', e);
            }
          })();
      } else {
          // If no user yet, wait a bit and try again
          setTimeout(async () => {
            try {
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (currentUser) {
                await loadUserData(currentUser, true);
              }
            } catch (e) {
              console.error('Error loading user data:', e);
            }
          }, 1000);
        }
      }
      
    }
  }, [location.search, user, profile, navigate, location.pathname, loadUserData]);

  // When not logged in and URL has ?redeem=CODE – open registration with coupon field (from "מימוש ההטבה" in email)
  useEffect(() => {
    if (loadingAuth || user) return;
    const searchParams = new URLSearchParams(location.search);
    const redeemCode = searchParams.get('redeem');
    if (!redeemCode?.trim()) return;
    setRedeemCodeFromUrl(redeemCode.trim());
    const pkg = searchParams.get('package');
    if (pkg && ['creator', 'pro', 'coach', 'coach-pro'].includes(pkg)) {
      setRedeemPackageFromUrl(pkg);
    } else {
      setRedeemPackageFromUrl(null);
    }
    setAuthModalMode('initial');
    setShowAuthModal(true);
    const next = new URLSearchParams(location.search);
    next.delete('redeem');
    next.delete('package');
    const q = next.toString();
    navigate(`${location.pathname}${q ? `?${q}` : ''}`, { replace: true });
  }, [loadingAuth, user, location.search, location.pathname, navigate]);

  // Redeem coupon from URL (?redeem=CODE) when user is logged in – from email or updates; first activation wins
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redeemCode = searchParams.get('redeem');
    if (!redeemCode?.trim() || !user?.id) return;

    (async () => {
      try {
        await redeemCoupon(redeemCode.trim(), user.id);
        alert(t('alerts.benefitRedeemed'));
        await loadUserData(user, true);
      } catch (err: any) {
        alert(err?.message || t('alerts.benefitRedeemFailed'));
      }
      const next = new URLSearchParams(location.search);
      next.delete('redeem');
      const q = next.toString();
      navigate(`${location.pathname}${q ? `?${q}` : ''}`, { replace: true });
    })();
  }, [location.search, user?.id, navigate, location.pathname, loadUserData]);

  // Set activeTrack from profile when profile loads (for all tiers)
  useEffect(() => {
    if (!profile?.selected_primary_track) return;
    
    const profileTrack = profile.selected_primary_track as TrackId;
    if (!profileTrack) return;
    
    // Always use the selected_primary_track from profile if it exists
    // This ensures users see their chosen track regardless of tier
    if (activeTrack !== profileTrack) {
      setActiveTrack(profileTrack);
    }
  }, [profile?.selected_primary_track]);

  useEffect(() => {
    const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
    
    // Safety check: ensure track exists and has experts
    if (!trackToUse || !EXPERTS_BY_TRACK[trackToUse] || EXPERTS_BY_TRACK[trackToUse].length === 0) {
      console.warn('⚠️ Track not found or has no experts:', trackToUse);
      return; // Don't reset selectedExperts if track is invalid
    }
    
    const maxExperts = getMaxExperts();
    const availableExperts = EXPERTS_BY_TRACK[trackToUse];
    const defaults = availableExperts.slice(0, Math.min(3, maxExperts)).map(e => e.title);
    
    // Only update if we have valid defaults (at least 3 experts or all available)
    if (defaults.length >= 3 || defaults.length === availableExperts.length) {
      setSelectedExperts(defaults);
    } else {
      // If we can't get 3 experts, keep current selection or use all available
      setSelectedExperts(prev => {
        // If current selection is valid for this track, keep it
        const validForTrack = prev.filter(e => availableExperts.some(exp => exp.title === e));
        if (validForTrack.length >= 3) {
          return validForTrack;
        }
        // Otherwise use all available experts
        return availableExperts.map(e => e.title);
      });
    }
  }, [activeTrack, coachTrainingTrack, subscription]);

  // Subscription is now managed via Supabase - no local sync needed

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

  // Helper function to get next tier in upgrade hierarchy
  const getNextTier = (currentTier: SubscriptionTier): SubscriptionTier | null => {
    const tierOrder: SubscriptionTier[] = ['free', 'creator', 'pro', 'coach', 'coach-pro'];
    const currentIndex = tierOrder.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null; // Already at highest tier or invalid tier
    }
    return tierOrder[currentIndex + 1];
  };

  // When user selects a plan in SubscriptionModal: if free→paid, open details form first; else run upgrade
  const onSelectPlanFromSubscriptionModal = (tier: SubscriptionTier, period: BillingPeriod) => {
    const isFreeToPaid = subscription?.tier === 'free' && tier !== 'free' && ['creator', 'pro', 'coach', 'coach-pro'].includes(tier);
    if (isFreeToPaid && user) {
      setShowSubscriptionModal(false);
      setAuthModalUpgradePackage(tier);
      setAuthModalMode('upgrade');
      setShowAuthModal(true);
      return;
    }
    handleSelectPlan(tier, period);
  };

  // Subscription Management Functions
  const handleSelectPlan = async (tier: SubscriptionTier, period: BillingPeriod) => {
    console.log('🔔 handleSelectPlan called:', { tier, period, user: user?.email, isUpdatingSubscription });
    
    if (!user) {
      alert(t('alerts.loginRequired'));
      setAuthModalMode('initial');
      setShowAuthModal(true);
      setShowSubscriptionModal(false);
      return;
    }

    // Prevent duplicate calls using both state and ref
    if (isUpdatingSubscription || updatingSubscriptionRef.current) {
      console.warn('⚠️ Subscription update already in progress, ignoring duplicate call', { 
        isUpdatingSubscription, 
        refValue: updatingSubscriptionRef.current 
      });
      return;
    }
    
    // Set flags immediately to prevent duplicate calls
    updatingSubscriptionRef.current = true;
    setIsUpdatingSubscription(true);

    const isPaidTier = tier !== 'free' && ['creator', 'pro', 'coach', 'coach-pro'].includes(tier);

    if (isPaidTier) {
      // Paid tier: redirect to TAKBUK payment flow
      try {
        const res = await fetch('/api/takbull/init-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            subscriptionTier: tier,
            billingPeriod: period,
          }),
        });
        const data = await res.json();
        if (!data.ok || !data.paymentUrl) {
          throw new Error(data.error || t('alerts.initPaymentFailed'));
        }
        setUpgradeFromTier(subscription?.tier || 'free');
        setUpgradeToTier(tier);
        setShowSubscriptionModal(false);
        navigate(
          '/payment-redirect?url=' + encodeURIComponent(data.paymentUrl) +
          '&ref=' + encodeURIComponent(data.orderReference || '')
        );
      } catch (err: any) {
        console.error('❌ TAKBUK init-order error:', err);
        alert(err.message || t('alerts.paymentPageError'));
      } finally {
        updatingSubscriptionRef.current = false;
        setIsUpdatingSubscription(false);
      }
      return;
    }

    // FREE tier only - update directly without payment
    try {
      console.log('🆓 Free tier selected, updating directly...');
      
      // Get plan from database
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', tier)
        .single();

      if (planError || !planData) {
        throw new Error('Plan not found');
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_period: period,
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          subscription_status: 'active',
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Save subscription to Supabase
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planData.id,
          status: 'active',
          billing_period: period,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        }, {
          onConflict: 'user_id,plan_id',
        });

      if (subError) {
        console.warn('Warning: Subscription table update failed:', subError);
      }

      // Update local state
      const newSubscription: UserSubscription = {
        tier,
        billingPeriod: period,
        startDate: now,
        endDate,
        usage: {
          analysesUsed: subscription?.usage.analysesUsed || 0,
          lastResetDate: now,
        },
        isActive: true,
      };

      setSubscription(newSubscription);
      setShowSubscriptionModal(false);
      
      // Reload user data
      if (user) {
        setTimeout(async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && currentUser.id === user.id) {
            await loadUserData(currentUser);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Error saving subscription (free tier):', error);
      alert(t('alerts.subscriptionSaveError'));
    } finally {
      updatingSubscriptionRef.current = false;
      setIsUpdatingSubscription(false);
    }
  };

  const checkSubscriptionLimits = async (): Promise<{ allowed: boolean; message?: string }> => {
    try {
      // CRITICAL: Check subscription status from profile FIRST (most reliable source)
      // Profile always has the latest subscription status, even if subscription object is not loaded
      let profileEndDate: Date | null = null;
      let profileIsActive = true;
      let profileTier: SubscriptionTier = 'free';
      
      if (profile) {
        profileTier = (profile.subscription_tier as SubscriptionTier) || 'free';
        // NOTE: profile_status משקף את מצב החיוב (חדש/השהה/בוטל),
        // אבל מבחינת גישה לניתוחים אנחנו רוצים לאפשר שימוש עד סוף התקופה/המכסה.
        // לכן לא נחסום רק על סמך subscription_status, אלא רק לפי תאריך סיום/מכסה.
        profileIsActive = profile.subscription_status === 'active';
        
        if (profile.subscription_end_date) {
          try {
            profileEndDate = new Date(profile.subscription_end_date);
            if (isNaN(profileEndDate.getTime())) {
              profileEndDate = null;
            }
          } catch (e) {
            profileEndDate = null;
          }
        }
      }
      
      // If no subscription object, use profile data
      const effectiveTier = subscription?.tier || profileTier || 'free';
      const effectiveSubscription = subscription || {
        tier: effectiveTier,
        billingPeriod: 'monthly' as BillingPeriod,
        startDate: new Date(),
        endDate: profileEndDate || new Date(),
        usage: { analysesUsed: 0, lastResetDate: new Date() },
        isActive: profileIsActive,
      };
      
      // Override with profile data if available (more reliable)
      if (profileEndDate) {
        effectiveSubscription.endDate = profileEndDate;
      }
      if (profile) {
        effectiveSubscription.isActive = profileIsActive;
      }

      const plan = SUBSCRIPTION_PLANS[effectiveTier as SubscriptionTier];
      if (!plan || !plan.limits) {
        console.error('❌ Invalid tier or missing plan limits:', effectiveTier);
        return { allowed: false, message: t('alerts.invalidPlan') };
      }
    
      // CRITICAL: Check if subscription has expired - applies to ALL tiers (free, creator, pro, coach, coach-pro)
      // This check must happen BEFORE usage checks to prevent analysis when subscription is expired
      // For ALL paid tiers (creator, pro, coach, coach-pro), check endDate and isActive
      // For free tier, also check endDate if it exists (trial period)
      if (effectiveTier !== 'free' || effectiveSubscription.endDate) {
        try {
          // במקום לחסום לפי isActive (שמשקף השהייה/ביטול), נאפשר שימוש
          // כל עוד התקופה/המכסה בתוקף, ונבדוק רק פקיעת תוקף לפי endDate.
          // Check endDate if it exists (for all tiers including free/trial)
          if (effectiveSubscription.endDate) {
            const endDate = effectiveSubscription.endDate instanceof Date 
              ? effectiveSubscription.endDate 
              : new Date(effectiveSubscription.endDate);
            // Validate date
            if (!isNaN(endDate.getTime())) {
              const now = new Date();
              // Check if subscription has expired
              if (now > endDate) {
                return { 
                  allowed: false, 
                  message: t('alerts.subscriptionExpiredBilling')
                };
              }
            }
          }
        } catch (error) {
          console.error('❌ Error checking subscription end date:', error);
          // If date parsing fails, continue to usage checks (don't block unnecessarily)
        }
      }

      // CRITICAL: Double-check subscription expiration from profile before allowing analysis
      // This ensures we catch expired subscriptions even if subscription object is stale
      if (profile && profile.subscription_end_date) {
        try {
          const profileEndDate = new Date(profile.subscription_end_date);
          if (!isNaN(profileEndDate.getTime())) {
            const now = new Date();
            if (now > profileEndDate) {
              // Subscription expired according to profile - block analysis
              return { 
                allowed: false, 
                message: t('alerts.subscriptionExpiredProfile')
              };
            }
          }
        } catch (e) {
          // Ignore date parsing errors
        }
      }
      
      // Get current usage from database (always fresh - counts by current month)
      // CRITICAL: If usage check fails, we still need to check subscription status
      // Don't allow analysis if subscription is expired, even if usage check fails
      let currentUsage;
      try {
        currentUsage = await getUsageForCurrentPeriod();
      } catch (error: any) {
        console.error('❌ Error getting usage:', error);
        // Don't return here - continue to check if subscription is expired
        // If subscription is expired, we should block even if usage check fails
        currentUsage = null;
      }
      
      // If usage check failed: for paid tiers allow (usage counted on save); for FREE tier must still check total count
      let analysesUsed = 0;
      let minutesUsed = 0;
      if (currentUsage) {
        analysesUsed = currentUsage.analysesUsed;
        minutesUsed = currentUsage.minutesUsed || 0;
      } else if (effectiveTier !== 'free') {
        return { allowed: true };
      }
      // For free tier with null currentUsage we continue to the free-tier block and check total count from DB
      const analysesLimit = plan.limits.maxAnalysesPerPeriod;
      const minutesLimit = plan.limits.maxVideoMinutesPerPeriod;

      // For coach/coach-pro: Check ONLY minutes (analyses are unlimited)
      // CRITICAL: Subscription end date and isActive already checked above for all tiers
      if (effectiveTier === 'coach' || effectiveTier === 'coach-pro') {
        if (minutesLimit === -1) {
          // Unlimited minutes too
          return { allowed: true };
        } else if (minutesUsed >= minutesLimit) {
          return { 
            allowed: false, 
            message: t('alerts.quotaExceeded')
          };
        }
        // Within minutes limit - allow (analyses are unlimited)
        return { allowed: true };
      }

      // For other tiers: Check BOTH analyses AND minutes - whichever comes first blocks
      // FREE tier: Only 1 analysis TOTAL (not monthly, not renewable)
      if (effectiveTier === 'free') {
        // For free tier, count ALL analyses ever made (not just current month)
        let totalAnalysesCount = 0;
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { count, error } = await supabase
              .from('analyses')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', currentUser.id);
            
            if (!error && count !== null && count !== undefined) {
              totalAnalysesCount = count;
            } else {
              // If count fails, assume limit reached so we block (show message) – safe default for free tier
              totalAnalysesCount = analysesLimit;
            }
          } else {
            totalAnalysesCount = analysesLimit;
          }
        } catch (error) {
          console.error('❌ Error counting analyses for free tier:', error);
          totalAnalysesCount = analysesLimit;
        }
        
        // CRITICAL: Block if user has already used their free analysis – show message, do not run analysis
        if (totalAnalysesCount >= analysesLimit) {
          return { 
            allowed: false, 
            message: t('alerts.trialFinished')
          };
        }
        return { allowed: true };
      }

      // For paid tiers (creator, pro): Check BOTH limits
      // CRITICAL: Subscription end date and isActive already checked above for all tiers
      // First check: analyses limit
      if (analysesLimit !== -1 && analysesUsed >= analysesLimit) {
        return { 
          allowed: false, 
          message: 'סיימת את מכסת הניתוחים בחבילה הנוכחית. כדי להמשיך לנתח, מומלץ לשדרג חבילה או להמתין שהמכסה תתחדש.' 
        };
      }

      // Second check: minutes limit
      if (minutesLimit !== -1 && minutesUsed >= minutesLimit) {
        return { 
          allowed: false, 
          message: 'סיימת את מכסת הניתוחים בחבילה הנוכחית. כדי להמשיך לנתח, מומלץ לשדרג חבילה או להמתין שהמכסה תתחדש.' 
        };
      }

      // Both limits OK
      return { allowed: true };
    } catch (error) {
      console.error('❌ Error in checkSubscriptionLimits:', error);
      // CRITICAL: If check fails, block analysis to prevent unauthorized usage
      // Better to block than allow unauthorized analysis
      return { 
        allowed: false, 
        message: t('alerts.subscriptionCheckError')
      };
    }
  };

  const incrementUsage = async () => {
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
  };

  const canUseFeature = (feature: keyof SubscriptionLimits['features']): boolean => {
    // Admin gets all features
    if (userIsAdmin) return true;
    if (!subscription) return false;
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    return plan.limits.features[feature];
  };

  // Check if a track is available for the current user (for usage, not display)
  const isTrackAvailable = (trackId: TrackId): boolean => {
    // If no user logged in, allow viewing but not using
    if (!user) return false;
    
    // Admin gets all tracks
    if (userIsAdmin) return true;
    
    // If profile or subscription haven't loaded yet, show restrictions (don't allow access)
    // This prevents showing all tracks as available before data loads
    if (!profile || !subscription) {
      return false; // Show restrictions until data is loaded
    }

    // Coach track always requires traineeManagement feature
    if (trackId === 'coach') {
      return canUseFeature('traineeManagement');
    }

    const tier = subscription.tier;

    // Free tier: only selected_primary_track is available
    if (tier === 'free') {
      // Check if trackId matches the selected_primary_track from profile
      const primaryTrack = profile.selected_primary_track as TrackId;
      return trackId === primaryTrack;
    }

    // Creator tier: up to 2 tracks from selected_tracks array
    if (tier === 'creator') {
      const selectedTracks = profile.selected_tracks || [];
      return selectedTracks.includes(trackId);
    }

    // Pro and Coach tiers: all tracks available (except coach requires feature)
    return true;
  };
  
  // Check if track should show premium badge/opacity (only for logged in users)
  const shouldShowTrackRestrictions = (trackId: TrackId): boolean => {
    // Don't show restrictions if user is not logged in
    if (!user) return false;
    
    // Admin has no restrictions
    if (userIsAdmin) return false;
    
    return !isTrackAvailable(trackId);
  };

  // Get available tracks for current user
  const getAvailableTracks = (): TrackId[] => {
    if (!profile || !subscription) return [];
    
    const tier = subscription.tier;
    
    if (tier === 'free') {
      return profile.selected_primary_track ? [profile.selected_primary_track as TrackId] : [];
    }
    
    if (tier === 'creator') {
      return (profile.selected_tracks || []) as TrackId[];
    }
    
    // Pro and Coach: all tracks (except coach if no feature)
    const allTracks: TrackId[] = ['actors', 'musicians', 'creators', 'influencers'];
    if (canUseFeature('traineeManagement')) {
      allTracks.push('coach');
    }
    return allTracks;
  };

  // Get max number of experts allowed for current subscription
  const getMaxExperts = (): number => {
    // Admin gets 8 experts
    if (userIsAdmin) return 8;
    if (!subscription) return 3; // Default to 3 for free
    if (subscription.tier === 'free') return 3;
    // Creator, Pro, Coach all get 8 experts
    return 8;
  };

  const handleTrackChange = (id: string) => {
    // Always allow switching tracks for browsing - users can see all tracks but usage is blocked
    const trackId = id as TrackId;
    setActiveTrack(trackId);
    setResult(null);
    setPreviousResult(null);
    setIsImprovementMode(false);
    // Sync modal tab with active track if possible
    if (['actors', 'musicians', 'creators', 'influencers', 'coach'].includes(id)) {
        setModalTab(id === 'coach' ? 'creators' : id);
    }
    // Reset coach training track when switching to coach mode
    if (id === 'coach') {
      // Don't auto-open dashboard, let user choose when to open it
    }
  };

  const toggleExpert = (title: string) => {
    const maxExperts = getMaxExperts();
    setSelectedExperts(prev => {
      if (prev.includes(title)) {
        return prev.filter(t => t !== title);
      } else {
        if (prev.length >= maxExperts) {
          alert(t('alerts.maxExperts', { max: maxExperts }));
          setShowSubscriptionModal(true);
          return prev;
        }
        return [...prev, title];
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxFileBytes = getMaxFileBytes(activeTrack, subscription || undefined);
    const maxVideoSeconds = getMaxVideoSeconds(activeTrack, subscription || undefined);
    const limitText = getUploadLimitText(activeTrack, subscription || undefined);

    if (selectedFile.size > maxFileBytes) {
      const actualMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      alert(t('alerts.fileTooLarge', { mb: actualMb }));
      resetInput();
      return;
    }
      
      const objectUrl = URL.createObjectURL(selectedFile);
      
    const finalizeSelection = () => {
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
      // שמירת מזהה קובץ לזיהוי סרטון זהה
      setFileIdentifier(`${selectedFile.name}_${selectedFile.size}`);
      if (!isImprovementMode) {
        setResult(null);
      }
    };

    if (selectedFile.type.startsWith('video')) {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = objectUrl;

      videoEl.onloadedmetadata = () => {
        if (videoEl.duration > maxVideoSeconds) {
          const durationSeconds = Math.round(videoEl.duration);
          alert(t('alerts.videoTooLong', { seconds: durationSeconds }));
          URL.revokeObjectURL(objectUrl);
          resetInput();
          return;
        }
        finalizeSelection();
      };

      videoEl.onerror = () => {
        alert(t('alerts.videoMetadataError'));
        URL.revokeObjectURL(objectUrl);
        resetInput();
      };
    } else {
      finalizeSelection();
    }
  };
  
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    setPreviewUrl(null);
    setFileIdentifier(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedPdf = e.target.files[0];
      if (selectedPdf.type === 'application/pdf') {
        setPdfFile(selectedPdf);
      } else {
        alert(t('alerts.pdfOnly'));
      }
    }
  };

  const handleRemovePdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleReset = () => {
    setFile(null);
    setPdfFile(null);
    setPreviewUrl(null);
    setFileIdentifier(null);
    setPrompt('');
    setResult(null);
    setPreviousResult(null);
    setIsImprovementMode(false);
    setSelectedTrainee(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  
  const handleSaveAnalysis = async () => {
    if (!result || !user) return;
    
    // Prevent double-click or multiple calls
    if (isSavingAnalysis) {
      console.warn('Analysis save already in progress, ignoring duplicate call');
      return;
    }

    // Check if analysis was already saved automatically after completion
    // If it was, just reload the analyses list and show success message
    if (file) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Check for analysis saved in the last 2 minutes with same file size and track
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: existingAnalysis } = await supabase
          .from('analyses')
          .select('id, created_at, result')
          .eq('user_id', currentUser.id)
          .eq('track', activeTrack)
          .gte('created_at', twoMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (existingAnalysis) {
          // Check if the result matches (same analysis)
          const existingFileSize = existingAnalysis.result?.metadata?.file_size || existingAnalysis.result?.metadata?.fileSize;
          if (existingFileSize === file.size) {
            // Analysis already saved - just reload and show message
            console.log('✅ Analysis already saved automatically, reloading...');
            const updatedAnalyses = await getAnalyses(activeTrack === 'coach' ? selectedTrainee || undefined : undefined);
            const mappedAnalyses = updatedAnalyses.map(a => {
              const traineeForAnalysis = trainees.find(t => t.id === a.trainee_id);
              return {
                id: a.id,
                videoName: a.video_id ? (file?.name || 'ניתוח ללא קובץ') : 'ניתוח ללא קובץ',
                videoUrl: previewUrl || '',
                traineeId: a.trainee_id || undefined,
                traineeName: traineeForAnalysis?.name,
                analysisDate: new Date(a.created_at),
                result: a.result,
                averageScore: a.average_score,
                track: a.track as TrackId,
                metadata: {
                  prompt: a.prompt || undefined,
                },
              };
            });
            const uniqueAnalyses = Array.from(
              new Map(mappedAnalyses.map(a => [a.id, a])).values()
            );
            setSavedAnalyses(uniqueAnalyses);
            alert(t('alerts.analysisAlreadySaved'));
            return;
          }
        }
      }
    }

    if (activeTrack === 'coach' && !selectedTrainee) {
      alert(t('alerts.selectTraineeFirst'));
      setShowCoachDashboard(true);
      return;
    }

    setIsSavingAnalysis(true);
    
    // CRITICAL: Add safety timeout to ensure isSavingAnalysis is reset if something goes wrong
    // This prevents the button from getting stuck in saving state
    let savingTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      console.warn('⚠️ Saving timeout - resetting isSavingAnalysis state');
      setIsSavingAnalysis(false);
    }, 120000); // 2 minutes max - should never take this long
    
    try {
      // Save video if exists (only when saving analysis, not before)
      // If same file was uploaded before, reuse existing video record
      let videoId: string | null = null;

      if (file) {
        try {
          // First, check if video with same file_size already exists (same file uploaded twice)
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: existingVideo } = await supabase
              .from('videos')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('file_size', file.size)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingVideo) {
              // Reuse existing video record (same file, no need to save twice)
              videoId = existingVideo.id;
              console.log('✅ Reusing existing video record (same file_size):', videoId);
            } else {
              // New file - upload and save
              const uploadResult = await uploadVideo(file, currentUser.id);
              
              // Get video duration
              let duration: number | null = null;
              if (file.type.startsWith('video')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = previewUrl || '';
                await new Promise((resolve) => {
                  video.onloadedmetadata = () => {
                    duration = Math.round(video.duration);
                    resolve(null);
                  };
                });
              }

              // Save video to database
              const videoData = await saveVideoToDatabase({
                file_name: file.name,
                file_path: uploadResult.path,
                file_size: file.size,
                duration_seconds: duration,
                mime_type: file.type,
              });
              
              videoId = videoData.id;
              console.log('✅ Saved new video to database:', videoId);
            }
          }
        } catch (error) {
          console.error('Error saving video:', error);
          // Continue without video ID
        }
      }

      // Save analysis to Supabase
      // Include file_size in result metadata for duplicate detection - CRITICAL
      const resultWithMetadata = {
        ...result,
        metadata: {
          ...(result.metadata || {}),
          fileSize: file?.size || null,
          file_size: file?.size || null, // Also store as file_size for compatibility
          fileName: file?.name || null,
          file_name: file?.name || null, // Also store as file_name for compatibility
        }
      };
      
      const analysisData = await saveAnalysis({
        video_id: videoId || undefined,
        trainee_id: activeTrack === 'coach' ? selectedTrainee || undefined : undefined,
        track: activeTrack,
        coach_training_track: activeTrack === 'coach' ? coachTrainingTrack : undefined,
        analysis_depth: activeTrack === 'coach' ? analysisDepth : undefined,
        expert_panel: selectedExperts,
        prompt: prompt || undefined,
        result: resultWithMetadata,
        average_score: averageScore,
      });

      // Update local state
      const trainee = trainees.find(t => t.id === selectedTrainee);
      const savedAnalysis: SavedAnalysis = {
        id: analysisData.id,
        videoName: file?.name || 'ניתוח ללא קובץ',
        videoUrl: previewUrl || '',
        traineeId: selectedTrainee || undefined,
        traineeName: trainee?.name,
        analysisDate: new Date(analysisData.created_at),
        result: result,
        averageScore: averageScore,
        track: activeTrack,
        metadata: {
          duration: undefined,
          fileSize: file?.size,
          prompt: prompt || undefined
        }
      };

      // Don't add to state here - reload from Supabase to ensure consistency
      alert(t('alerts.analysisSavedSuccess') + (trainee ? ` ${t('alerts.forTrainee', { name: trainee.name })}` : ''));
      
      // Reload analyses from Supabase to get the latest data
      if (user) {
        try {
          const updatedAnalyses = await getAnalyses(activeTrack === 'coach' ? selectedTrainee || undefined : undefined);
          
          // Map analyses and resolve trainee names
          const mappedAnalyses = updatedAnalyses.map(a => {
            const traineeForAnalysis = trainees.find(t => t.id === a.trainee_id);
            return {
              id: a.id,
              videoName: a.video_id ? (file?.name || 'ניתוח ללא קובץ') : 'ניתוח ללא קובץ',
              videoUrl: previewUrl || '',
              traineeId: a.trainee_id || undefined,
              traineeName: traineeForAnalysis?.name,
              analysisDate: new Date(a.created_at),
              result: a.result,
              averageScore: a.average_score,
              track: a.track as TrackId,
              metadata: {
                prompt: a.prompt || undefined,
              },
            };
          });
          
          // Remove duplicates by ID (in case of any race conditions)
          const uniqueAnalyses = Array.from(
            new Map(mappedAnalyses.map(a => [a.id, a])).values()
          );
          
          setSavedAnalyses(uniqueAnalyses);
          
          // Update usage IMMEDIATELY after saving analysis - CRITICAL for accurate counter
          // First, optimistically update local state
          setUsage(prev => prev ? {
            ...prev,
            analysesUsed: prev.analysesUsed + 1,
          } : null);
          setSubscription(prev => prev ? {
            ...prev,
            usage: {
              analysesUsed: (prev.usage.analysesUsed || 0) + 1,
              lastResetDate: prev.usage.lastResetDate,
            },
          } : null);
          
          // Then refresh from database to get accurate count (with retries)
          // CRITICAL: This must work reliably for usage tracking (both analyses and minutes)
          const updateUsageFromDB = async (retryCount = 0): Promise<void> => {
            try {
              // Wait longer for database to commit (especially important for video duration to be saved)
              await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 300)));
              const updatedUsage = await getUsageForCurrentPeriod();
              if (updatedUsage) {
                setUsage(updatedUsage); // This includes both analysesUsed and minutesUsed
                // Also update subscription state with usage (analyses only - minutes are in usage state)
                setSubscription(prev => prev ? {
                  ...prev,
                  usage: {
                    analysesUsed: updatedUsage.analysesUsed,
                    lastResetDate: updatedUsage.periodStart,
                  },
                } : null);
                console.log('✅ Usage updated from database:', { analysesUsed: updatedUsage.analysesUsed, minutesUsed: updatedUsage.minutesUsed, retryCount });
              } else {
                // If no usage data, retry
                if (retryCount < 5) {
                  await updateUsageFromDB(retryCount + 1);
                } else {
                  console.error('❌ Failed to get usage after 5 retries');
                }
              }
            } catch (usageError) {
              console.error('❌ Error updating usage from DB:', usageError);
              // Retry up to 5 times with exponential backoff
              if (retryCount < 5) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
                await updateUsageFromDB(retryCount + 1);
              } else {
                console.error('❌ Failed to update usage after 5 retries');
              }
            }
          };
          
          // Start update immediately (don't await - let it run in background)
          updateUsageFromDB().catch(err => console.error('❌ updateUsageFromDB failed:', err));
          
          // Notify other tabs/components that analysis was saved
          // CRITICAL: Wait for usage update to complete before notifying
          try {
            // Wait a bit more to ensure usage update is complete
            await new Promise(resolve => setTimeout(resolve, 500));
            localStorage.setItem('analysis_saved', Date.now().toString());
            // Trigger custom event for same-tab listeners
            window.dispatchEvent(new CustomEvent('analysis_saved'));
            // Trigger storage event for cross-tab listeners
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'analysis_saved',
              newValue: Date.now().toString()
            }));
          } catch (e) {
            // Ignore localStorage errors
          }
        } catch (reloadError) {
          console.error('Error reloading analyses:', reloadError);
          // Fallback: add the saved analysis to state if reload fails
          setSavedAnalyses(prev => {
            // Check if already exists to prevent duplicates
            if (prev.some(a => a.id === savedAnalysis.id)) {
              return prev;
            }
            return [...prev, savedAnalysis];
          });
          
          // Still try to update usage even if reload fails - CRITICAL
          // First, optimistically update local state
          setUsage(prev => prev ? {
            ...prev,
            analysesUsed: prev.analysesUsed + 1,
          } : null);
          setSubscription(prev => prev ? {
            ...prev,
            usage: {
              analysesUsed: (prev.usage.analysesUsed || 0) + 1,
              lastResetDate: prev.usage.lastResetDate,
            },
          } : null);
          
          // Then refresh from database (with proper retry logic)
          // CRITICAL: This must work reliably for usage tracking (both analyses and minutes)
          const updateUsageFromDB = async (retryCount = 0): Promise<void> => {
            try {
              // Wait longer for database to commit (especially important for video duration to be saved)
              await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 300)));
              const updatedUsage = await getUsageForCurrentPeriod();
              if (updatedUsage) {
                setUsage(updatedUsage); // This includes both analysesUsed and minutesUsed
                setSubscription(prev => prev ? {
                  ...prev,
                  usage: {
                    analysesUsed: updatedUsage.analysesUsed,
                    lastResetDate: updatedUsage.periodStart,
                  },
                } : null);
                console.log('✅ Usage updated from database (fallback):', { analysesUsed: updatedUsage.analysesUsed, minutesUsed: updatedUsage.minutesUsed, retryCount });
              } else {
                // If no usage data, retry
                if (retryCount < 5) {
                  await updateUsageFromDB(retryCount + 1);
                } else {
                  console.error('❌ Failed to get usage after 5 retries (fallback)');
                }
              }
            } catch (usageError) {
              console.error('❌ Error updating usage from DB (fallback):', usageError);
              // Retry up to 5 times with exponential backoff
              if (retryCount < 5) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
                await updateUsageFromDB(retryCount + 1);
              } else {
                console.error('❌ Failed to update usage after 5 retries (fallback)');
              }
            }
          };
          
          // Start update immediately (don't await - let it run in background)
          updateUsageFromDB().catch(err => console.error('❌ updateUsageFromDB failed (fallback):', err));
          
          // Notify other tabs/components that analysis was saved
          // CRITICAL: Wait for usage update to complete before notifying
          try {
            // Wait a bit more to ensure usage update is complete
            await new Promise(resolve => setTimeout(resolve, 500));
            localStorage.setItem('analysis_saved', Date.now().toString());
            // Trigger custom event for same-tab listeners
            window.dispatchEvent(new CustomEvent('analysis_saved'));
            // Trigger storage event for cross-tab listeners
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'analysis_saved',
              newValue: Date.now().toString()
            }));
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert(t('alerts.analysisSaveError'));
    } finally {
      // CRITICAL: Always reset saving state, even on error
      if (savingTimeout) {
        clearTimeout(savingTimeout);
        savingTimeout = null;
      }
      setIsSavingAnalysis(false);
    }
  };

  const handleUploadImprovedTake = () => {
    if (result) {
      setPreviousResult(result);
    }
    setResult(null);
    setIsImprovementMode(true);
    setFile(null);
    setPreviewUrl(null);
    // Keep PDF if uploaded, or clear it? Let's keep it as it might be relevant.
    setPrompt(''); 
    
    setTimeout(() => {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
      fileInputRef.current?.click();
    }, 100);
  };

  const handleExportCoachReport = (traineeId: string) => {
    const trainee = trainees.find(t => t.id === traineeId);
    if (!trainee) {
      alert(t('alerts.traineeNotFound'));
      return;
    }

    const traineeAnalyses = savedAnalyses
      .filter(a => a.traineeId === traineeId)
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime());

    if (traineeAnalyses.length === 0) {
      alert(t('alerts.noAnalysesForTrainee'));
      return;
    }

    // Calculate trends
    const firstAnalysis = traineeAnalyses[0];
    const lastAnalysis = traineeAnalyses[traineeAnalyses.length - 1];
    const scoreChange = lastAnalysis.averageScore - firstAnalysis.averageScore;
    const isImproving = scoreChange > 0;

    // Calculate average scores per expert
    const expertAverages: Record<string, number[]> = {};
    traineeAnalyses.forEach(analysis => {
      analysis.result.expertAnalysis?.forEach(expert => {
        if (!expertAverages[expert.role]) {
          expertAverages[expert.role] = [];
        }
        expertAverages[expert.role].push(expert.score);
      });
    });

    const expertTrends = Object.entries(expertAverages).map(([role, scores]) => ({
      role,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      improvement: scores[scores.length - 1] - scores[0],
      scores
    }));

    // Generate report HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(t('alerts.popupBlocked'));
      return;
    }

    const styles = `
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        direction: rtl;
        font-family: 'Assistant', sans-serif;
        background: #ffffff !important;
        color: #333333 !important;
        padding: 32px 32px 40px 32px;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Frank Ruhl Libre', serif;
        color: #b8862e !important;
        margin: 0 0 15px;
      }
      .report-wrapper { max-width: 1000px; margin: 0 auto; }
      .report-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
        border-bottom: 2px solid #b8862e;
        padding-bottom: 20px;
      }
      .report-header-text {
        text-align: right;
        flex: 1;
        margin-right: 20px;
      }
      .report-header h1 {
        margin: 0 0 10px;
        font-size: 2rem;
      }
      .report-header .subtitle {
        color: #666;
        font-size: 1rem;
      }
      .report-logo-left img {
        max-width: 120px;
        height: auto;
      }
      .trainee-info {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }
      .trainee-info h3 {
        margin-top: 0;
      }
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      .stat-box {
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }
      .stat-box .number {
        font-size: 2rem;
        font-weight: 800;
        color: #b8862e;
        display: block;
      }
      .stat-box .label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 5px;
      }
      .analysis-card {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .analysis-card h4 {
        color: #b8862e;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .expert-row {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px dashed #ddd;
      }
      .expert-row:last-child {
        border-bottom: none;
      }
      .expert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .expert-name {
        font-weight: 700;
        color: #333;
      }
      .expert-score {
        background: #b8862e;
        color: #fff;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 700;
      }
      .expert-text {
        color: #444;
        font-size: 0.9rem;
        line-height: 1.6;
        margin-top: 8px;
      }
      .trends-section {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin: 30px 0;
      }
      .trend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      .trend-item:last-child {
        border-bottom: none;
      }
      .improvement {
        color: #4CAF50;
        font-weight: 700;
      }
      .decline {
        color: #f44336;
        font-weight: 700;
      }
      a, button { display: none !important; }
      ul { padding-right: 20px; margin: 0; }
      li { margin-bottom: 8px; }
    `;

    const analysesHTML = traineeAnalyses.map((analysis, idx) => {
      const date = new Date(analysis.analysisDate).toLocaleDateString('he-IL');
      const expertsHTML = analysis.result.expertAnalysis?.map(expert => `
        <div class="expert-row">
          <div class="expert-header">
            <span class="expert-name">${expert.role}</span>
            <span class="expert-score">${expert.score}</span>
          </div>
          <div class="expert-text">
            <strong>ניתוח:</strong> ${expert.insight}<br/>
            <strong>טיפים:</strong> ${expert.tips}
          </div>
        </div>
      `).join('') || '';

      return `
        <div class="analysis-card">
          <h4>ניתוח #${idx + 1} - ${date}</h4>
          <div style="margin-bottom: 15px;">
            <strong>קובץ:</strong> ${analysis.videoName}<br/>
            <strong>ציון ממוצע:</strong> <span style="font-size: 1.2rem; font-weight: 700; color: #b8862e;">${analysis.averageScore}</span>
          </div>
          ${analysis.result.hook ? `<div style="background: #fff9e6; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-right: 4px solid #b8862e;"><strong>טיפ זהב:</strong> "${analysis.result.hook}"</div>` : ''}
          ${expertsHTML}
          ${analysis.result.committee ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd;">
              <strong>סיכום ועדת המומחים:</strong><br/>
              ${analysis.result.committee.summary}
              ${analysis.result.committee.finalTips && analysis.result.committee.finalTips.length > 0 ? `
                <ul style="margin-top: 10px;">
                  ${analysis.result.committee.finalTips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const trendsHTML = expertTrends.map(trend => `
      <div class="trend-item">
        <span>${trend.role}</span>
        <span>
          ממוצע: <strong>${trend.average.toFixed(1)}</strong>
          ${trend.improvement !== 0 ? ` | ${trend.improvement > 0 ? '<span class="improvement">↑ +' : '<span class="decline">↓ '}${trend.improvement.toFixed(1)}</span>` : ''}
        </span>
      </div>
    `).join('');

    printWindow.document.open();
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>דוח מתאמן - ${trainee.name}</title>
        </head>
        <body>
          <div class="report-wrapper">
            <div class="report-header">
              <div class="report-header-text">
                <h1>דוח מתאמן מקצועי</h1>
                <div class="subtitle">${trainee.name} | ${new Date().toLocaleDateString('he-IL')}</div>
              </div>
              <div class="report-logo-left">
                <img src="${window.location.origin}/Logo.png" alt="Viraly Logo" />
              </div>
            </div>

            <div class="trainee-info">
              <h3>פרטי המתאמן</h3>
              <p><strong>שם:</strong> ${trainee.name}</p>
              ${trainee.email ? `<p><strong>אימייל:</strong> ${trainee.email}</p>` : ''}
              ${trainee.phone ? `<p><strong>טלפון:</strong> ${trainee.phone}</p>` : ''}
              ${trainee.notes ? `<p><strong>הערות:</strong> ${trainee.notes}</p>` : ''}
            </div>

            <div class="summary-stats">
              <div class="stat-box">
                <span class="number">${traineeAnalyses.length}</span>
                <span class="label">סך ניתוחים</span>
              </div>
              <div class="stat-box">
                <span class="number">${firstAnalysis.averageScore}</span>
                <span class="label">ציון ראשון</span>
              </div>
              <div class="stat-box">
                <span class="number">${lastAnalysis.averageScore}</span>
                <span class="label">ציון אחרון</span>
              </div>
              <div class="stat-box">
                <span class="number ${isImproving ? 'improvement' : 'decline'}">${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)}</span>
                <span class="label">שינוי כולל</span>
              </div>
            </div>

            ${expertTrends.length > 0 ? `
              <div class="trends-section">
                <h3>מגמות לפי מומחה</h3>
                ${trendsHTML}
              </div>
            ` : ''}

            <h2>פירוט ניתוחים</h2>
            ${analysesHTML}
          </div>
        </body>
      </html>
    `);

    const styleTag = printWindow.document.createElement('style');
    styleTag.textContent = styles;
    printWindow.document.head.appendChild(styleTag);
    printWindow.document.close();

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportPdf = () => {
    if (!result) return;

    if (!canUseFeature('pdfExport')) {
      alert(t('alerts.pdfSubscriptionOnly'));
      setShowSubscriptionModal(true);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert(t('alerts.allowPopupsForPdf'));
      return;
    }

    // Build HTML content directly from result object to ensure all data is included
    const buildAnalysisHTML = () => {
      let html = '';

      // Hook (Golden Tip) – קטע ראשון, בלי העברה לדף
      if (result.hook) {
        html += `<div class="pdf-section">`;
        html += `
          <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-right: 4px solid #b8862e; page-break-inside: avoid; break-inside: avoid;">
            <h3 style="color: #b8862e; margin: 0 0 10px 0; font-size: 1.2rem;">✨ ${t('analysis.goldenTipTitle')}</h3>
            <p style="margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.6;">"${result.hook}"</p>
          </div>
        `;
        html += '</div>';
      }

      // Expert Analysis – זורם אחרי טיפ הזהב (דף 1 מלא), בלי דף ריק
      if (result.expertAnalysis && result.expertAnalysis.length > 0) {
        html += '<div class="pdf-section">';
        html += `<h3 class="section-title">${t('analysis.expertPanel')}</h3>`;
        html += '<div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 25px;">';
        
        result.expertAnalysis.forEach((expert) => {
          html += `
            <div class="pdf-expert-card">
              <div class="card">
                <h4 class="pdf-expert-role">${expert.role}<span class="score-badge">${expert.score}</span></h4>
                <div class="pdf-professional-block">
                  <strong class="subtle-label">${t('analysis.professionalView')}:</strong>
                  <p>${expert.insight}</p>
                </div>
                <div class="pdf-tips-block">
                  <strong class="subtle-label">${t('analysis.improvementTips')}:</strong>
                  <p>${expert.tips}</p>
                </div>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
        html += '</div>';
      }

      // Committee Summary – זורם אחרי הפאנל (מלא דפים, בלי דף ריק)
      if (result.committee) {
        html += '<div class="pdf-section">';
        html += `<h3 class="section-title">${t('analysis.committeeSummary')}</h3>`;
        html += '<div class="card pdf-committee-summary-card">';
        html += `<p>${result.committee.summary}</p>`;
        html += '</div>';

        // בלוק סיום: טיפים מנצחים + הצעות לשיפור + ציון – נשארים יחד כדי למנוע דף אחרון ריק
        html += '<div class="pdf-final-block">';
        if (result.committee.finalTips && result.committee.finalTips.length > 0) {
          html += `
            <div data-pdf="committee-tips">
              <h5>${t('analysis.winningTips')}</h5>
              <ul>
                ${result.committee.finalTips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        if (result.takeRecommendation) {
          const recText = result.takeRecommendation.toLowerCase();
          const hasRetake = recText.includes('טייק נוסף') || 
                           recText.includes('טייק חוזר') || 
                           recText.includes('retake') ||
                           recText.includes('another take') ||
                           recText.includes('מומלץ לבצע') ||
                           recText.includes('מומלץ טייק') ||
                           recText.includes('need improvement') ||
                           recText.includes('recommended');
          const isReady = !hasRetake && (
            recText.includes('ready') || 
            recText.includes('מוכן') || 
            recText.includes('להגיש') ||
            recText.includes('ניתן') ||
            recText.includes('ready to submit') ||
            recText.includes('submit') ||
            recText.includes('approve')
          );
          const recommendationColor = isReady ? '#4CAF50' : '#FF9800';
          html += `
            <div class="card pdf-recommendation-card" style="border-right: 4px solid ${recommendationColor}; background: ${isReady ? '#f1f8f4' : '#fff8f0'};">
              <h4 style="color: ${recommendationColor};">
                ${isReady ? '✅ ' + t('analysis.readyToSubmit') : '💡 ' + t('analysis.suggestionsForImprovement')}
              </h4>
              <p>${result.takeRecommendation}</p>
            </div>
          `;
        }
        html += `
          <div data-pdf="final-score">
            <span class="number">${averageScore}</span>
            <span class="label">${t('analysis.viralScoreLabel')}</span>
          </div>
        `;
        html += '</div>';
        html += '</div>';
      } else {
        html += '<div class="pdf-section"><div class="pdf-final-block">';
        html += `<div data-pdf="final-score"><span class="number">${averageScore}</span><span class="label">${t('analysis.viralScoreLabel')}</span></div>`;
        html += '</div></div>';
      }

      return html;
    };

    const styles = `
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
      }
      body { 
        direction: rtl; 
        font-family: 'Assistant', sans-serif; 
        background: #ffffff !important; 
        color: #1a1a1a !important; 
        padding: 36px 42px 48px 42px;
      }
      h1,h2,h3,h4,h5,h6 {
        font-family: 'Frank Ruhl Libre', serif;
        color: #b8862e !important;
        margin: 0 0 12px;
        letter-spacing: 0.5px;
      }
      p, li, span, div {
        color: #2b2b2b;
        line-height: 1.6;
      }
      /* Prevent breaking inside paragraphs - ensure at least 3 lines before breaking */
      p {
        orphans: 3;
        widows: 3;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      li {
        orphans: 2;
        widows: 2;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .export-wrapper { max-width: 1040px; margin: 0 auto; }
      .export-header { 
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px; 
        border-bottom: 2px solid #e6e6e6;
        padding-bottom: 14px;
      }
      .export-header-text {
        text-align: right;
        flex: 1;
        margin-right: 16px;
      }
      .export-note { color: #666; font-size: 11px; margin-top: 4px; }
      .export-logo-left {
        flex: 0 0 auto;
      }
      .export-logo-left img {
        max-width: 140px;
        height: auto;
        object-fit: contain;
      }
      .export-wrapper > * + * {
        margin-top: 18px;
      }
      /* עדיפות: דפים מלאים מהראשון לאחרון (עדיפות פחותה לעמוד האחרון). גלישת תוכן חופשית בין קטעים; מקטעים לוגיים נשארים שלמים. */
      .pdf-section {
        page-break-inside: auto;
        break-inside: auto;
      }
      .pdf-section-new-page {
        page-break-before: always;
        break-before: page;
      }
      /* ציון סופי נשאר עם התוכן הקודם – מונע דף ריק עם רק משפט/מספר */
      .pdf-keep-with-previous {
        page-break-before: avoid;
        break-before: avoid;
      }
      /* ברירת מחדל: למלא עמודים – גלישה בין מקטעים. מקטע שלם = יחידה לוגית (כותרת+תוכן) לא נחתכת. */
      /* כרטיס מומחה: מותר לשבור בין זווית מקצועית לטיפים כדי למלא עמודים; אסור לשבור בתוך מקטע. */
      .pdf-expert-card {
        page-break-inside: auto;
        break-inside: auto;
      }
      .pdf-expert-card .card {
        margin-bottom: 14px;
        page-break-inside: auto;
        break-inside: auto;
      }
      .pdf-expert-role {
        color: #b8862e !important;
        margin: 0 0 15px 0 !important;
        padding-bottom: 10px !important;
        border-bottom: 1px solid #e6e6e6 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      /* זווית מקצועית – מקטע שלם: כותרת + פסקה ביחד, לא לחתוך באמצע */
      .pdf-professional-block {
        margin-bottom: 15px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .pdf-professional-block .subtle-label { display: block; margin-bottom: 8px; }
      .pdf-professional-block p { margin: 0; line-height: 1.7; orphans: 3; widows: 3; }
      /* טיפים לשיפור – מקטע שלם: כותרת + תוכן ביחד, לא לחתוך באמצע */
      .pdf-tips-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .pdf-tips-block .subtle-label { display: block; margin-bottom: 8px; }
      .pdf-tips-block p { margin: 0; line-height: 1.7; font-weight: 500; orphans: 3; widows: 3; }
      /* בלוק סיום: גלישה מותרת כדי למלא עמודים; בעמוד האחרון הדפדפן ישאף מעבר הגיוני. */
      .pdf-final-block {
        page-break-inside: auto;
        break-inside: auto;
      }
      .pdf-committee-summary-card { margin-bottom: 20px; }
      .pdf-committee-summary-card p,
      .pdf-recommendation-card p { margin: 0; line-height: 1.7; font-size: 1.05rem; color: #2b2b2b; font-weight: 500; }
      .pdf-recommendation-card { margin-bottom: 20px; }
      .pdf-recommendation-card h4 { margin: 0 0 12px 0; font-size: 1.15rem; font-weight: 700; }
      /* כותרת קטע: נשארת עם התוכן הקודם (דף 1 = טיפ זהב + כותרת פאנל), תוכן הקטע יכול להתחיל בדף הבא */
      .section-title {
        margin: 18px 0 10px;
        padding: 8px 12px;
        background: #fff7e6;
        border: 1px solid #f1e0c3;
        border-radius: 8px;
        color: #b0751f;
        font-weight: 800;
        page-break-before: avoid;
        break-before: avoid;
        page-break-after: auto;
        break-after: auto;
      }
      .card {
        border: 1px solid #e6e6e6;
        border-radius: 10px;
        padding: 16px 18px;
        margin-bottom: 14px;
        background: #ffffff;
        box-shadow: 0 4px 18px rgba(0,0,0,0.04);
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .score-badge {
        display: inline-block;
        background: #b8862e;
        color: #000;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 800;
        margin-right: 6px;
      }
      .subtle-label {
        color: #555;
        font-weight: 700;
      }
      /* Committee Tips styling using data attribute */
      [data-pdf="committee-tips"] {
        background: #f9f9f9 !important;
        padding: 20px !important;
        border-radius: 8px !important;
        text-align: right !important;
        max-width: 600px !important;
        width: 100% !important;
        margin: 20px auto 30px !important;
        border: 1px dashed #ddd !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      [data-pdf="committee-tips"] h5 {
        color: #b8862e !important;
        margin: 0 0 12px 0 !important;
        font-size: 1.1rem !important;
        font-weight: 700 !important;
        text-align: right !important;
      }
      [data-pdf="committee-tips"] ul {
        padding-right: 24px !important;
        margin: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      [data-pdf="committee-tips"] li {
        margin-bottom: 10px !important;
        color: #2b2b2b !important;
        line-height: 1.6 !important;
        list-style-type: disc !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      /* Final Score styling using data attribute */
      [data-pdf="final-score"] {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        margin: 20px auto !important;
        width: 100% !important;
        text-align: center !important;
        padding: 10px 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      [data-pdf="final-score"] .number {
        font-size: 3.5rem !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        color: #1a1a1a !important;
        display: block !important;
        margin-bottom: 8px;
      }
      [data-pdf="final-score"] .label {
        color: #b8862e !important;
        font-size: 0.95rem !important;
        letter-spacing: 1.5px !important;
        text-transform: uppercase !important;
        font-weight: 700 !important;
        display: block !important;
      }
      /* Committee Text styling - paragraphs inside CompactResultBox */
      [class*="CompactResultBox"] p {
        color: #2b2b2b !important;
        line-height: 1.7 !important;
        font-size: 1rem !important;
      }
      /* אל תציג כפתורים וקישורים */
      a, button { display: none !important; }
      /* רשימות */
      ul { padding-right: 20px; margin: 0; }
      li { margin-bottom: 8px; }
      /* איקונים – קטנים ועדינים יותר */
      svg { max-width: 16px; max-height: 16px; }
    `;

    const doc = printWindow.document;
    const pdfDir = (i18n.language || 'he').startsWith('en') ? 'ltr' : 'rtl';
    const localeForDate = (i18n.language || 'he').startsWith('en') ? 'en-US' : 'he-IL';
    doc.open();
    doc.write(`
      <html dir="${pdfDir}">
        <head>
          <title>${t('analysis.pdfReportTitle')}</title>
        </head>
        <body>
          <div class="export-wrapper">
            <div class="export-header">
              <div class="export-header-text">
              <h2>${t('analysis.pdfReportHeader')}</h2>
              <div class="export-note">${t('analysis.pdfReportNote')} • ${new Date().toLocaleString(localeForDate)}</div>
            </div>
              <div class="export-logo-left">
                <img src="${window.location.origin}/Logo.png" alt="Viraly Logo" />
              </div>
            </div>
            ${buildAnalysisHTML()}
          </div>
        </body>
      </html>
    `);

    // הזרקת סגנונות ייעודיים ל-PDF בלבד
    const styleTag = doc.createElement('style');
    styleTag.textContent = styles;
    doc.head.appendChild(styleTag);

    doc.close();

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (!base64data) {
           reject(new Error("Failed to read file"));
           return;
        }
        const base64Content = base64data.split(',')[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (loading) return;

    // וידאו מתחיל מיד באותו צעד עם הלחיצה (לפני כל בדיקה) – בלי השהייה
    if (file?.type.startsWith('video') && videoRef.current) {
      try {
        const video = videoRef.current;
        video.muted = true;
        video.loop = true;
        video.currentTime = 0;
        video.play().catch(() => {
          video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
        });
      } catch (_) {}
    }

    // Validate inputs (no loading yet – so we never show "צוות המומחים צופה" when blocking)
    if (!prompt.trim() && !file) {
      alert(t('alerts.uploadOrTypeFirst'));
      return;
    }
    if (selectedExperts.length < 3) {
      const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
      const defaults = (EXPERTS_BY_TRACK[trackToUse] || []).slice(0, 3).map(e => e.title);
      if (defaults.length < 3) {
        alert(t('alerts.minExperts'));
        return;
      }
      setSelectedExperts(defaults);
    }

    // Check if user is logged in
    if (!user) {
      alert(t('alerts.signupRequired'));
      setAuthModalMode('initial');
      setShowAuthModal(true);
      return;
    }

    // Quick path: free tier – if we already have 1 analysis in state, block immediately (no loading, no API)
    const effectiveTier = subscription?.tier || profile?.subscription_tier || 'free';
    const freeUsage = usage?.analysesUsed ?? subscription?.usage?.analysesUsed ?? 0;
    if (effectiveTier === 'free' && freeUsage >= 1) {
      alert(t('alerts.trialFinished'));
      setShowSubscriptionModal(true);
      return;
    }

    // הצגת טעינה מיידית עם הלחיצה (לפני כל await)
    setLoading(true);

    // Full limit check (for paid tiers and when free usage not yet in state)
    const SUBSCRIPTION_CHECK_ERROR = t('alerts.subscriptionCheckError');
    let limitCheck: { allowed: boolean; message?: string };
    if (userIsAdmin) {
      limitCheck = { allowed: true };
    } else {
      try {
        limitCheck = await checkSubscriptionLimits();
      } catch (error) {
        console.error('❌ Error checking subscription limits:', error);
        limitCheck = { allowed: false, message: SUBSCRIPTION_CHECK_ERROR };
      }
    }

    if (!limitCheck || !limitCheck.allowed) {
      setLoading(false);
      if (limitCheck?.message) alert(limitCheck.message);
      if (limitCheck?.message && limitCheck.message !== SUBSCRIPTION_CHECK_ERROR) {
        setShowSubscriptionModal(true);
      }
      return;
    }

    // Check if current track is available for user's subscription
    const trackAvailable = isTrackAvailable(activeTrack);
    if (!trackAvailable) {
      setLoading(false);
      alert(t('alerts.trackNotInPlan'));
      setShowSubscriptionModal(true);
      return;
    }

    if (activeTrack === 'coach' && !canUseFeature('traineeManagement')) {
      setLoading(false);
      alert(t('coachTrack.alertMessage'));
      setShowSubscriptionModal(true);
      return;
    }

    // CRITICAL: Add safety timeout to ensure loading is reset if something goes wrong
    let loadingTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      console.warn('⚠️ Loading timeout - resetting loading state');
      setLoading(false);
    }, 300000); // 5 minutes max
    
    // Subscription check already done above - no need to check again
    
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        alert(t('alerts.missingApiKey'));
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      // Safety: if experts state is temporarily empty/partial (race after login/track sync),
      // still run with default experts for the current track so "אקשן!" always starts.
      const trackForExperts = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
      const expertsForRun = (selectedExperts.length >= 3
        ? selectedExperts
        : (EXPERTS_BY_TRACK[trackForExperts] || []).slice(0, 3).map(e => e.title)
      );
      if (expertsForRun.length < 3) {
        alert(t('alerts.notEnoughExperts'));
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        setLoading(false);
        return;
      }
      const expertPanel = expertsForRun.join(', ');

      let extraContext = '';
      if (isImprovementMode && previousResult) {
        extraContext = `
          CONTEXT: This is a "Second Take" (Attempt #2).
          The user is trying to improve based on previous feedback.
          
          TASK: Compare this new take to the previous analysis (implied). 
          Did they improve? Point out specific improvements in the expert analysis.
        `;
      }
      
      // Duplicate check removed - was causing analysis to hang
      // Will be re-implemented only for improvement mode if needed
      
      let pdfContext = '';
      if (pdfFile) {
        pdfContext = `
          ADDITIONAL CONTEXT: The user has attached a PDF document (Script, Audition Instructions, or Guidelines). 
          Use the content of this PDF to check if the video matches the requirements, lines, or tone described in the document.
          This is crucial for the "Script Analysis" or "Director" roles if selected.
        `;
      }

      const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
      const isDeepAnalysis = (activeTrack === 'coach' || activeTrack === 'pro') && analysisDepth === 'deep';
      const outputLang = (i18n.language || 'he').startsWith('en') ? 'en' : 'he';
      const timestampExample = outputLang === 'he' ? '"בדקה 2:15..."' : '"at 2:15..."';
      const depthInstruction = isDeepAnalysis ? `
        
        ANALYSIS DEPTH: DEEP & PROFESSIONAL ANALYSIS MODE
        - Provide extremely detailed, comprehensive, and thorough analysis
        - Include specific timestamps references when relevant (e.g., ${timestampExample})
        - Give multiple layers of feedback (technical, emotional, performance, delivery)
        - Compare to professional standards and best practices
        - Provide actionable, specific, and detailed improvement recommendations
        - Include micro-analysis of body language, vocal nuances, and delivery subtleties
        - Analyze subtext, emotional depth, and authenticity
        - Reference industry benchmarks and professional expectations
        - This is for professional analysis purposes - be comprehensive and detailed.
      ` : (activeTrack === 'coach' || activeTrack === 'pro') ? `
        
        ANALYSIS DEPTH: STANDARD ANALYSIS MODE
        - Provide clear, focused analysis
        - Give actionable feedback and recommendations
        - Focus on key areas for improvement
      ` : '';

      const langInstruction = outputLang === 'he' ? `
        Task: Analyze the user's input (Idea/Script or Video File) strictly in HEBREW.
        
        CRITICAL: OUTPUT MUST BE 100% HEBREW. DO NOT USE ENGLISH WORDS IN THE DISPLAYED TEXT.
        Translate strictly:
        - Hook -> "עוגן" or "מקדם צפייה"
        - Cut -> "חיתוך"
        - Frame -> "פריים" (Transliteration allowed for standard industry terms)
        - Lighting -> "תאורה"
        - Script -> "תסריט"
        - Shot -> "שוט" or "צילום"
        - Viral -> "ויראלי"
        - Composition -> "קומפוזיציה"
        - Timeline -> "ציר הזמן"
      ` : `
        Task: Analyze the user's input (Idea/Script or Video File) strictly in ENGLISH.
        
        CRITICAL: OUTPUT MUST BE 100% ENGLISH. DO NOT USE HEBREW OR OTHER LANGUAGES IN THE DISPLAYED TEXT.
        Use standard professional English terminology throughout.
      `;

      const systemInstruction = `
        You are "Viraly", a world-class Video Director and Analyst.
        Current Mode: ${trackToUse}${activeTrack === 'coach' ? ' (Coach Edition - Training Track)' : ''}.
        Panel: ${expertPanel}.
        ${depthInstruction}
        
        ${langInstruction}
        
        ${extraContext}
        ${pdfContext}

        ANALYSIS REQUIREMENTS - Professional & Authentic:
        
        1. TRACK-SPECIFIC EXPERTISE: Each expert must analyze from their unique professional perspective and expertise. Each track has its own professional standards:
           - Actors & Auditions: Focus on acting technique, emotional authenticity, character development, stage presence, audition-specific requirements
           - Musicians & Singers: Focus on vocal technique, musicality, performance energy, stage presence, musical interpretation
           - Content Creators & Social Media: Focus on engagement hooks, content strategy, platform-specific optimization, viral potential, audience connection
           - Influencers & Brands: Focus on brand alignment, message clarity, authenticity, audience resonance, marketing effectiveness
        
        2. BALANCE OF FEEDBACK: Be honest and authentic - praise what deserves praise and criticize what needs improvement. Don't be overly positive or negative - be professional and constructive:
           - Highlight strengths genuinely when they exist
           - Point out weaknesses constructively and specifically
           - Balance encouragement with honest professional assessment
        
        3. TEXT & CONTENT ANALYSIS: If the video contains spoken text or script:
           - Analyze the quality, clarity, and impact of the spoken words
           - Evaluate if the text matches the visual performance
           - Assess the message delivery and emotional connection through words
           - Note if the text is memorable, engaging, or needs improvement
        
        4. KEY MOMENTS: Identify and analyze significant moments in the video:
           - Highlight pivotal scenes or moments that stand out (positively or negatively)
           - Point out specific timestamps if relevant (e.g., "בדקה 2:15...")
           - Analyze why these moments are significant from a professional perspective
           - Connect key moments to overall performance quality
        
        5. PROFESSIONAL IMPROVEMENT TIPS: Provide high-value, authentic, and professional tips for improvement:
           - Tips must be specific, actionable, and track-relevant
           - Focus on professional standards and industry best practices
           - Each tip should offer genuine value and be implementable
           - Tips should reflect deep understanding of the track's professional requirements
        
          6. TAKE RECOMMENDATION: At the end, provide an honest professional recommendation:
           - If the performance is ready: Clearly state if the video/take is ready to submit/upload in its current state, and why
           - If a retake is needed: Honestly recommend another take if significant improvements are needed, explaining specifically what should be improved
           - Be authentic - don't always recommend retakes, and don't always say it's ready. Assess professionally and honestly.

        Return the result as a raw JSON object with this exact structure (Keys must be English, Values MUST be in ${outputLang === 'he' ? 'Hebrew' : 'English'}):
        {
          "expertAnalysis": [
            {
              "role": "Expert Title (${outputLang === 'he' ? 'Hebrew' : 'English'})",
              "insight": "Deep professional analysis from this expert's unique POV. Must include: track-specific professional perspective, balanced praise and criticism, text/content analysis if applicable, key moments identification, and specific professional insights. (${outputLang === 'he' ? 'Hebrew only' : 'English only'})",
              "tips": "Actionable, specific, professional tips for improvement relevant to this track's expertise. High-value, authentic, and implementable advice. (${outputLang === 'he' ? 'Hebrew only' : 'English only'})",
              "score": number (1-100, authentic professional assessment)
            }
          ],
          "hook": "The 'Golden Tip'. A single, explosive, game-changing sentence. It must be the absolute secret weapon for this specific video. Phrased as a direct, powerful, and unforgettable command that will transform the user's career. (${outputLang === 'he' ? 'Hebrew only' : 'English only'})",
          "committee": {
            "summary": "A comprehensive summary from the entire committee, synthesizing the views. Must include: overall professional assessment, key strengths and weaknesses, significant moments analysis, and final recommendation on whether to submit/upload current take or do another take with specific improvements needed. (${outputLang === 'he' ? 'Hebrew only' : 'English only'})",
            "finalTips": ["Professional tip 1", "Professional tip 2", "Professional tip 3"]
          },
          "takeRecommendation": "${outputLang === 'he' 
            ? "Honest professional recommendation in Hebrew: If ready - say 'מוכן להגשה' and explain why. If needs improvement - say 'מומלץ טייק נוסף' and give friendly suggestions. NO ENGLISH - Hebrew only!" 
            : "Honest professional recommendation in English: If ready - say 'Ready to submit' and explain why. If needs improvement - say 'Another take recommended' and give friendly suggestions. NO HEBREW - English only!"}"
        }

        Important:
        - "expertAnalysis" array must contain an object for EACH selected expert in the panel.
        - Each expert's insight must reflect their unique professional expertise for the selected track.
        - "hook" is NOT a suggestion for a video hook. It is the "Golden Insight" of the analysis.
        - "score" for each expert must be authentic (1-100) based on professional standards.
        - "takeRecommendation" must be honest - assess if the take is ready or needs improvement.
        - Use purely ${outputLang === 'he' ? 'Hebrew' : 'English'} professional terms.
        - Do not use Markdown formatting inside the JSON strings.
        - Balance praise and criticism authentically - be professional, not overly positive or negative.
        ${((activeTrack === 'coach' || activeTrack === 'pro') && analysisDepth === 'deep') ? `
        - For DEEP analysis: Be extremely detailed, include specific examples, timestamps when possible, multiple layers of feedback, and comprehensive recommendations.
        ` : ''}
      `;

      const parts = [];
      
      // Force a text part if prompt is empty to ensure API stability
      if (!prompt.trim()) {
        parts.push({ text: t('analysis.emptyPromptFallback') });
      } else {
        parts.push({ text: prompt });
      }
      
      if (file) {
        const maxFileBytes = getMaxFileBytes(activeTrack, subscription || undefined);
        const maxVideoSeconds = getMaxVideoSeconds(activeTrack, subscription || undefined);
        const limitText = getUploadLimitText(activeTrack, subscription || undefined);
        
        // Check file size
        if (file.size > maxFileBytes) {
           const actualMb = (file.size / (1024 * 1024)).toFixed(1);
           alert(t('alerts.fileTooLarge', { mb: actualMb }));
           if (loadingTimeout) {
             clearTimeout(loadingTimeout);
             loadingTimeout = null;
           }
           setLoading(false);
           return;
        }
        
        // Check video duration if it's a video file
        if (file.type.startsWith('video') && videoRef.current) {
          const duration = videoRef.current.duration || 0;
          if (duration > maxVideoSeconds) {
            const durationSeconds = Math.round(duration);
            alert(t('alerts.videoTooLong', { seconds: durationSeconds }));
            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
              loadingTimeout = null;
            }
            setLoading(false);
            return;
          }
        }
        try {
          const imagePart = await fileToGenerativePart(file);
          parts.push(imagePart);
        } catch (e) {
          console.error("❌ File processing error", e);
          alert(t('alerts.fileProcessingError'));
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          setLoading(false);
          return;
        }
      }

      if (pdfFile) {
         try {
           const pdfPart = await fileToGenerativePart(pdfFile);
           parts.push(pdfPart);
         } catch(e) {
            console.error("❌ PDF processing error", e);
         }
      }

      const maxRetries = 2;
      let lastError: any;
      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: { 
              systemInstruction,
              responseMimeType: "application/json"
            }
          });
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          const code = err?.error?.code ?? err?.status ?? err?.code;
          const isRetryable = code === 500 || code === 502 || code === 503 || code === 504;
          if (isRetryable && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      if (lastError || !response) throw lastError || new Error('No response');

      // Reduced logging

      // Robust JSON Parsing
      let jsonText = response.text || '{}';
      // Clean potential markdown fencing from the model
      jsonText = jsonText.replace(/```json|```/g, '').trim();
      
      let parsedResult: AnalysisResult;
      try {
        parsedResult = JSON.parse(jsonText) as AnalysisResult;
        // Reduced logging
      } catch (e) {
        console.error("❌ JSON Parse Error", e);
        console.error("Raw Text (first 500 chars):", jsonText.substring(0, 500));
        console.error("Raw Text (last 500 chars):", jsonText.substring(Math.max(0, jsonText.length - 500)));
        alert(t('alerts.invalidResponse'));
        setLoading(false);
        return;
      }
      
      // Validate result structure
      if (!parsedResult.expertAnalysis || parsedResult.expertAnalysis.length === 0) {
        console.error("❌ Invalid result structure - no expertAnalysis");
        alert(t('alerts.invalidResponseNoExperts'));
        setLoading(false);
        return;
      }
      
      // Calculate average
      if (parsedResult.expertAnalysis && parsedResult.expertAnalysis.length > 0) {
        const total = parsedResult.expertAnalysis.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const avg = Math.round(total / parsedResult.expertAnalysis.length);
        setAverageScore(avg);
      }

      setResult(parsedResult);
      
      // CRITICAL: Save analysis and update usage IMMEDIATELY after analysis completes successfully
      // This ensures usage is tracked correctly for all subscription tiers
      // IMPORTANT: Update usage even if there's no file - analysis itself counts!
      if (user) {
        // Run save in background - don't await to avoid blocking UI
        (async () => {
          try {
            // Save video first if exists (not required for analysis to be saved)
            let videoId: string | null = null;
            if (file) {
              try {
                const uploadResult = await uploadVideo(file, user.id);
                const videoData = await saveVideoToDatabase({
                  file_name: file.name,
                  file_path: uploadResult.path,
                  file_size: file.size,
                  duration_seconds: videoRef.current?.duration ? Math.round(videoRef.current.duration) : null,
                  mime_type: file.type,
                });
                videoId = videoData.id;
              } catch (videoError) {
                // Video save failed, but continue with analysis - analysis can be saved without video
                console.error('Video save failed, continuing with analysis:', videoError);
              }
            }

            // Save analysis to Supabase immediately (even without video)
            const resultWithMetadata = {
              ...parsedResult,
              metadata: {
                ...(parsedResult.metadata || {}),
                fileSize: file?.size || null,
                file_size: file?.size || null,
                fileName: file?.name || null,
                file_name: file?.name || null,
              }
            };
            
            const analysisData = await saveAnalysis({
              video_id: videoId || undefined,
              trainee_id: activeTrack === 'coach' ? selectedTrainee || undefined : undefined,
              track: activeTrack,
              coach_training_track: activeTrack === 'coach' ? coachTrainingTrack : undefined,
              analysis_depth: activeTrack === 'coach' ? analysisDepth : undefined,
              expert_panel: selectedExperts,
              prompt: prompt || undefined,
              result: resultWithMetadata,
              average_score: averageScore,
            });

            // Analysis saved successfully - NOW update usage IMMEDIATELY (not in background!)
            // Minimal wait - database commit is usually instant for inserts
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update usage from database (with retries if needed)
            const updateUsageFromDB = async (retryCount = 0): Promise<void> => {
              try {
                // Minimal wait for database commit - most databases commit instantly
                await new Promise(resolve => setTimeout(resolve, 200 + (retryCount * 100)));
                const updatedUsage = await getUsageForCurrentPeriod();
                if (updatedUsage) {
                  setUsage(updatedUsage);
                  // Also update subscription state with usage (analyses only - minutes are in usage state)
                  setSubscription(prev => prev ? {
                    ...prev,
                    usage: {
                      analysesUsed: updatedUsage.analysesUsed,
                      lastResetDate: updatedUsage.periodStart,
                    },
                  } : null);
                  // Usage updated successfully - trigger refresh in SettingsPage IMMEDIATELY
                  if (user) {
                    // Trigger usage update event for SettingsPage
                    window.dispatchEvent(new CustomEvent('usage_updated'));
                    // Also trigger analysis_saved for backward compatibility
                    window.dispatchEvent(new CustomEvent('analysis_saved'));
                  }
                } else {
                  // If no usage data, retry
                  if (retryCount < 3) {
                    await updateUsageFromDB(retryCount + 1);
                  } else {
                    // Fallback: optimistically update local state
                    setUsage(prev => prev ? {
                      ...prev,
                      analysesUsed: (prev?.analysesUsed || 0) + 1,
                    } : { analysesUsed: 1, minutesUsed: 0, periodStart: new Date(), periodEnd: new Date() });
                    setSubscription(prev => prev ? {
                      ...prev,
                      usage: {
                        analysesUsed: (prev.usage.analysesUsed || 0) + 1,
                        lastResetDate: prev.usage.lastResetDate,
                      },
                    } : null);
                    // Still trigger update event
                    if (user) {
                      window.dispatchEvent(new CustomEvent('usage_updated'));
                    }
                  }
                }
              } catch (usageError) {
                console.error('❌ Error updating usage from DB:', usageError);
                // Retry up to 3 times (reduced from 5 for faster response)
                if (retryCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 300));
                  await updateUsageFromDB(retryCount + 1);
                } else {
                  // Fallback: optimistically update local state
                  setUsage(prev => prev ? {
                    ...prev,
                    analysesUsed: (prev?.analysesUsed || 0) + 1,
                  } : { analysesUsed: 1, minutesUsed: 0, periodStart: new Date(), periodEnd: new Date() });
                  setSubscription(prev => prev ? {
                    ...prev,
                    usage: {
                      analysesUsed: (prev.usage.analysesUsed || 0) + 1,
                      lastResetDate: prev.usage.lastResetDate,
                    },
                  } : null);
                  // Still trigger update event
                  if (user) {
                    window.dispatchEvent(new CustomEvent('usage_updated'));
                  }
                }
              }
            };
            
            // AWAIT the update - don't run in background!
            await updateUsageFromDB();
            
            // CRITICAL: Refresh subscription data IMMEDIATELY after analysis is saved
            // This ensures subscription status, tier, and all other data are up-to-date instantly
            if (user) {
              try {
                // Minimal wait - database commit is usually instant for inserts
                await new Promise(resolve => setTimeout(resolve, 100));
                // Reload user data to refresh subscription from database IMMEDIATELY
                await loadUserData(user, true);
                console.log('✅ Subscription refreshed IMMEDIATELY from database after analysis');
              } catch (refreshError) {
                console.error('❌ Error refreshing subscription after analysis:', refreshError);
                // Retry once after short delay if first attempt failed
                try {
                  await new Promise(resolve => setTimeout(resolve, 300));
                  await loadUserData(user, true);
                  console.log('✅ Subscription refreshed on retry');
                } catch (retryError) {
                  console.error('❌ Retry also failed, subscription will update on next page interaction');
                }
              }
            }
            
            // Notify other tabs/components that analysis was saved (already triggered in updateUsageFromDB)
            // But also update localStorage for cross-tab sync
            try {
              localStorage.setItem('analysis_saved', Date.now().toString());
              localStorage.setItem('usage_updated', Date.now().toString());
            } catch (e) {
              // Ignore localStorage errors
            }
          } catch (saveError: any) {
            console.error('❌ Error saving analysis immediately:', saveError);
            console.error('❌ Save error details:', JSON.stringify(saveError, null, 2));
            console.error('❌ Save error code:', saveError?.code);
            console.error('❌ Save error message:', saveError?.message);
            console.error('❌ Save error hint:', saveError?.hint);
            console.error('❌ Save error details:', saveError?.details);
            
            // Show alert to user so they know the analysis wasn't saved
            const errorMessage = saveError?.message || t('alerts.unknownError');
            const errorCode = saveError?.code || 'UNKNOWN';
            alert(t('alerts.analysisSaveErrorDb', { error: errorMessage, code: errorCode }));
            
            // Don't block UI - analysis result is still shown
            // Usage will be updated on next page load or when user manually saves
          }
        })();
      }
      
      // Analysis completed successfully - stop video loop and set loading to false
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      setLoading(false);
      
      // Jump to results area immediately
      setTimeout(() => {
        const resultsElement = document.getElementById('results-area');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);

    } catch (error: any) {
      console.error("❌ API Error:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        code: error?.error?.code || error?.status,
        status: error?.status,
        statusText: error?.statusText,
        response: error?.response,
        stack: error?.stack
      });
      
      const code = error?.error?.code ?? error?.status ?? (typeof error?.code === 'number' ? error.code : undefined);
      if (code === 429) {
        alert(t('alerts.geminiQuotaExceeded'));
      } else if (code === 503) {
        alert(t('alerts.geminiOverloaded'));
      } else if (code === 500 || code === 502 || code === 504) {
        alert(t('alerts.geminiServerError'));
      } else if (code === 400) {
        alert(t('alerts.invalidRequest'));
      } else {
        alert(t('alerts.analysisError', { code: code ?? (i18n.language?.startsWith('en') ? 'unknown' : 'לא ידוע') }));
      }
    } finally {
      // Stop video when analysis ends (success or error)
      if (videoRef.current) {
        videoRef.current.pause();
      }
      // CRITICAL: Always reset loading state, even on error
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      setLoading(false);
    }
  };

  const isReady = (!!prompt.trim() || !!file) && selectedExperts.length >= 3;

  // Safety net: Reset loading if it gets stuck for too long
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Loading state stuck for 6 minutes - resetting');
        setLoading(false);
      }, 360000); // 6 minutes (longer than the 5 minute timeout in handleGenerate)
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
  const currentExpertsList = EXPERTS_BY_TRACK[trackToUse];
  
  const handleSetTop3 = () => {
    const top3 = currentExpertsList.slice(0, 3).map(e => e.title);
    setSelectedExperts(top3);
  };

  const handleSetAll = () => {
    const maxExperts = getMaxExperts();
    if (maxExperts < 8) {
      alert(t('alerts.all8Experts'));
      setShowSubscriptionModal(true);
      return;
    }
    // Set all 8 experts
    const all = currentExpertsList.slice(0, 8).map(e => e.title);
    setSelectedExperts(all);
  };

  const isTop3 = () => {
    const top3 = currentExpertsList.slice(0, 3).map(e => e.title);
    if (selectedExperts.length !== 3) return false;
    return top3.every(t => selectedExperts.includes(t));
  };

  const isAll = () => {
    return selectedExperts.length === currentExpertsList.length;
  };

  // Redirect admin users from settings route ישירות לפאנל ניהול
  useEffect(() => {
    if (!user || !userIsAdmin) return;
    if (!isSettingsPage) return;
    navigate('/admin', { replace: true });
  }, [isSettingsPage, user, userIsAdmin, navigate]);

  // Check admin status when entering admin page
  useEffect(() => {
    if (isAdminPage && user) {
      isAdmin().then(adminStatus => {
        setUserIsAdmin(adminStatus);
      }).catch(() => {
        setUserIsAdmin(false);
      });
    }
  }, [isAdminPage, user]);

  // Ensure profile is always loaded after refresh (fixes stuck email display)
  useEffect(() => {
    if (!user) return;
    if (profile) return; // Already loaded
    if (isLoadingProfile) return; // Already loading, don't duplicate
    
    // If user exists but profile is null and not currently loading, load it immediately
    const loadProfileIfMissing = async () => {
      setIsLoadingProfile(true);
      try {
        const userProfile = await getCurrentUserProfile(true, user.id);
        if (userProfile) {
          setProfile(userProfile);
          saveProfileToCache(userProfile); // Cache for next refresh
        } else {
          console.warn('⚠️ Profile still not found after refresh load attempt');
        }
      } catch (error) {
        console.error('❌ Error loading profile after refresh:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    // Load immediately (no delay needed since we have cache)
    loadProfileIfMissing();
  }, [user, profile, isLoadingProfile]);

  // On entering Settings: auto-refresh profile and subscription (same as clicking "ריענון")
  useEffect(() => {
    if (!user || !isSettingsPage) return;
    loadUserData(user, true, true).catch((e) => console.warn('Settings auto-refresh:', e));
  }, [isSettingsPage, user?.id, loadUserData]);

  // Ensure usage is always loaded after refresh, especially on SettingsPage
  // Don't wait for subscription - load usage independently to prevent disappearing
  useEffect(() => {
    if (!user) return;
    if (!isSettingsPage) return;
    
    // Load usage independently - don't wait for subscription
    const loadUsageIfMissing = async () => {
      try {
        const usageData = await getUsageForCurrentPeriod();
        if (usageData) {
          setUsage(usageData);
          
          // Update subscription with current usage if subscription exists
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
        } else {
          // If usage data is null, set default values to prevent display issues
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          setUsage({
            analysesUsed: 0,
            minutesUsed: 0,
            periodStart: monthStart,
            periodEnd: monthEnd,
          });
        }
      } catch (error) {
        console.error('❌ Error loading usage after refresh:', error);
        // Set default values on error
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        setUsage({
          analysesUsed: 0,
          minutesUsed: 0,
          periodStart: monthStart,
          periodEnd: monthEnd,
        });
      }
    };
    
    // Load usage immediately on settings page (don't wait for subscription)
    loadUsageIfMissing();
  }, [user, isSettingsPage]);
  
  const handleLogout = async () => {
    // Prevent double-click
    if (loggingOut) return;
    
    console.log('🚪 Logout initiated');
    setLoggingOut(true);
    
    try {
      // Close all modals first
      setShowAuthModal(false);
      setShowSubscriptionModal(false);
      setShowUpgradeBenefitsModal(false);
      setShowTakbullPayment(false);
      setShowCoachDashboard(false);
      setShowComparison(false);
      setShowCoachGuide(false);
      setShowTrackSelectionModal(false);
      setShowPackageSelectionModal(false);
      setPendingSubscriptionTier(null);
      setTakbullPaymentUrl('');
      setTakbullOrderReference('');
      
      // Sign out from Supabase WITH timeout (prevent hanging)
      console.log('🔄 Signing out from Supabase...');
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 2000)
      );
      
      try {
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as { error: any };
        if (error) {
          console.warn('⚠️ SignOut error (continuing anyway):', error.message);
        } else {
          console.log('✅ Signed out successfully');
        }
      } catch (timeoutError: any) {
        console.warn('⚠️ SignOut timeout (forcing logout):', timeoutError.message);
      }
      
      // Reset all state
      setUser(null);
      resetUserState();
      
      // Clear all storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Set logout flag
      localStorage.setItem('just_logged_out', 'true');
      
      console.log('✅ Logout complete, reloading page...');
      
      // Force page reload to ensure clean state
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      
      // Force clear state anyway
      setUser(null);
      resetUserState();
      
      // Clear storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('just_logged_out', 'true');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Force reload as fallback
      window.location.href = '/';
    }
  };
  
  // Render different pages based on route (ללא useEffect בתוך תנאי!)
  // CRITICAL: On F5 refresh at /admin, ensure we always show AdminPage – bypass React Router sync issues
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
    return (
      <>
        <GlobalStyle />
        <AdminPage />
      </>
    );
  }
  if (isSettingsPage) {
    // For admin users we don't מציגים את עמוד ההגדרות (הם כבר מופנים ל-/admin מה-useEffect)
    if (userIsAdmin) {
      return null;
    }
    
    return (
      <>
        <GlobalStyle />
        <SettingsPage
          user={user}
          profile={profile}
          subscription={subscription}
          usage={usage}
          onProfileUpdate={() => {
            if (user) {
              loadUserData(user, true).catch((e) => console.warn('Background profile refresh:', e));
            }
          }}
          onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
          onOpenSubscriptionBillingModal={() => setShowSubscriptionBillingModal(true)}
          onProfileTracksUpdated={(trackIds) => {
            setProfile((prev) => {
              const next = prev ? { ...prev, selected_tracks: trackIds } : null;
              if (next) saveProfileToCache(next);
              return next;
            });
          }}
          onLogout={handleLogout}
        />
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentSubscription={subscription}
          onSelectPlan={onSelectPlanFromSubscriptionModal}
          activeTrack={activeTrack}
        />
        <SubscriptionBillingModal
          isOpen={showSubscriptionBillingModal}
          onClose={() => setShowSubscriptionBillingModal(false)}
          onUpgrade={() => {
            setShowSubscriptionBillingModal(false);
            setShowSubscriptionModal(true);
          }}
          subscription={subscription}
          profile={profile}
          usage={usage ? { analysesUsed: usage.analysesUsed, minutesUsed: usage.minutesUsed, periodEnd: usage.periodEnd } : null}
          onRefresh={() => user && loadUserData(user, true).catch((e) => console.warn('Refresh after billing action:', e))}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthModalMode('initial');
            setAuthModalUpgradePackage(null);
            setRedeemCodeFromUrl(null);
            setRedeemPackageFromUrl(null);
            updatingSubscriptionRef.current = false;
            setIsUpdatingSubscription(false);
          }}
          mode={authModalMode}
          initialPackageForUpgrade={authModalUpgradePackage ?? redeemPackageFromUrl}
          initialPackage={redeemPackageFromUrl}
          initialRedeemCode={redeemCodeFromUrl}
          currentUser={user ?? null}
          onAuthSuccess={() => {}}
          onUpgradeComplete={(tier) => {
            setShowAuthModal(false);
            setAuthModalMode('initial');
            setAuthModalUpgradePackage(null);
            handleSelectPlan(tier, 'monthly');
          }}
        />
      </>
    );
  }

  if (isAdminPage) {
    return (
      <>
        <GlobalStyle />
        <AdminPage />
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <div style={{ position: 'relative', width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <AppLogo />
            <div style={{ position: 'absolute', top: 0, right: 0, left: 'auto' }}>
              <LanguageDropdown />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '20px', gap: '15px' }}>
          {/* DISABLED: Upgrade completion message popup */}
          {/* This popup was causing issues with immediate login flow after registration */}
          {/* User now enters directly with selected package and settings */}
          {/* {typeof window !== 'undefined' && !user && localStorage.getItem('pending_package_upgrade') === 'true' && (
            <div style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                padding: '6px 16px',
                background: 'linear-gradient(135deg, rgba(212, 160, 67, 0.98) 0%, rgba(212, 160, 67, 0.95) 100%)',
                borderBottom: '1px solid rgba(212, 160, 67, 0.8)',
                color: '#000',
                fontSize: '0.8rem',
                lineHeight: '1.4',
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                fontWeight: 500,
                direction: 'rtl',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '0'
              }}>
                <span style={{ fontSize: '0.8rem' }}>
                  על מנת שהחבילה שלך תתעדכן, אנא היכנס מחדש לפרופיל
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('pending_package_upgrade');
                    window.location.reload();
                  }}
                  style={{
                    padding: '1px 6px',
                    background: 'transparent',
                    color: '#000',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease',
                    lineHeight: '1.2'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  ✕
                </button>
              </div>
            </div>
          )} */}
          </div>
          <Title>{t('header.title')}</Title>
          <Subtitle>{t('header.subtitle')}</Subtitle>
          <Description dangerouslySetInnerHTML={{ __html: t('header.description') }} />
          {user && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              {/* מחובר כ: במרכז מעל הלחצנים */}
              <span style={{ color: '#D4A043', fontSize: '0.9rem', fontWeight: 600 }}>
                {t('header.loggedInAs')}: <span style={{ color: '#fff' }}>{profile?.full_name || user.email}</span>
              </span>
              
              {/* הלחצנים במרכז */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {!userIsAdmin && (
                  <button
                    onClick={() => navigate('/settings')}
                    style={{
                      background: 'transparent',
                      border: '1px solid #fff',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ⚙️ {t('header.settings')}
                  </button>
                )}
                {userIsAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/admin');
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid #fff',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ⚙️ {t('header.adminPanel')}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    background: 'transparent',
                    border: '1px solid #fff',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                >
                  {loggingOut ? t('header.loggingOut') : t('header.logout')}
                </button>
              </div>
              
              {/* סוג החבילה במרכז מתחת ללחצנים */}
              {(() => {
                const currentTier = subscription?.tier || profile?.subscription_tier || 'free';
                let tierKey = currentTier === 'coach-pro' ? 'plan.coachPro' : `plan.${currentTier}`;
                const tierName = t(tierKey);
                return (
                  <span style={{ 
                    color: currentTier === 'free' ? '#888' : currentTier === 'coach' ? '#D4A043' : '#e6be74',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: currentTier === 'free' 
                      ? 'rgba(136, 136, 136, 0.15)' 
                      : currentTier === 'coach'
                      ? 'rgba(212, 160, 67, 0.15)'
                      : 'rgba(230, 190, 116, 0.15)',
                    border: `1px solid ${currentTier === 'free' ? 'rgba(136, 136, 136, 0.3)' : currentTier === 'coach' ? 'rgba(212, 160, 67, 0.3)' : 'rgba(230, 190, 116, 0.3)'}`,
                    letterSpacing: '0.5px'
                  }}>
                    {tierName}
                  </span>
                );
              })()}
            </div>
          )}
          <Divider />
          {!user && (
            <div style={{ marginBottom: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!loggingOut && !loadingAuth) {
                    setAuthModalMode('initial');
                    setShowAuthModal(true);
                  }
                }}
                disabled={loggingOut || loadingAuth}
                style={{
                  background: 'linear-gradient(135deg, #b8862e 0%, #e6be74 50%, #b8862e 100%)',
                  backgroundSize: '200% auto',
                  border: 'none',
                  color: '#000',
                  padding: '8px 20px',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontFamily: 'Assistant, sans-serif',
                  fontWeight: 600,
                  margin: '8px 0 0 0',
                  opacity: (loggingOut || loadingAuth) ? 0.6 : 1,
                  cursor: (loggingOut || loadingAuth) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(212, 160, 67, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!loggingOut && !loadingAuth) {
                    e.currentTarget.style.backgroundPosition = 'right center';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 160, 67, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = 'left center';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 160, 67, 0.3)';
                }}
              >
                🔒 {t('header.loginSignup')}
              </button>
            </div>
          )}
          <CTAButton onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('header.ctaUpload')}
          </CTAButton>
          
          <CapabilitiesButton onClick={() => setIsModalOpen(true)}>
             {t('header.ctaCapabilities')} <SparklesIcon />
          </CapabilitiesButton>
          
          <PackagesButton onClick={() => setShowPackageSelectionModal(true)}>
            {t('header.ctaPackages')}
          </PackagesButton>
        </Header>
        
        <CapabilitiesModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          activeTab={modalTab}
          setActiveTab={setModalTab}
        />

        <CoachDashboardModal
          isOpen={showCoachDashboard}
          onClose={() => setShowCoachDashboard(false)}
          trainees={trainees}
          setTrainees={setTrainees}
          savedAnalyses={savedAnalyses}
          setSavedAnalyses={setSavedAnalyses}
          onTraineeSelect={(traineeId) => {
            setSelectedTrainee(traineeId);
            setShowCoachDashboard(false);
          }}
          onViewAnalysis={(analysis) => {
            // ניתן להוסיף תצוגה של ניתוח שמור
            setResult(analysis.result);
            setAverageScore(analysis.averageScore);
            setShowCoachDashboard(false);
            setTimeout(() => {
              document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          onExportReport={handleExportCoachReport}
        />

        <ComparisonModal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          savedAnalyses={savedAnalyses}
          trainees={trainees}
        />

        <CoachGuideModal
          isOpen={showCoachGuide}
          onClose={() => setShowCoachGuide(false)}
        />

        <SectionLabel>{t('analysis.selectTrack')}</SectionLabel>
        <Grid>
          {TRACKS.filter(track => !track.isPremium).map(track => {
            const showRestrictions = shouldShowTrackRestrictions(track.id as TrackId);
            const isAvailable = isTrackAvailable(track.id as TrackId);
            return (
              <TrackCard 
                key={track.id} 
                $active={activeTrack === track.id}
                onClick={() => handleTrackChange(track.id)}
                style={{
                  opacity: showRestrictions ? 0.5 : 1,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={showRestrictions ? t('coachTrack.cardTooltip') : ''}
              >
                {track.icon}
                <span>{t(`track.${track.id}`)}</span>
                {showRestrictions && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(212, 160, 67, 0.2)',
                    color: '#D4A043',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    לא בחבילה
                  </span>
                )}
              </TrackCard>
            );
          })}
          {TRACKS.filter(track => track.isPremium).map(track => {
            const showRestrictions = shouldShowTrackRestrictions(track.id as TrackId);
            const isAvailable = isTrackAvailable(track.id as TrackId);
            return (
              <PremiumCoachCard
                key={track.id}
                $active={activeTrack === track.id}
                onClick={() => handleTrackChange(track.id)}
                style={{
                  opacity: showRestrictions ? 0.5 : 1,
                  cursor: 'pointer'
                }}
                title={showRestrictions ? t('coachTrack.cardTooltip') : ''}
              >
                {track.icon}
                <div className="coach-line1">{t('coachCard.line1')}</div>
                <div className="coach-line2">{t('coachCard.line2')}</div>
                <div className="coach-line3">{t('coachCard.line3')}</div>
              </PremiumCoachCard>
            );
          })}
        </Grid>
        
        {activeTrack === 'coach' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', marginBottom: '20px' }}>
            <button
              onClick={() => setShowCoachGuide(true)}
              style={{
                background: 'transparent',
                border: '1px solid #D4A043',
                borderRadius: '20px',
                padding: '8px 20px',
                color: '#D4A043',
                fontFamily: 'Assistant, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 160, 67, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <SparklesIcon />
              {t('coachGuide.button')}
            </button>
          </div>
        )}
        
        <TrackDescriptionText>
           {t(`trackDescription.${activeTrack}`)}
        </TrackDescriptionText>

        {activeTrack === 'coach' && (
          <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            {canUseFeature('traineeManagement') ? (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <CoachButton onClick={() => setShowCoachDashboard(true)}>
                  <CoachIcon />
                  {t('coachTrack.traineeManagement')}
                </CoachButton>
                {canUseFeature('comparison') && (
                  <CoachButton onClick={() => setShowComparison(true)}>
                    <ComparisonIcon />
                    {t('analysis.compareAnalyses')}
                  </CoachButton>
                )}
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(212, 160, 67, 0.1)', 
                padding: '20px', 
                borderRadius: '8px', 
                border: '1px solid rgba(212, 160, 67, 0.3)',
                maxWidth: '600px',
                width: '100%'
              }}>
                <p style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 600 }}>
                  {t('coachTrack.restrictionMessage')}
                </p>
                <CoachButton onClick={() => setShowSubscriptionModal(true)}>
                  {t('coachTrack.upgradeCta')}
                </CoachButton>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '800px' }}>
              <div style={{ background: 'rgba(212, 160, 67, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.1rem' }}>{t('coachTrack.selectTrainingField')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {(['actors', 'musicians', 'creators', 'influencers'] as TrackId[]).map(trackId => {
                    const track = TRACKS.find(t => t.id === trackId);
                    return track ? (
                      <button
                        key={trackId}
                        onClick={() => setCoachTrainingTrack(trackId)}
                        style={{
                          background: coachTrainingTrack === trackId ? 'rgba(212, 160, 67, 0.2)' : 'rgba(20, 20, 20, 0.6)',
                          border: `2px solid ${coachTrainingTrack === trackId ? '#D4A043' : '#333'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          color: coachTrainingTrack === trackId ? '#D4A043' : '#aaa',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {t(`track.${track.id}`)}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(212, 160, 67, 0.1)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <span style={{ color: '#D4A043', fontWeight: 600 }}>{t('analysis.analysisType')}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setAnalysisDepth('standard')}
                    style={{
                      background: analysisDepth === 'standard' ? '#D4A043' : 'transparent',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: analysisDepth === 'standard' ? '#000' : '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    {t('analysis.standard')}
                  </button>
                  <button
                    onClick={() => setAnalysisDepth('deep')}
                    style={{
                      background: analysisDepth === 'deep' ? '#D4A043' : 'transparent',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: analysisDepth === 'deep' ? '#000' : '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    {t('analysis.deep')}
                  </button>
                </div>
              </div>

              {trainees.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(212, 160, 67, 0.1)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                  <span style={{ color: '#D4A043', fontWeight: 600 }}>מתאמן נבחר:</span>
                  <select 
                    value={selectedTrainee || ''} 
                    onChange={(e) => setSelectedTrainee(e.target.value || null)}
                    style={{
                      background: '#0a0a0a',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    <option value="">-- בחר מתאמן --</option>
                    {trainees.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <SectionLabel>{t('experts.whoAre')}</SectionLabel>
        
        <ExpertControlBar>
           <ExpertControlText>
             {t('analysis.yourCommittee')} <strong>{activeTrack === 'coach' ? t(`track.${coachTrainingTrack}`) : t(`track.${activeTrack}`)}</strong>{t('analysis.expertsIntro')}
           </ExpertControlText>
           <ExpertToggleGroup>
              <ExpertToggleButton $active={isTop3()} onClick={handleSetTop3}>{t('experts.toggleTop3')}</ExpertToggleButton>
              <ExpertToggleButton 
                $active={isAll()} 
                onClick={handleSetAll}
                disabled={getMaxExperts() < 8}
                style={{
                  opacity: getMaxExperts() < 8 ? 0.5 : 1,
                  cursor: getMaxExperts() < 8 ? 'not-allowed' : 'pointer'
                }}
                title={getMaxExperts() < 8 ? '8 מומחים זמינים בחבילות מנוי בלבד. שדרג את החבילה.' : ''}
              >
                {t('experts.toggleAll8')}
              </ExpertToggleButton>
           </ExpertToggleGroup>
        </ExpertControlBar>

        <Grid>
          {EXPERTS_BY_TRACK[activeTrack === 'coach' ? coachTrainingTrack : activeTrack].map((expert, i) => {
            const trackKey = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
            const isSelected = selectedExperts.includes(expert.title);
            const maxExperts = getMaxExperts();
            const isDisabled = !isSelected && selectedExperts.length >= maxExperts;
            const expertTitle = t(`experts.${trackKey}.${i}.title`, { defaultValue: expert.title });
            const expertDesc = t(`experts.${trackKey}.${i}.desc`, { defaultValue: expert.desc });
            return (
              <FeatureCard 
                key={i} 
                $selected={isSelected}
                onClick={() => !isDisabled && toggleExpert(expert.title)}
                style={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
                title={isDisabled ? `מקסימום ${maxExperts} מומחים זמינים בחבילה שלך. שדרג את החבילה לבחור מומחים נוספים.` : ''}
              >
                <FeatureTitle $selected={isSelected}>{expertTitle}</FeatureTitle>
                <FeatureDesc $selected={isSelected}>{expertDesc}</FeatureDesc>
              </FeatureCard>
            );
          })}
        </Grid>

        <UploadContainer id="upload-section" $hasFile={!!previewUrl}>
          {previewUrl ? (
            <FullSizePreview>
              <RemoveFileBtn onClick={handleRemoveFile}>✕</RemoveFileBtn>
              {file?.type.startsWith('video') ? (
                <video
                  key={previewUrl}
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  playsInline
                  preload="auto"
                  defaultMuted
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  onVolumeChange={(e) => {
                    const video = e.currentTarget;
                    if (!video.muted && video.paused) {
                      video.play().catch(() => {});
                    }
                  }}
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="preview" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </FullSizePreview>
          ) : (
            <UploadContent>
              <UploadIcon><CinematicCameraIcon /></UploadIcon>
              <UploadTitle>
                {isImprovementMode ? t('analysis.uploadImproved') : t('analysis.uploadTitleForTrack', { track: t(`track.${activeTrack}`) })}
              </UploadTitle>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', marginBottom: '10px' }}>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)',
                    border: 'none',
                    color: '#000',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subscription?.tier === 'free' ? t('subscription.upgradePlan') : t('subscription.manageSubscription')}
                </button>
              </div>
              
              <UploadSubtitle style={{ textAlign: 'center', marginBottom: '25px' }}>
                {(() => {
                  const sub = subscription || undefined;
                  if (sub) {
                    const plan = SUBSCRIPTION_PLANS[sub.tier];
                    const seconds = plan.limits.maxVideoSeconds;
                    const mb = plan.limits.maxFileBytes / (1024 * 1024);
                    if (seconds >= 60) {
                      const minutes = Math.floor(seconds / 60);
                      return t('uploadLimit.minutes', { minutes, mb });
                    }
                    return t('uploadLimit.seconds', { seconds, mb });
                  }
                  if (activeTrack === 'coach') return t('uploadLimit.minutes', { minutes: 5, mb: 40 });
                  return t('uploadLimit.minute', { mb: 20 });
                })()}
                {subscription && (
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '0.85rem', color: '#D4A043' }}>
                    {t('billingPlanLabel')}: {subscription.tier === 'coach-pro' 
                      ? t('plan.coachPro')
                      : t(`plan.${subscription.tier}`)}
                    {subscription.usage.analysesUsed > 0 && SUBSCRIPTION_PLANS[subscription.tier].limits.maxAnalysesPerPeriod !== -1 && (
                      <span> | {t('analysis.remainingAnalyses', { count: SUBSCRIPTION_PLANS[subscription.tier].limits.maxAnalysesPerPeriod - subscription.usage.analysesUsed })}</span>
                    )}
                  </span>
                )}
              </UploadSubtitle>
              
              <UploadButton>
                {isImprovementMode ? t('analysis.selectFile') : t('analysis.uploadNow')}
                <FileInput 
                  type="file" 
                  accept="video/*,image/*" 
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </UploadButton>
            </UploadContent>
          )}
        </UploadContainer>

        <PdfUploadWrapper>
          {pdfFile ? (
            <PdfFileInfo>
              <PdfIcon />
              <span>{pdfFile.name}</span>
              <RemovePdfBtnSmall onClick={handleRemovePdf} title={t('analysis.removeFile')}>
                <CloseIcon />
              </RemovePdfBtnSmall>
            </PdfFileInfo>
          ) : (
            <PdfUploadLabel>
              <PdfIcon />
              {t('analysis.attachScript')}
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handlePdfSelect} 
                style={{ display: 'none' }} 
                ref={pdfInputRef}
              />
            </PdfUploadLabel>
          )}
        </PdfUploadWrapper>

        {/* בחירת סוג ניתוח ל-Pro track - מופיע לכל ה-tracks כשהמשתמש בחבילת Pro */}
        {subscription?.tier === 'pro' && canUseFeature('advancedAnalysis') && (
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'center', 
            background: 'rgba(212, 160, 67, 0.1)', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            border: '1px solid rgba(212, 160, 67, 0.3)',
            marginBottom: '20px',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#D4A043', fontWeight: 600 }}>{t('analysis.analysisType')}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setAnalysisDepth('standard')}
                style={{
                  background: analysisDepth === 'standard' ? '#D4A043' : 'transparent',
                  border: '1px solid #D4A043',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: analysisDepth === 'standard' ? '#000' : '#D4A043',
                  fontFamily: 'Assistant, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {t('analysis.standard')}
              </button>
              <button
                onClick={() => setAnalysisDepth('deep')}
                style={{
                  background: analysisDepth === 'deep' ? '#D4A043' : 'transparent',
                  border: '1px solid #D4A043',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: analysisDepth === 'deep' ? '#000' : '#D4A043',
                  fontFamily: 'Assistant, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {t('analysis.deep')}
              </button>
            </div>
          </div>
        )}

        <InputWrapper>
          <MainInput 
            placeholder={isImprovementMode ? t('analysis.improvementPlaceholder') : t('analysis.descriptionPlaceholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <ActionButton 
            onClick={handleGenerate}
            disabled={loading || !isReady}
            $isReady={isReady}
            $isLoading={loading}
          >
            {loading ? t('analysis.watching') : (isImprovementMode ? t('analysis.analyzeImprovements') : t('analysis.action'))}
          </ActionButton>
          {selectedExperts.length < 3 && (
            <ErrorMsg>נא לבחור לפחות 3 מומחים כדי להמשיך</ErrorMsg>
          )}
        </InputWrapper>

        {result && (
          <ResponseArea id="results-area">
            <div id="analysis-content">
              {result.hook && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SectionTitleExternal>
                    <SubtleSparkleIcon /> {t('analysis.goldenTipTitle')} <SubtleSparkleIcon />
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <HookText>"{result.hook}"</HookText>
                  </CompactResultBox>
                </div>
              )}

              <SectionLabel style={{ textAlign: 'center', display: 'block', marginTop: '20px' }}>{t('analysis.expertPanel')}</SectionLabel>
              
              <ExpertsGrid>
                {result.expertAnalysis?.map((expert, idx) => (
                  <ExpertResultCard key={idx}>
                    <h4>{expert.role} <ExpertScore>{expert.score}</ExpertScore></h4>
                    
                    <ExpertSectionTitle><EyeIcon /> {t('analysis.professionalView')}</ExpertSectionTitle>
                    <ExpertText>{expert.insight}</ExpertText>
                    
                    <ExpertSectionTitle><BulbIcon /> {t('analysis.improvementTips')}</ExpertSectionTitle>
                    <ExpertText style={{ color: '#fff', fontWeight: 500 }}>{expert.tips}</ExpertText>
                  </ExpertResultCard>
                )) || <p style={{textAlign: 'center', color: '#666'}}>{t('analysis.loadingAnalysis')}</p>}
              </ExpertsGrid>

              {result.committee && (
                <CommitteeSection>
                  <SectionTitleExternal>
                     <SubtleDocumentIcon /> {t('analysis.committeeSummary')}
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <CommitteeText>{result.committee.summary}</CommitteeText>
                  </CompactResultBox>
                  
                  {result.committee.finalTips && result.committee.finalTips.length > 0 && (
                    <CommitteeTips data-pdf="committee-tips">
                      <h5>{t('analysis.winningTips')}</h5>
                      <ul>
                        {result.committee.finalTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </CommitteeTips>
                  )}
                  
                  {result.takeRecommendation && (() => {
                    const recText = result.takeRecommendation.toLowerCase();
                    const hasRetake = recText.includes('טייק נוסף') || 
                                     recText.includes('טייק חוזר') || 
                                     recText.includes('retake') ||
                                     recText.includes('another take') ||
                                     recText.includes('מומלץ לבצע') ||
                                     recText.includes('מומלץ טייק') ||
                                     recText.includes('need improvement') ||
                                     recText.includes('recommended');
                    const isReady = !hasRetake && (
                      recText.includes('ready') || 
                      recText.includes('מוכן') || 
                      recText.includes('להגיש') ||
                      recText.includes('ניתן') ||
                      recText.includes('ready to submit') ||
                      recText.includes('submit') ||
                      recText.includes('approve')
                    );
                    return (
                      <div style={{
                        background: isReady
                          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%)',
                        border: `2px solid ${isReady ? '#4CAF50' : '#FF9800'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        marginTop: '20px',
                        textAlign: (i18n.language || 'he').startsWith('en') ? 'left' : 'right',
                        direction: (i18n.language || 'he').startsWith('en') ? 'ltr' : 'rtl'
                      }}>
                        <h4 style={{
                          color: isReady ? '#4CAF50' : '#FF9800',
                          margin: '0 0 12px 0',
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          {isReady ? '✅' : '💡'} {isReady ? t('analysis.readyToSubmit') : t('analysis.suggestionsForImprovement')}
                        </h4>
                        <p style={{
                          margin: 0,
                          lineHeight: 1.7,
                          fontSize: '1.05rem',
                          color: '#e0e0e0',
                          fontWeight: 500
                        }}>
                          {result.takeRecommendation}
                        </p>
                      </div>
                    );
                  })()}
                  
                  <FinalScore data-pdf="final-score">
                    <span className="number">{averageScore}</span>
                    <span className="label">{t('analysis.viralScoreLabel')}</span>
                  </FinalScore>
                </CommitteeSection>
              )}
            </div>

            <ActionButtonsContainer>
              <PrimaryButton 
                onClick={handleExportPdf} 
                disabled={loading || !canUseFeature('pdfExport')}
                style={{
                  opacity: !canUseFeature('pdfExport') ? 0.5 : 1,
                  cursor: !canUseFeature('pdfExport') ? 'not-allowed' : 'pointer'
                }}
                title={!canUseFeature('pdfExport') ? t('alerts.pdfSubscriptionOnly') : ''}
              >
                {!canUseFeature('pdfExport') ? <NoEntryIcon /> : <PdfIcon />}
                {t('analysis.exportPdf')}
                {!canUseFeature('pdfExport') && <PremiumBadge>פרימיום</PremiumBadge>}
              </PrimaryButton>
              {activeTrack === 'coach' && canUseFeature('traineeManagement') && (
                <PrimaryButton onClick={handleSaveAnalysis} disabled={!result || !selectedTrainee || isSavingAnalysis}>
                  {isSavingAnalysis ? `💾 ${t('analysis.saving')}` : `💾 ${t('analysis.saveForTrainee')}`}
                </PrimaryButton>
              )}
              <SecondaryButton onClick={handleReset}>
                <RefreshIcon />
                התחל מחדש
              </SecondaryButton>
              <PrimaryButton 
                onClick={handleUploadImprovedTake}
                disabled={!canUseFeature('improvementTracking')}
                style={{
                  opacity: !canUseFeature('improvementTracking') ? 0.5 : 1,
                  cursor: !canUseFeature('improvementTracking') ? 'not-allowed' : 'pointer'
                }}
                title={!canUseFeature('improvementTracking') ? t('alerts.improvementTrackingSubscriptionOnly') : ''}
              >
                <UploadIconSmall />
                העלה טייק משופר
                {!canUseFeature('improvementTracking') && <PremiumBadge>פרימיום</PremiumBadge>}
              </PrimaryButton>
            </ActionButtonsContainer>

          </ResponseArea>
        )}
      </AppContainer>
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentSubscription={subscription}
        onSelectPlan={onSelectPlanFromSubscriptionModal}
        activeTrack={activeTrack}
      />
      
      <TakbullPaymentModal
        isOpen={showTakbullPayment}
        onClose={() => {
          setShowTakbullPayment(false);
          setIsProcessingPayment(false);
        }}
        paymentUrl={takbullPaymentUrl}
        orderReference={takbullOrderReference}
        onSuccess={async () => {
          console.log('✅ Payment completed successfully, reloading user data...');
          setShowTakbullPayment(false);
          setIsProcessingPayment(false);
          
          // Get current subscription tier before reload to determine oldTier
          const currentTier = subscription?.tier || profile?.subscription_tier || 'free';
          
          // Reload user data with polling - database might need time to update
          if (user) {
            try {
              // Verify user is still authenticated
              const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
              if (authError || !currentUser || currentUser.id !== user.id) {
                console.error('User authentication error after payment:', authError);
                return;
              }
              
              // Import helpers for direct DB queries
              const { getCurrentSubscription, getCurrentUserProfile } = await import('./src/lib/supabase-helpers');
              
              // Polling loop to check for tier update (every 2 seconds, max 30 seconds)
              let newTier = currentTier;
              let pollAttempts = 0;
              const maxPollAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max
              const pollInterval = 2000; // 2 seconds
              
              // First immediate check
                await loadUserData(currentUser, true);
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait for state update
              
              const checkTierUpdate = async (): Promise<string> => {
                // Force reload user data
                await loadUserData(currentUser, true);
                
                // Wait a bit for state to update
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Get fresh data directly from DB (more reliable than state)
                const newSub = await getCurrentSubscription(currentUser.id);
                const newProfile = await getCurrentUserProfile(true, currentUser.id);
                const detectedTier = newSub?.plans?.tier || (newProfile?.subscription_status === 'active' ? newProfile?.subscription_tier : null) || currentTier;
                
                // Update state directly if tier changed
                if (detectedTier !== currentTier && detectedTier !== 'free' && detectedTier !== null) {
                  // Force update profile and subscription state
                  if (newProfile) {
                    setProfile(newProfile);
                  }
                  if (newSub) {
                    const { getUsageForCurrentPeriod } = await import('./src/lib/supabase-helpers');
                    const usage = await getUsageForCurrentPeriod();
                    setSubscription({
                      tier: newSub.plans.tier as SubscriptionTier,
                      billingPeriod: newSub.billing_period as 'monthly' | 'yearly',
                      startDate: new Date(newSub.start_date),
                      endDate: new Date(newSub.end_date),
                      usage: {
                        analysesUsed: usage?.analysesUsed || 0,
                        lastResetDate: usage?.periodStart ? new Date(usage.periodStart) : new Date(newSub.start_date),
                      },
                      isActive: newSub.status === 'active',
                    });
                  }
                }
                
                return detectedTier;
              };
              
              // Check immediately
              newTier = await checkTierUpdate();
              
              // If tier already updated, proceed immediately
                if (newTier !== currentTier && newTier !== 'free' && newTier !== null) {
                console.log('🎉 Tier upgraded immediately after payment:', { fromTier: currentTier, toTier: newTier });
                  const timestamp = Date.now();
                navigate(`/?upgrade=success&from=${currentTier}&to=${newTier}&_t=${timestamp}`, { replace: true });
                  return;
                }
                
              // Poll for updates
              const pollForTierUpdate = async (): Promise<string | null> => {
                while (pollAttempts < maxPollAttempts) {
                  pollAttempts++;
                  console.log(`🔄 Polling for tier update (attempt ${pollAttempts}/${maxPollAttempts})...`);
                  
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  
                  const detectedTier = await checkTierUpdate();
                  
                  if (detectedTier !== currentTier && detectedTier !== 'free' && detectedTier !== null) {
                    console.log('🎉 Tier upgraded after polling:', { fromTier: currentTier, toTier: detectedTier, attempts: pollAttempts });
                    return detectedTier;
                  }
                }
                
                return null;
              };
              
              // Start polling
              const finalTier = await pollForTierUpdate();
              
              if (finalTier && finalTier !== currentTier) {
                // Tier was updated during polling
              const timestamp = Date.now();
                navigate(`/?upgrade=success&from=${currentTier}&to=${finalTier}&_t=${timestamp}`, { replace: true });
              } else {
                // Tier not updated yet, but redirect anyway - upgrade detection will handle it
                console.warn('⚠️ Tier not updated after polling, redirecting anyway:', { currentTier, finalTier, pollAttempts });
                const timestamp = Date.now();
                navigate(`/?upgrade=success&from=${currentTier}&to=${currentTier}&_t=${timestamp}`, { replace: true });
              }
            } catch (error) {
              console.error('Error reloading user data after payment:', error);
              // Simple fallback: reload page
              window.location.reload();
            }
          }
        }}
        onError={(error) => {
          console.error('Payment error:', error);
          alert(t('alerts.paymentError', { error: String(error) }));
        }}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthModalMode('initial');
          setAuthModalUpgradePackage(null);
          setRedeemCodeFromUrl(null);
          setRedeemPackageFromUrl(null);
          updatingSubscriptionRef.current = false;
          setIsUpdatingSubscription(false);
        }}
        mode={authModalMode}
        initialPackageForUpgrade={authModalUpgradePackage ?? redeemPackageFromUrl}
        initialPackage={redeemPackageFromUrl}
        initialRedeemCode={redeemCodeFromUrl}
        currentUser={user ?? null}
        onAuthSuccess={() => {}}
        onUpgradeComplete={(tier) => {
          setShowAuthModal(false);
          setAuthModalMode('initial');
          setAuthModalUpgradePackage(null);
          handleSelectPlan(tier, 'monthly');
        }}
      />
      
      <PackageSelectionModal
        isOpen={showPackageSelectionModal}
        onClose={() => {
          setShowPackageSelectionModal(false);
        }}
        onSelect={async (tier) => {
          setPendingSubscriptionTier(tier);
          const isPaidTier = tier !== 'free';
          if (isPaidTier && user) {
            setShowPackageSelectionModal(false);
            // If user already provided upgrade details previously (name + phone), skip upgrade form.
            // Go straight to payment/upgrade flow.
            const hasUpgradeDetails = !!profile?.full_name?.trim?.() && !!profile?.phone?.trim?.();
            if (hasUpgradeDetails) {
              handleSelectPlan(tier, 'monthly');
              return;
            }
            setAuthModalMode('upgrade');
            setAuthModalUpgradePackage(tier);
            setShowAuthModal(true);
            return;
          }
          if (isPaidTier && !user) {
            setShowPackageSelectionModal(false);
            setShowAuthModal(true);
            setAuthModalMode('initial');
            setAuthModalUpgradePackage(null);
            return;
          }
          setShowPackageSelectionModal(false);
          if (tier === 'free') {
            if (!hasShownTrackModal) {
              setHasShownTrackModal(true);
              setShowTrackSelectionModal(true);
            }
          }
        }}
        userEmail={user?.email}
        currentTier={subscription?.tier || profile?.subscription_tier || 'free'}
      />
      
      <TrackSelectionModal
        isOpen={showTrackSelectionModal}
        onClose={() => {
          // Allow closing - user can skip track selection if they want
          setShowTrackSelectionModal(false);
          // After closing track selection after upgrade, sign out
          if (typeof window !== 'undefined') {
            const hasUpgradeFlag = localStorage.getItem('pending_package_upgrade') === 'true';
            if (!hasUpgradeFlag) {
              localStorage.setItem('pending_package_upgrade', 'true');
            }
          }
          setTimeout(async () => {
            await handleLogout();
          }, 500);
        }}
        subscriptionTier={pendingSubscriptionTier || subscription?.tier || upgradeToTier || 'free'}
        existingTracks={(() => {
          // Get existing tracks from profile - check both selected_tracks and selected_primary_track
          const tracks = profile?.selected_tracks && profile.selected_tracks.length > 0
            ? profile.selected_tracks
            : profile?.selected_primary_track
            ? [profile.selected_primary_track]
            : [];
          // Removed excessive logging - only log if debug mode or on initial mount
          // console.log('📋 TrackSelectionModal existingTracks:', tracks, 'from profile:', {
          //   hasProfile: !!profile,
          //   selected_tracks: profile?.selected_tracks,
          //   selected_primary_track: profile?.selected_primary_track
          // });
          return tracks;
        })()}
        mode="add"
        onSelect={async (trackIds) => {
          setActiveTrack(trackIds[0]);
          setShowTrackSelectionModal(false);
          if (user) {
            await loadUserData(user, true);
            // נשארים מחוברים – בלי התנתקות אחרי בחירת תחום
          }
        }}
      />
      
      <UpgradeBenefitsModal
        isOpen={showUpgradeBenefitsModal}
        onClose={() => {
          setShowUpgradeBenefitsModal(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pending_package_upgrade');
          }
          // נשארים בפרופיל – בלי התנתקות אחרי תשלום
        }}
        onContinueToTrackSelection={undefined}
        oldTier={upgradeFromTier}
        newTier={upgradeToTier}
        currentTracks={
          profile?.selected_tracks && profile.selected_tracks.length > 0
            ? profile.selected_tracks
            : profile?.selected_primary_track
            ? [profile.selected_primary_track]
            : []
        }
        onSelectTrack={async (trackId, shouldCloseModal = true) => {
          // Add the new track to user's selected tracks
          // Make sure to include all current tracks (from selected_tracks or primary_track)
          const existingTracks = profile?.selected_tracks && profile.selected_tracks.length > 0
            ? profile.selected_tracks
            : profile?.selected_primary_track
            ? [profile.selected_primary_track]
            : [];
          
          // Ensure we don't add duplicate tracks
          const newTracks = existingTracks.includes(trackId)
            ? existingTracks
            : [...existingTracks, trackId];
          
          // Set primary track to the first track in the array (for creator tier compatibility)
          const primaryTrack = newTracks.length > 0 ? newTracks[0] : null;
          
          try {
            const { updateCurrentUserProfile } = await import('./src/lib/supabase-helpers');
            await updateCurrentUserProfile({
              selected_tracks: newTracks,
              selected_primary_track: primaryTrack as any,
            });
            
            // IMMEDIATELY reload user data to get updated profile (no delay)
            if (user) {
              await loadUserData(user, true);
              console.log('✅ Subscription refreshed IMMEDIATELY after track update');
            }
            
            // Only close modal if explicitly requested (for single track selection)
            if (shouldCloseModal) {
              setShowUpgradeBenefitsModal(false);
            }
          } catch (error) {
            console.error('Error adding track:', error);
            alert(t('alerts.addTrackError'));
          }
        }}
        onFinishTrackSelection={async () => {
          // After finishing track selection, IMMEDIATELY reload user data (no delay)
          if (user) {
            await loadUserData(user, true);
            console.log('✅ Subscription refreshed IMMEDIATELY after track selection');
          }
        }}
      />
    </>
  );
};
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/settings" element={<App />} />
        <Route path="/admin" element={<App />} />
        <Route path="/analysis/:analysisId?" element={<App />} />
        <Route path="/creator" element={<App />} />
        <Route path="/order-received" element={<OrderReceivedPage />} />
        <Route path="/payment-redirect" element={<PaymentRedirectPage />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<AppRouter />);