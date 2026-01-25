import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { GlobalStyle, fadeIn, shimmer, pulse, glowReady, breathingHigh } from './src/styles/globalStyles';
import { SettingsPage } from './src/components/pages/SettingsPage';
import { AdminPage } from './src/components/pages/AdminPage';
import { OrderReceivedPage } from './src/components/pages/OrderReceivedPage';
import { SubscriptionModal } from './src/components/modals/SubscriptionModal';
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
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Profile & Subscription cache helpers
  const PROFILE_CACHE_KEY = 'viral_profile_cache';
  const SUBSCRIPTION_CACHE_KEY = 'viral_subscription_cache';
  
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
      return cached ? JSON.parse(cached) : null;
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
    } catch (e) {
      console.warn('Failed to clear cache:', e);
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
    clearProfileCache(); // Clear cached profile on logout
  };

  // Auto-save subscription to cache whenever it changes
  useEffect(() => {
    if (subscription) {
      saveSubscriptionToCache(subscription);
    }
  }, [subscription]);

  // Admin state is managed by loadUserData - no fast-path needed here

  // Initialize Supabase Auth
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let isLoadingUserData = false; // Flag to prevent duplicate loadUserData calls
    
    // Load cached profile & subscription immediately for instant UI (prevents email flash on refresh)
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      console.log('⚡ Loaded profile from cache for instant display');
      setProfile(cachedProfile);
    }
    
    const cachedSubscription = loadSubscriptionFromCache();
    if (cachedSubscription) {
      console.log('⚡ Loaded subscription from cache for instant display');
      setSubscription(cachedSubscription);
    }
    
    // Set up BroadcastChannel to sync subscription updates across multiple tabs/windows
    const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
      ? new BroadcastChannel('viraly-subscription-sync') 
      : null;
    
    // Listen for subscription updates from other tabs/windows
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        // Silent reload when subscription is updated in another tab (to reduce console noise)
        if (event.data.type === 'subscription-updated' && user && user.id === event.data.userId) {
          setTimeout(async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser && currentUser.id === user.id) {
              await loadUserData(currentUser, true);
            }
          }, 500);
        }
      };
    }
    
    // Try to get session quickly, but don't block UI if it takes too long
    // Set a timeout to ensure loadingAuth is always set to false, even if getSession hangs
    timeoutId = setTimeout(() => {
      if (mounted) {
        // Silently allow UI to render - onAuthStateChange will handle session when ready
        setLoadingAuth(false);
      }
    }, 5000); // 5 second timeout (reduced for better UX)
    
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
        
        // Don't load user data here - let onAuthStateChange handle it to avoid duplicates
        // onAuthStateChange will fire immediately after getSession returns a session
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ Error in getSession promise:', error);
        if (mounted) {
          setLoadingAuth(false);
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
        // Prevent duplicate loadUserData calls
        if (isLoadingUserData) {
          // Silent skip - no need to log every duplicate call
          return;
        }
        
        isLoadingUserData = true;
        try {
          // Small delay for trigger to complete (only for sign-in/sign-up, not for page refresh)
          if (event === 'SIGNED_IN' && window.location.pathname !== '/admin') {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Force refresh after signup/signin or INITIAL_SESSION (page refresh) to ensure latest profile data is loaded
          const shouldForceRefresh = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION';
          await loadUserData(session.user, shouldForceRefresh);
        } catch (err) {
          console.error('Error loading user data in auth state change:', err);
          // Don't block UI if user data loading fails
        } finally {
          isLoadingUserData = false;
        }
      } else {
        // Only reset state if this is not INITIAL_SESSION (which might have null session temporarily)
        // INITIAL_SESSION with null session means user is truly logged out
        if (event !== 'INITIAL_SESSION') {
          // User logged out - reset all state
          resetUserState();
        } else {
          // On INITIAL_SESSION with no session, user is logged out - reset state
          resetUserState();
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Load user data from Supabase (with protection against duplicate calls)
  const loadUserData = async (currentUser: User, forceRefresh = false) => {
    try {
      // Only log if forceRefresh is true or if it's a significant call
      if (forceRefresh) {
        console.log('🔄 loadUserData called', { userId: currentUser.id, forceRefresh });
      }
      setIsLoadingProfile(true);
      
      // Verify user is still authenticated before loading data
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (!verifiedUser || verifiedUser.id !== currentUser.id) {
        console.warn('User changed or logged out during loadUserData');
        setIsLoadingProfile(false);
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
      // Add retry logic if profile not found (especially after signup)
      let userProfile = await getCurrentUserProfile(forceRefresh);
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!userProfile && retryCount < maxRetries) {
        console.log(`[loadUserData] Profile not found, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 1s, 2s, 3s delays
        userProfile = await getCurrentUserProfile(true); // Force refresh on retry
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
      
      // Verify user is still authenticated after profile load
      const { data: { user: verifiedUser2 } } = await supabase.auth.getUser();
      if (!verifiedUser2 || verifiedUser2.id !== currentUser.id) {
        console.warn('User changed or logged out during loadUserData');
        return;
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
        
        setProfile(userProfile);
        // Cache profile for instant load on refresh
        saveProfileToCache(userProfile);
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

      // Load subscription first to check if user has paid subscription
      const subData = await getCurrentSubscription();
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
      
      // If admin, ensure admin page data is fresh (silent - no logs)
      if (adminStatus && window.location.pathname === '/admin') {
        // Admin access confirmed - no need to log
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
      if (subscription?.tier !== finalTier) {
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
      // Always load fresh usage data to ensure accuracy
      const usageData = await getUsageForCurrentPeriod();
      if (usageData) {
        setUsage(usageData);
        // Update subscription with current usage, but preserve tier and other subscription data
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
  };

  // Check for upgrade success parameter and show UpgradeBenefitsModal
  // This must be after all state and function declarations
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const upgradeParam = searchParams.get('upgrade');
    const fromTier = searchParams.get('from') as SubscriptionTier | null;
    const toTier = searchParams.get('to') as SubscriptionTier | null;
    
    if (upgradeParam === 'success' && fromTier && toTier) {
      // Set the tiers immediately
      setUpgradeFromTier(fromTier);
      setUpgradeToTier(toTier);
      
      // Set flag in localStorage to show logout message for ALL upgrades
      // This ensures users know they need to re-login for the upgrade to take effect
      // IMPORTANT: This includes coach->coach-pro upgrades
      const isCoachToCoachPro = fromTier === 'coach' && toTier === 'coach-pro';
      if ((fromTier !== toTier || isCoachToCoachPro) && typeof window !== 'undefined') {
        localStorage.setItem('pending_package_upgrade', 'true');
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
        
        // Reload user data in background to update subscription state and profile
        // This ensures profile is loaded for track selection
        if (user) {
        setTimeout(async () => {
          try {
              console.log('🔄 Reloading user data after upgrade modal opens');
            await loadUserData(user, true);
          } catch (e) {
            console.error('Error reloading user data after upgrade:', e);
          }
        }, 500);
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
  }, [location.search, user, profile, navigate, location.pathname]);

  useEffect(() => {
    const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
    const maxExperts = getMaxExperts();
    const defaults = EXPERTS_BY_TRACK[trackToUse].slice(0, Math.min(3, maxExperts)).map(e => e.title);
    setSelectedExperts(defaults);
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

  // Subscription Management Functions
  const handleSelectPlan = async (tier: SubscriptionTier, period: BillingPeriod) => {
    console.log('🔔 handleSelectPlan called:', { tier, period, user: user?.email, isUpdatingSubscription });
    
    if (!user) {
      alert('יש להיכנס למערכת תחילה');
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

    // Direct upgrade without payment (temporarily - for testing)
    // Update subscription directly for all tiers
    try {
      console.log('🔄 Updating subscription directly (no payment)...');
      console.log('🔍 Updating to tier:', tier, 'period:', period);
      
      // Update profile subscription tier directly
      console.log('📝 Attempting to update profile:', { userId: user.id, tier, period });
      
      // First, get the plan from Supabase to ensure it exists
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .single();
      
      if (planError || !planData) {
        console.error('❌ Plan not found in database:', { tier, planError });
        throw new Error(`חבילה לא נמצאה במסד הנתונים: ${tier}. אנא ודא שהמיגרציה 020 רצה.`);
      }
      
      console.log('✅ Plan found in database:', { id: planData.id, name: planData.name, price: planData.monthly_price });
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_period: period,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
        throw new Error(`שגיאה בעדכון החבילה: ${updateError.message}`);
      }

      if (!updateData || updateData.length === 0) {
        console.error('❌ No rows updated - check RLS policies or user permissions');
        throw new Error('לא נמצא פרופיל לעדכון. בדוק הרשאות או נסה שוב.');
      }

      console.log('✅ Profile updated successfully:', updateData);
      
      // Verify the update was applied
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_period, subscription_status')
        .eq('user_id', user.id)
        .single();
      
      if (verifyError) {
        console.error('⚠️ Error verifying update:', verifyError);
      } else {
        console.log('✅ Verified profile update:', verifyData);
        if (verifyData.subscription_tier !== tier) {
          console.error('❌ Update verification failed - tier mismatch:', { expected: tier, actual: verifyData.subscription_tier });
          throw new Error('העדכון לא הצליח - החבילה לא עודכנה במסד הנתונים');
        }
      }

      // Immediately update local state to reflect the change
      console.log('🔄 Updating local state immediately...');
      
      // Update profile state immediately
      if (profile) {
        const updatedProfile = {
          ...profile,
          subscription_tier: tier,
          subscription_period: period,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        };
        setProfile(updatedProfile);
        console.log('✅ Profile state updated locally:', updatedProfile);
      }
      
      // Update subscription state immediately
      const subscriptionPlanData = SUBSCRIPTION_PLANS[tier];
      if (subscriptionPlanData) {
        const newSubscription: UserSubscription = {
          tier,
          billingPeriod: period,
          startDate: new Date(),
          endDate: period === 'monthly' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          usage: {
            analysesUsed: 0,
            lastResetDate: new Date(),
          },
          isActive: true,
        };
        setSubscription(newSubscription);
        console.log('✅ Subscription state updated locally:', newSubscription);
      }

      // Reload user data in background to sync with database
      if (user) {
        console.log('🔄 Reloading user data from database to sync...');
        // Don't await - let it happen in background while UI updates immediately
        loadUserData(user, true).then(() => {
          console.log('✅ User data synced from database');
        }).catch((reloadError) => {
          console.error('⚠️ Error syncing user data:', reloadError);
          // Continue - local state is already updated
        });
      }

      // Close modals immediately
      setShowSubscriptionModal(false);
      setShowPackageSelectionModal(false);

      alert(`החבילה עודכנה בהצלחה ל-${SUBSCRIPTION_PLANS[tier]?.name || tier}`);
      
    } catch (error: any) {
      console.error('❌ Error in handleSelectPlan:', error);
      alert(error.message || 'אירעה שגיאה בעדכון החבילה. נסה שוב.');
    } finally {
      console.log('🔄 Resetting isUpdatingSubscription flag');
      updatingSubscriptionRef.current = false;
      setIsUpdatingSubscription(false);
    }
    
    return;

    // Only for FREE tier - update directly without payment
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
      alert('אירעה שגיאה בשמירת המנוי. נסה שוב.');
    }
  };

  const checkSubscriptionLimits = async (): Promise<{ allowed: boolean; message?: string }> => {
    // If no subscription, treat as free tier
    const effectiveTier = subscription?.tier || 'free';
    const effectiveSubscription = subscription || {
      tier: 'free' as SubscriptionTier,
      billingPeriod: 'monthly' as BillingPeriod,
      startDate: new Date(),
      endDate: new Date(),
      usage: { analysesUsed: 0, lastResetDate: new Date() },
      isActive: true,
    };

    const plan = SUBSCRIPTION_PLANS[effectiveTier];
    if (!plan) {
      console.error('❌ Invalid tier:', effectiveTier);
      return { allowed: false, message: 'חבילה לא תקינה. נא ליצור קשר עם התמיכה.' };
    }
    
    // Check if subscription is active (for paid tiers)
    if (effectiveTier !== 'free') {
      if (!effectiveSubscription.isActive || new Date() > effectiveSubscription.endDate) {
        return { allowed: false, message: 'המנוי פג תוקף. יש לחדש את המנוי' };
      }
    }

    // Get current usage from database (always fresh - counts by current month)
    // If this fails or returns null, allow analysis (better UX than blocking)
    let currentUsage;
    try {
      currentUsage = await getUsageForCurrentPeriod();
    } catch (error: any) {
      // Allow analysis if check fails
      return { allowed: true };
    }
    
    if (!currentUsage) {
      // Allow analysis if usage check fails - usage will be counted when analysis is saved
      return { allowed: true };
    }

    const analysesUsed = currentUsage.analysesUsed;
    const minutesUsed = currentUsage.minutesUsed || 0;
    const analysesLimit = plan.limits.maxAnalysesPerPeriod;
    const minutesLimit = plan.limits.maxVideoMinutesPerPeriod;

    // For coach/coach-pro: Check ONLY minutes (analyses are unlimited)
    if (effectiveTier === 'coach' || effectiveTier === 'coach-pro') {
      if (minutesLimit === -1) {
        // Unlimited minutes too
        return { allowed: true };
      } else if (minutesUsed >= minutesLimit) {
        return { 
          allowed: false, 
          message: `סיימת את הדקות המוקצות בחודש הנוכחי (${minutesUsed}/${minutesLimit} דקות). יתאפס בתחילת החודש הבא או שדרג לחבילה גבוהה יותר` 
        };
      }
      // Within minutes limit - allow (analyses are unlimited)
      return { allowed: true };
    }

    // For other tiers: Check BOTH analyses AND minutes - whichever comes first blocks
    // FREE tier: Only 1 analysis (no minutes limit)
    if (effectiveTier === 'free') {
      if (analysesUsed >= analysesLimit) {
        const now = new Date();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          allowed: false, 
          message: `סיימת את ניתוח הטעימה החינמי (${analysesLimit} ניתוח). ניתוח נוסף יתאפשר בעוד ${daysLeft} ימים (תחילת חודש הבא) או שדרג לחבילה משלמת כדי להמשיך` 
        };
      }
      return { allowed: true };
    }

    // For paid tiers (creator, pro): Check BOTH limits
    // First check: analyses limit
    if (analysesLimit !== -1 && analysesUsed >= analysesLimit) {
      return { 
        allowed: false, 
        message: `סיימת את הניתוחים בחודש הנוכחי (${analysesUsed}/${analysesLimit}). יתאפס בתחילת החודש הבא או שדרג לחבילה גבוהה יותר` 
      };
    }

    // Second check: minutes limit
    if (minutesLimit !== -1 && minutesUsed >= minutesLimit) {
      return { 
        allowed: false, 
        message: `סיימת את הדקות המוקצות בחודש הנוכחי (${minutesUsed}/${minutesLimit} דקות). יתאפס בתחילת החודש הבא או שדרג לחבילה גבוהה יותר` 
      };
    }

    // Both limits OK
    return { allowed: true };
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
      return trackId === profile.selected_primary_track;
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
          alert(`מקסימום ${maxExperts} מומחים זמינים בחבילה שלך. יש לשדרג את החבילה לבחור מומחים נוספים.`);
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
      alert(`הקובץ גדול מדי. מגבלה: ${limitText}.`);
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
          alert(`הסרטון חורג מהמגבלה: ${limitText}.`);
          URL.revokeObjectURL(objectUrl);
          resetInput();
          return;
        }
        finalizeSelection();
      };

      videoEl.onerror = () => {
        alert("לא ניתן לקרוא את המטא-דאטה של הווידאו. נסה קובץ אחר.");
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
        alert("נא להעלות קובץ PDF בלבד");
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

    if (activeTrack === 'coach' && !selectedTrainee) {
      alert('נא לבחור מתאמן לפני שמירת הניתוח');
      setShowCoachDashboard(true);
      return;
    }

    setIsSavingAnalysis(true);
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
      alert(`הניתוח נשמר בהצלחה${trainee ? ` עבור ${trainee.name}` : ''}`);
      
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
          // Force refresh from database to get accurate count
          try {
            // Wait a moment for database to commit
            await new Promise(resolve => setTimeout(resolve, 500));
            const updatedUsage = await getUsageForCurrentPeriod();
            if (updatedUsage) {
              setUsage(updatedUsage);
              // Also update subscription state with usage
              setSubscription(prev => prev ? {
                ...prev,
                usage: {
                  analysesUsed: updatedUsage.analysesUsed,
                  lastResetDate: updatedUsage.periodStart,
                },
              } : null);
            }
          } catch (usageError) {
            // Retry multiple times to ensure update
            for (let i = 0; i < 3; i++) {
              setTimeout(async () => {
                try {
                  const retryUsage = await getUsageForCurrentPeriod();
                  if (retryUsage) {
                    setUsage(retryUsage);
                    setSubscription(prev => prev ? {
                      ...prev,
                      usage: {
                        analysesUsed: retryUsage.analysesUsed,
                        lastResetDate: retryUsage.periodStart,
                      },
                    } : null);
                  }
                } catch (retryError) {
                  // Ignore retry errors
                }
              }, (i + 1) * 1000);
            }
          }
          
          // Notify other tabs/components that analysis was saved
          try {
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
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const updatedUsage = await getUsageForCurrentPeriod();
            if (updatedUsage) {
              setUsage(updatedUsage);
              setSubscription(prev => prev ? {
                ...prev,
                usage: {
                  analysesUsed: updatedUsage.analysesUsed,
                  lastResetDate: updatedUsage.periodStart,
                },
              } : null);
            }
          } catch (usageError) {
            // Retry multiple times
            for (let i = 0; i < 3; i++) {
              setTimeout(async () => {
                try {
                  const retryUsage = await getUsageForCurrentPeriod();
                  if (retryUsage) {
                    setUsage(retryUsage);
                    setSubscription(prev => prev ? {
                      ...prev,
                      usage: {
                        analysesUsed: retryUsage.analysesUsed,
                        lastResetDate: retryUsage.periodStart,
                      },
                    } : null);
                  }
                } catch (retryError) {
                  // Ignore retry errors
                }
              }, (i + 1) * 1000);
            }
          }
          
          // Notify other tabs/components that analysis was saved
          try {
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
      alert('אירעה שגיאה בשמירת הניתוח. נסה שוב.');
    } finally {
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
      alert('מתאמן לא נמצא');
      return;
    }

    const traineeAnalyses = savedAnalyses
      .filter(a => a.traineeId === traineeId)
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime());

    if (traineeAnalyses.length === 0) {
      alert('אין ניתוחים שמורים עבור מתאמן זה');
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
      alert('לא ניתן לפתוח חלון חדש. אנא אפשר חלונות קופצים בדפדפן.');
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
      alert('יצוא ל-PDF זמין לחבילות מנוי בלבד. יש לשדרג את החבילה.');
      setShowSubscriptionModal(true);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('נא לאפשר חלונות קופצים כדי לייצא ל-PDF.');
      return;
    }

    // Build HTML content directly from result object to ensure all data is included
    const buildAnalysisHTML = () => {
      let html = '';

      // Hook (Golden Tip)
      if (result.hook) {
        html += `
          <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-right: 4px solid #b8862e; page-break-inside: avoid; break-inside: avoid;">
            <h3 style="color: #b8862e; margin: 0 0 10px 0; font-size: 1.2rem;">✨ טיפ זהב של הפאנל</h3>
            <p style="margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.6;">"${result.hook}"</p>
          </div>
        `;
      }

      // Expert Analysis
      if (result.expertAnalysis && result.expertAnalysis.length > 0) {
        html += '<h3 class="section-title" style="page-break-after: avoid; break-after: avoid;">ניתוח פאנל המומחים</h3>';
        html += '<div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 25px;">';
        
        result.expertAnalysis.forEach((expert) => {
          html += `
            <div class="card" style="page-break-inside: avoid; break-inside: avoid;">
              <h4 style="color: #b8862e; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center; page-break-after: avoid; break-after: avoid;">
                ${expert.role}
                <span class="score-badge">${expert.score}</span>
              </h4>
              <div style="margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
                <strong class="subtle-label" style="display: block; margin-bottom: 8px;">זווית מקצועית:</strong>
                <p style="margin: 0; line-height: 1.7; orphans: 3; widows: 3;">${expert.insight}</p>
              </div>
              <div style="page-break-inside: avoid; break-inside: avoid;">
                <strong class="subtle-label" style="display: block; margin-bottom: 8px;">טיפים לשיפור:</strong>
                <p style="margin: 0; line-height: 1.7; font-weight: 500; orphans: 3; widows: 3;">${expert.tips}</p>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
      }

      // Committee Summary
      if (result.committee) {
        html += '<h3 class="section-title">סיכום ועדת המומחים</h3>';
        html += '<div class="card" style="margin-bottom: 20px; page-break-inside: avoid;">';
        html += `<p style="margin: 0; line-height: 1.7; font-size: 1.05rem;">${result.committee.summary}</p>`;
        html += '</div>';

        // Committee Tips (Final Tips)
        if (result.committee.finalTips && result.committee.finalTips.length > 0) {
          html += `
            <div data-pdf="committee-tips" style="page-break-inside: avoid;">
              <h5>טיפים מנצחים לעתיד:</h5>
              <ul>
                ${result.committee.finalTips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // Take Recommendation
        if (result.takeRecommendation) {
          const recText = result.takeRecommendation.toLowerCase();
          const hasRetake = recText.includes('טייק נוסף') || 
                           recText.includes('טייק חוזר') || 
                           recText.includes('retake') ||
                           recText.includes('מומלץ לבצע') ||
                           recText.includes('מומלץ טייק');
          const isReady = !hasRetake && (
            recText.includes('ready') || 
            recText.includes('מוכן') || 
            recText.includes('להגיש') ||
            recText.includes('ניתן')
          );
          const recommendationColor = isReady ? '#4CAF50' : '#FF9800';
          html += `
            <div class="card" style="margin-bottom: 20px; page-break-inside: avoid; border-right: 4px solid ${recommendationColor}; background: ${isReady ? '#f1f8f4' : '#fff8f0'};">
              <h4 style="color: ${recommendationColor}; margin: 0 0 12px 0; font-size: 1.15rem; font-weight: 700;">
                ${isReady ? '✅ מוכן להגשה!' : '💡 הצעות לשיפור:'}
              </h4>
              <p style="margin: 0; line-height: 1.7; font-size: 1.05rem; color: #2b2b2b; font-weight: 500;">
                ${result.takeRecommendation}
              </p>
            </div>
          `;
        }
      }

      // Final Score
      html += `
        <div data-pdf="final-score">
          <span class="number">${averageScore}</span>
          <span class="label">ציון ויראליות משוקלל</span>
        </div>
      `;

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
      .section-title {
        margin: 18px 0 10px;
        padding: 8px 12px;
        background: #fff7e6;
        border: 1px solid #f1e0c3;
        border-radius: 8px;
        color: #b0751f;
        font-weight: 800;
        page-break-after: avoid;
        break-after: avoid;
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
    doc.open();
    doc.write(`
      <html dir="rtl">
        <head>
          <title>דו"ח ניתוח וידאו</title>
        </head>
        <body>
          <div class="export-wrapper">
            <div class="export-header">
              <div class="export-header-text">
              <h2>דו"ח ניתוח - Video Director Pro</h2>
              <div class="export-note">נוצר במסלול פרימיום • ${new Date().toLocaleString('he-IL')}</div>
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
    console.log('🎬 handleGenerate called', { 
      hasPrompt: !!prompt.trim(), 
      hasFile: !!file, 
      selectedExpertsCount: selectedExperts.length,
      selectedExperts: selectedExperts,
      isReady: (!!prompt.trim() || !!file) && selectedExperts.length >= 3,
      userIsAdmin: userIsAdmin,
      user: user?.email,
      subscription: subscription?.tier,
      activeTrack: activeTrack
    });
    
    if ((!prompt.trim() && !file) || selectedExperts.length < 3) {
      console.warn('⚠️ Cannot start analysis:', {
        reason: !prompt.trim() && !file ? 'No prompt or file' : 'Less than 3 experts selected',
        selectedExperts: selectedExperts.length,
        hasFile: !!file
      });
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      alert('עליך להרשם תחילה כדי לבצע ניתוח.');
      setShowAuthModal(true);
      return;
    }
    
    // Check if current track is available for user's subscription
    const trackAvailable = isTrackAvailable(activeTrack);
    console.log('🔍 Track availability check:', { 
      activeTrack, 
      trackAvailable, 
      userIsAdmin,
      subscription: subscription?.tier 
    });
    if (!trackAvailable) {
      console.warn('⚠️ Track not available for user');
      alert('תחום זה אינו כלול בחבילה שלך. יש לשדרג את החבילה לבחור תחומים נוספים.');
      setShowSubscriptionModal(true);
      return;
    }
    
    // Check feature access for coach track - must have premium subscription
    if (activeTrack === 'coach' && !canUseFeature('traineeManagement')) {
      alert('מסלול הפרימיום זמין למאמנים, סוכנויות ובתי ספר למשחק בלבד. יש לשדרג את החבילה.');
      setShowSubscriptionModal(true);
      return;
    }
    
    console.log('✅ All checks passed, starting analysis...');
    
    // Start playing video immediately when analysis begins (muted and loop)
    if (videoRef.current && file?.type.startsWith('video')) {
        videoRef.current.muted = true;
        videoRef.current.loop = true;
        videoRef.current.play().catch(e => console.log('Playback not allowed:', e));
    }

    setLoading(true);
    console.log('🔄 Loading state set to true');
    
    try {
      console.log('🔑 Checking API key...');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        alert("חסר מפתח API. נא להגדיר VITE_GEMINI_API_KEY בסביבת ההרצה.");
        setLoading(false);
        return;
      }

      console.log('🤖 Creating AI instance...');
      const ai = new GoogleGenAI({ apiKey });
      const expertPanel = selectedExperts.join(', ');

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
      const depthInstruction = isDeepAnalysis ? `
        
        ANALYSIS DEPTH: DEEP & PROFESSIONAL ANALYSIS MODE
        - Provide extremely detailed, comprehensive, and thorough analysis
        - Include specific timestamps references when relevant (e.g., "בדקה 2:15...")
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

      const systemInstruction = `
        You are "Viraly", a world-class Video Director and Analyst.
        Current Mode: ${trackToUse}${activeTrack === 'coach' ? ' (Coach Edition - Training Track)' : ''}.
        Panel: ${expertPanel}.
        ${depthInstruction}
        
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

        Return the result as a raw JSON object with this exact structure (Keys must be English, Values MUST be Hebrew):
        {
          "expertAnalysis": [
            {
              "role": "Expert Title (Hebrew)",
              "insight": "Deep professional analysis from this expert's unique POV. Must include: track-specific professional perspective, balanced praise and criticism, text/content analysis if applicable, key moments identification, and specific professional insights. (Hebrew only)",
              "tips": "Actionable, specific, professional tips for improvement relevant to this track's expertise. High-value, authentic, and implementable advice. (Hebrew only)",
              "score": number (1-100, authentic professional assessment)
            }
          ],
          "hook": "The 'Golden Tip'. A single, explosive, game-changing sentence. It must be the absolute secret weapon for this specific video. Phrased as a direct, powerful, and unforgettable command that will transform the user's career. (Hebrew only)",
          "committee": {
            "summary": "A comprehensive summary from the entire committee, synthesizing the views. Must include: overall professional assessment, key strengths and weaknesses, significant moments analysis, and final recommendation on whether to submit/upload current take or do another take with specific improvements needed. (Hebrew only)",
            "finalTips": ["Professional tip 1 (Hebrew)", "Professional tip 2 (Hebrew)", "Professional tip 3 (Hebrew)"]
          },
          "takeRecommendation": "Honest professional recommendation in Hebrew: If ready - say 'מוכן להגשה' and explain why. If needs improvement - say 'מומלץ טייק נוסף' and give friendly suggestions. NO ENGLISH - Hebrew only!"
        }

        Important:
        - "expertAnalysis" array must contain an object for EACH selected expert in the panel.
        - Each expert's insight must reflect their unique professional expertise for the selected track.
        - "hook" is NOT a suggestion for a video hook. It is the "Golden Insight" of the analysis.
        - "score" for each expert must be authentic (1-100) based on professional standards.
        - "takeRecommendation" must be honest - assess if the take is ready or needs improvement.
        - Use purely Hebrew professional terms.
        - Do not use Markdown formatting inside the JSON strings.
        - Balance praise and criticism authentically - be professional, not overly positive or negative.
        ${((activeTrack === 'coach' || activeTrack === 'pro') && analysisDepth === 'deep') ? `
        - For DEEP analysis: Be extremely detailed, include specific examples, timestamps when possible, multiple layers of feedback, and comprehensive recommendations.
        ` : ''}
      `;

      console.log('📦 Building parts array...');
      const parts = [];
      
      // Force a text part if prompt is empty to ensure API stability
      if (!prompt.trim()) {
        parts.push({ text: "Please analyze the attached media based on the system instructions." });
      } else {
        parts.push({ text: prompt });
      }
      
      if (file) {
        console.log('📁 Processing file...', { fileName: file.name, fileSize: file.size, fileType: file.type });
        const maxFileBytes = getMaxFileBytes(activeTrack, subscription || undefined);
        const maxVideoSeconds = getMaxVideoSeconds(activeTrack, subscription || undefined);
        const limitText = getUploadLimitText(activeTrack, subscription || undefined);
        
        // Check file size
        if (file.size > maxFileBytes) {
           alert(`הקובץ גדול מדי. מגבלה: ${limitText}.`);
           setLoading(false);
           return;
        }
        
        // Check video duration if it's a video file
        if (file.type.startsWith('video') && videoRef.current) {
          const duration = videoRef.current.duration || 0;
          if (duration > maxVideoSeconds) {
            alert(`הסרטון חורג מהמגבלה: ${limitText}.`);
            setLoading(false);
            return;
          }
        }
        try {
          console.log('🔄 Converting file to generative part...');
          const imagePart = await fileToGenerativePart(file);
          parts.push(imagePart);
          console.log('✅ File converted successfully');
        } catch (e) {
          console.error("❌ File processing error", e);
          alert("שגיאה בעיבוד הקובץ");
          setLoading(false);
          return;
        }
      }

      if (pdfFile) {
         try {
           console.log('📄 Processing PDF...');
           const pdfPart = await fileToGenerativePart(pdfFile);
           parts.push(pdfPart);
           console.log('✅ PDF processed successfully');
         } catch(e) {
            console.error("❌ PDF processing error", e);
         }
      }

      console.log('🚀 Starting AI analysis...', { expertsCount: selectedExperts.length, partsCount: parts.length });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: { 
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

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
        alert("התקבלה תשובה לא תקינה מהמערכת. אנא נסה שוב.");
        setLoading(false);
        return;
      }
      
      // Validate result structure
      if (!parsedResult.expertAnalysis || parsedResult.expertAnalysis.length === 0) {
        console.error("❌ Invalid result structure - no expertAnalysis");
        alert("התקבלה תשובה לא תקינה מהמערכת (חסרים ניתוחי מומחים). אנא נסה שוב.");
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
      
      // Don't auto-save analysis here - let user save manually via "שמור ניתוח למתאמן" button
      // This prevents duplicate saves and gives user control over when to save
      
      // Usage will be updated when analysis is saved (in handleSaveAnalysis)
      
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
        response: error?.response
      });
      
      const code = error?.error?.code || error?.status;
      if (code === 429) {
        alert("חרגת ממכסת הקריאות למודל Gemini בחשבון גוגל. יש להמתין לחידוש המכסה או לשדרג חבילה.");
      } else if (code === 503) {
        alert("המודל של Gemini כרגע עמוס (503). נסה שוב בעוד כמה דקות.");
      } else if (code === 400) {
        alert("בקשה לא תקינה למודל. ייתכן שהקובץ גדול מדי או שיש בעיה בפורמט.");
      } else {
        alert(`אירעה שגיאה בניתוח (קוד: ${code || 'לא ידוע'}). ייתכן שהאינטרנט איטי, יש עומס על המערכת או בעיית API.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isReady = (!!prompt || !!file) && selectedExperts.length >= 3;

  const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
  const currentExpertsList = EXPERTS_BY_TRACK[trackToUse];
  
  const handleSetTop3 = () => {
    const top3 = currentExpertsList.slice(0, 3).map(e => e.title);
    setSelectedExperts(top3);
  };

  const handleSetAll = () => {
    const maxExperts = getMaxExperts();
    if (maxExperts < 8) {
      alert('8 מומחים זמינים בחבילות מנוי בלבד. יש לשדרג את החבילה.');
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

  // Ensure profile is always loaded after refresh (fixes stuck email display)
  useEffect(() => {
    if (!user) return;
    if (profile) return; // Already loaded
    if (isLoadingProfile) return; // Already loading, don't duplicate
    
    // If user exists but profile is null and not currently loading, load it immediately
    const loadProfileIfMissing = async () => {
      setIsLoadingProfile(true);
      try {
        const userProfile = await getCurrentUserProfile(true);
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
        setTimeout(() => reject(new Error('SignOut timeout after 3s')), 3000)
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
          onProfileUpdate={async () => {
            if (user) {
              await loadUserData(user);
            }
          }}
          onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        />
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentSubscription={subscription}
          onSelectPlan={handleSelectPlan}
          activeTrack={activeTrack}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {}}
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '20px', gap: '15px' }}>
          <AppLogo />
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
          <Title>Video Director Pro</Title>
          <Subtitle>בינת וידאו לשחקנים, זמרים ויוצרי תוכן</Subtitle>
          <Description>
            סוכן על שמשלב ריאליטי, קולנוע, מוזיקה ומשפיענים.<br/>
            קבל ניתוח עומק, הערות מקצועיות וליווי עד לפריצה הגדולה.
          </Description>
          {user && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              {/* מחובר כ: במרכז מעל הלחצנים */}
              <span style={{ color: '#D4A043', fontSize: '0.9rem', fontWeight: 600 }}>
                מחובר כ: <span style={{ color: '#fff' }}>{profile?.full_name || user.email}</span>
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
                    ⚙️ הגדרות
                  </button>
                )}
                {userIsAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = '/admin';
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
                    ⚙️ פאנל ניהול
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
                  {loggingOut ? 'מתנתק...' : 'התנתק'}
                </button>
              </div>
              
              {/* סוג החבילה במרכז מתחת ללחצנים */}
              {(() => {
                const currentTier = subscription?.tier || profile?.subscription_tier || 'free';
                let tierName = SUBSCRIPTION_PLANS[currentTier as SubscriptionTier]?.name || 'ניסיון';
                // Add "גרסת פרו" for coach-pro tier
                if (currentTier === 'coach-pro') {
                  tierName = 'מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו';
                }
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
                🔒 התחבר / הרשם
              </button>
            </div>
          )}
          <CTAButton onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
            העלה סרטון וקבל ניתוח מלא
          </CTAButton>
          
          <CapabilitiesButton onClick={() => setIsModalOpen(true)}>
             יכולות האפליקציה של סוכן העל <SparklesIcon />
          </CapabilitiesButton>
          
          <PackagesButton onClick={() => setShowPackageSelectionModal(true)}>
            חבילות והצעות
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

        <SectionLabel>בחר את מסלול הניתוח שלך:</SectionLabel>
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
                title={showRestrictions ? 'תחום זה אינו כלול בחבילה שלך. תוכל לדפדף ולראות, אבל לא לבצע ניתוח. לחץ לשדרג.' : ''}
              >
                {track.icon}
                <span>{track.label}</span>
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
                title={showRestrictions ? 'מסלול הפרימיום אינו כלול בחבילה שלך. תוכל לדפדף ולראות, אבל לא לבצע ניתוח. לחץ לשדרג.' : ''}
              >
                {track.icon}
                <div className="coach-line1">מסלול פרימיום</div>
                <div className="coach-line2">סטודיו ומאמנים</div>
                <div className="coach-line3">Coach Edition</div>
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
              הסבר שימוש וניהול פשוט
            </button>
          </div>
        )}
        
        <TrackDescriptionText>
           {TRACK_DESCRIPTIONS[activeTrack]}
        </TrackDescriptionText>

        {activeTrack === 'coach' && (
          <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            {canUseFeature('traineeManagement') ? (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <CoachButton onClick={() => setShowCoachDashboard(true)}>
                  <CoachIcon />
                  ניהול מתאמנים
                </CoachButton>
                {canUseFeature('comparison') && (
                  <CoachButton onClick={() => setShowComparison(true)}>
                    <ComparisonIcon />
                    השוואת ניתוחים
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
                  מסלול הפרימיום זמין למאמנים, סוכנויות ובתי ספר למשחק בלבד
                </p>
                <CoachButton onClick={() => setShowSubscriptionModal(true)}>
                  שדרג למסלול הפרימיום
                </CoachButton>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '800px' }}>
              <div style={{ background: 'rgba(212, 160, 67, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.1rem' }}>בחר תחום אימון</h3>
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
                        {track.label}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(212, 160, 67, 0.1)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <span style={{ color: '#D4A043', fontWeight: 600 }}>סוג ניתוח:</span>
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
                    ניתוח רגיל
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
                    ניתוח מעמיק
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

        <SectionLabel>מי הם צוות המומחים שלך?</SectionLabel>
        
        <ExpertControlBar>
           <ExpertControlText>
             הנבחרת שלך ב<strong>{activeTrack === 'coach' ? TRACKS.find(t => t.id === coachTrainingTrack)?.label : TRACKS.find(t => t.id === activeTrack)?.label}</strong>: אלו המומחים ומה הם בודקים
           </ExpertControlText>
           <ExpertToggleGroup>
              <ExpertToggleButton $active={isTop3()} onClick={handleSetTop3}>3 המובילים</ExpertToggleButton>
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
                8 מומחים
              </ExpertToggleButton>
           </ExpertToggleGroup>
        </ExpertControlBar>

        <Grid>
          {EXPERTS_BY_TRACK[activeTrack === 'coach' ? coachTrainingTrack : activeTrack].map((expert, i) => {
            const isSelected = selectedExperts.includes(expert.title);
            const maxExperts = getMaxExperts();
            const isDisabled = !isSelected && selectedExperts.length >= maxExperts;
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
                <FeatureTitle $selected={isSelected}>{expert.title}</FeatureTitle>
                <FeatureDesc $selected={isSelected}>{expert.desc}</FeatureDesc>
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
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain'
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
                {isImprovementMode ? 'העלה טייק משופר (ניסיון 2)' : `העלה סרטון ${TRACKS.find(t => t.id === activeTrack)?.label}`}
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
                  {subscription?.tier === 'free' ? 'שדרג חבילה' : 'נהל מנוי'}
                </button>
              </div>
              
              <UploadSubtitle style={{ textAlign: 'center', marginBottom: '25px' }}>
                {getUploadLimitText(activeTrack, subscription || undefined)}
                {subscription && (
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '0.85rem', color: '#D4A043' }}>
                    חבילה: {subscription.tier === 'coach-pro' 
                      ? 'מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו'
                      : SUBSCRIPTION_PLANS[subscription.tier].name}
                    {subscription.usage.analysesUsed > 0 && SUBSCRIPTION_PLANS[subscription.tier].limits.maxAnalysesPerPeriod !== -1 && (
                      <span> | נותרו {SUBSCRIPTION_PLANS[subscription.tier].limits.maxAnalysesPerPeriod - subscription.usage.analysesUsed} ניתוחים</span>
                    )}
                  </span>
                )}
              </UploadSubtitle>
              
              <UploadButton>
                {isImprovementMode ? 'בחר קובץ לשיפור' : 'העלה סרטון עכשיו'}
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
              <RemovePdfBtnSmall onClick={handleRemovePdf} title="הסר קובץ">
                <CloseIcon />
              </RemovePdfBtnSmall>
            </PdfFileInfo>
          ) : (
            <PdfUploadLabel>
              <PdfIcon />
              צרף תסריט / הנחיות (PDF)
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
            <span style={{ color: '#D4A043', fontWeight: 600 }}>סוג ניתוח:</span>
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
                ניתוח רגיל
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
                ניתוח מעמיק
              </button>
            </div>
          </div>
        )}

        <InputWrapper>
          <MainInput 
            placeholder={isImprovementMode ? "מה שינית בטייק הזה? (אופציונלי)" : "כתוב כאן תיאור קצר: מה מטרת הסרטון? מה המסר? (אופציונלי)"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <ActionButton 
            onClick={handleGenerate} 
            disabled={loading || !isReady}
            $isReady={isReady}
            $isLoading={loading}
          >
            {loading ? 'צוות המומחים צופה כעת בסרטון' : (isImprovementMode ? 'נתח שיפורים' : 'אקשן !')}
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
                    <SubtleSparkleIcon /> טיפ זהב של הפאנל <SubtleSparkleIcon />
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <HookText>"{result.hook}"</HookText>
                  </CompactResultBox>
                </div>
              )}

              <SectionLabel style={{ textAlign: 'center', display: 'block', marginTop: '20px' }}>ניתוח פאנל המומחים</SectionLabel>
              
              <ExpertsGrid>
                {result.expertAnalysis?.map((expert, idx) => (
                  <ExpertResultCard key={idx}>
                    <h4>{expert.role} <ExpertScore>{expert.score}</ExpertScore></h4>
                    
                    <ExpertSectionTitle><EyeIcon /> זווית מקצועית</ExpertSectionTitle>
                    <ExpertText>{expert.insight}</ExpertText>
                    
                    <ExpertSectionTitle><BulbIcon /> טיפים לשיפור</ExpertSectionTitle>
                    <ExpertText style={{ color: '#fff', fontWeight: 500 }}>{expert.tips}</ExpertText>
                  </ExpertResultCard>
                )) || <p style={{textAlign: 'center', color: '#666'}}>טוען ניתוח...</p>}
              </ExpertsGrid>

              {result.committee && (
                <CommitteeSection>
                  <SectionTitleExternal>
                     <SubtleDocumentIcon /> סיכום ועדת המומחים
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <CommitteeText>{result.committee.summary}</CommitteeText>
                  </CompactResultBox>
                  
                  {result.committee.finalTips && result.committee.finalTips.length > 0 && (
                    <CommitteeTips data-pdf="committee-tips">
                      <h5>טיפים מנצחים לעתיד:</h5>
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
                                     recText.includes('מומלץ לבצע') ||
                                     recText.includes('מומלץ טייק');
                    const isReady = !hasRetake && (
                      recText.includes('ready') || 
                      recText.includes('מוכן') || 
                      recText.includes('להגיש') ||
                      recText.includes('ניתן')
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
                        textAlign: 'right',
                        direction: 'rtl'
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
                          {isReady ? '✅' : '💡'} {isReady ? 'מוכן להגשה!' : 'הצעות לשיפור:'}
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
                    <span className="label">ציון ויראליות משוקלל</span>
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
                title={!canUseFeature('pdfExport') ? 'יצוא ל-PDF זמין בחבילות מנוי בלבד. שדרג את החבילה.' : ''}
              >
                {!canUseFeature('pdfExport') ? <NoEntryIcon /> : <PdfIcon />}
                יצוא ניתוח ל-PDF
                {!canUseFeature('pdfExport') && <PremiumBadge>פרימיום</PremiumBadge>}
              </PrimaryButton>
              {activeTrack === 'coach' && canUseFeature('traineeManagement') && (
                <PrimaryButton onClick={handleSaveAnalysis} disabled={!result || !selectedTrainee || isSavingAnalysis}>
                  {isSavingAnalysis ? '💾 שומר...' : '💾 שמור ניתוח למתאמן'}
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
                title={!canUseFeature('improvementTracking') ? 'העלאת טייק משופר זמינה בחבילות מנוי בלבד. שדרג את החבילה.' : ''}
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
        onSelectPlan={handleSelectPlan}
        activeTrack={activeTrack}
      />
      
      <TakbullPaymentModal
        isOpen={showTakbullPayment}
        onClose={() => {
          setShowTakbullPayment(false);
          setIsProcessingPayment(false);
          // Only reload if payment wasn't successful (onSuccess handles successful payments)
          // This is just a cleanup - don't reload unnecessarily
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
                const newSub = await getCurrentSubscription();
                const newProfile = await getCurrentUserProfile();
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
          alert(`שגיאה בתשלום: ${error}`);
        }}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={async () => {
          // After registration, profile is updated but onAuthStateChange may have already loaded old data
          // Force reload user data to ensure we have the latest profile with updated settings
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            console.log('🔄 Force reloading user data after registration to get updated profile');
            await loadUserData(currentUser, true); // forceRefresh = true
          }
        }}
      />
      
      <PackageSelectionModal
        isOpen={showPackageSelectionModal}
        onClose={() => {
          setShowPackageSelectionModal(false);
        }}
        onSelect={async (tier) => {
          setPendingSubscriptionTier(tier);
          
          // Check if this is a paid tier - if so, initiate payment
          const isPaidTier = tier !== 'free';
          if (isPaidTier) {
            // For paid tiers, call handleSelectPlan to initiate payment
            // handleSelectPlan will close the modal after opening payment modal
            try {
              await handleSelectPlan(tier, 'monthly');
            } catch (error: any) {
              console.error('Error in handleSelectPlan:', error);
              // If payment fails, keep modal open so user can try again
            }
            return; // Exit - payment flow will handle the rest
          }
          
          // For free tier only - close modal and show track selection
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
          // Reload user data after a short delay to ensure DB update
          if (user) {
            setTimeout(async () => {
              await loadUserData(user);
              // After track selection after upgrade, sign out user
              // Set flag to show popup message after logout
              if (typeof window !== 'undefined') {
                localStorage.setItem('pending_package_upgrade', 'true');
              }
              // Sign out after track selection to refresh cache
              await handleLogout();
            }, 500);
          }
        }}
      />
      
      <UpgradeBenefitsModal
        isOpen={showUpgradeBenefitsModal}
        onClose={async () => {
          setShowUpgradeBenefitsModal(false);
          
          // After upgrade completes, sign out user for ALL upgrades (including coach->coach-pro)
          // Set flag to show popup message after logout
          // IMPORTANT: This includes coach->coach-pro upgrades
          // Always set the flag if there's an upgrade (including coach->coach-pro)
          if (typeof window !== 'undefined') {
            const isCoachToCoachPro = upgradeFromTier === 'coach' && upgradeToTier === 'coach-pro';
            if (upgradeFromTier !== upgradeToTier || isCoachToCoachPro) {
              localStorage.setItem('pending_package_upgrade', 'true');
            }
          }
          
          // Sign out after upgrade to refresh cache and update profile
          // This ensures the user gets the updated subscription after login
          // IMPORTANT: This applies to ALL upgrades including coach->coach-pro
          // Always logout after any upgrade to refresh the profile with new subscription settings
          setTimeout(async () => {
            await handleLogout();
          }, 500);
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
            
            // Reload user data to get updated profile
            if (user) {
              setTimeout(async () => {
                await loadUserData(user, true);
              }, 300);
            }
            
            // Only close modal if explicitly requested (for single track selection)
            if (shouldCloseModal) {
              setShowUpgradeBenefitsModal(false);
            }
          } catch (error) {
            console.error('Error adding track:', error);
            alert('שגיאה בהוספת התחום. תוכל להוסיף אותו מאוחר יותר מההגדרות.');
          }
        }}
        onFinishTrackSelection={async () => {
          // After finishing track selection, reload user data
          if (user) {
            await loadUserData(user, true);
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
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<AppRouter />);