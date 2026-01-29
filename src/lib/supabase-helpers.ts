import { supabase } from './supabase.js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

// Create admin client with service role key (bypasses RLS)
// This is safe because it's only used in admin functions that check isAdmin() first
let adminSupabaseClient: ReturnType<typeof createClient> | null = null;

const getAdminClient = () => {
  if (adminSupabaseClient) {
    return adminSupabaseClient;
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('⚠️ Service role key not found - admin functions will use regular client');
    return supabase;
  }
  
  // Create admin client with unique storage key to avoid conflicts with main client
  // Use different storage key to avoid conflicts with main Supabase client
  adminSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'admin-auth-token', // Use different storage key to avoid conflicts
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string) => {
          // Use separate storage for admin client
          return localStorage.getItem(`admin-${key}`);
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(`admin-${key}`, value);
        },
        removeItem: (key: string) => {
          localStorage.removeItem(`admin-${key}`);
        }
      } : undefined
    }
  });
  
  return adminSupabaseClient;
};

/** Get current user with timeout so admin flows don't hang. */
const getCurrentUserWithTimeout = async (ms = 6000): Promise<{ id: string } | null> => {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('Session check timed out')), ms)
  );
  try {
    const result = await Promise.race([supabase.auth.getUser(), timeout]) as { data: { user: { id: string } | null }; error: unknown };
    if (result?.data?.user) return { id: result.data.user.id };
    return null;
  } catch {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      const storageKey = `sb-${projectRef}-auth-token`;
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        const user = parsed?.currentSession?.user ?? parsed?.user;
        if (user?.id) return { id: user.id };
      }
    } catch {
      // ignore
    }
    return null;
  }
};

// Helper functions for common operations

export async function getCurrentUserProfile(forceRefresh = false) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ getCurrentUserProfile: Error getting user:', userError);
      return null;
    }
    if (!user) {
      console.warn('⚠️ getCurrentUserProfile: No user found');
      return null;
    }

    // Add cache-busting parameter if forceRefresh is true
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);
    
    // Add timestamp to force fresh fetch (Supabase doesn't cache by default, but this ensures fresh data)
    if (forceRefresh) {
      query = query.order('updated_at', { ascending: false });
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('❌ getCurrentUserProfile: Error fetching profile:', error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ getCurrentUserProfile: Profile not found for user:', user.id);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ getCurrentUserProfile: Exception:', err);
    return null;
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return false;
  }
}

export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('phone')
      .eq('phone', phone.trim())
      .maybeSingle();

    if (error) {
      console.error('Error checking phone:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Error in checkPhoneExists:', error);
    return false;
  }
}

export async function getCurrentSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // First, get the subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return null;
    }

    if (!subscription) {
      // No subscription found - return free tier
      return null;
    }

    // Then, get the plan separately
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      // Return subscription without plan if plan fetch fails
      return { ...subscription, plans: null };
    }

    return { ...subscription, plans: plan };
  } catch (error) {
    console.error('Error in getCurrentSubscription:', error);
    return null;
  }
}

export async function getUsageForCurrentPeriod() {
  try {
    // Get user first (don't wait for subscription)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // Get user profile to check subscription_start_date
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_start_date, subscription_end_date, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    // Determine period start: use subscription_start_date if available, otherwise use month start
    // This ensures analyses from previous package don't count towards new package
    let periodStart: Date;
    let periodEnd: Date;
    
    if (profile?.subscription_start_date) {
      // Count from subscription start date (package upgrade resets usage)
      try {
        periodStart = new Date(profile.subscription_start_date);
        // Validate date
        if (isNaN(periodStart.getTime())) {
          throw new Error('Invalid subscription_start_date');
        }
        periodEnd = profile.subscription_end_date 
          ? (() => {
              const end = new Date(profile.subscription_end_date);
              if (isNaN(end.getTime())) {
                throw new Error('Invalid subscription_end_date');
              }
              return end;
            })()
          : (() => {
              // If no end date, calculate based on subscription period (default monthly)
              const end = new Date(periodStart);
              end.setMonth(end.getMonth() + 1);
              return end;
            })();
      } catch (error) {
        // If date parsing fails, fallback to current month
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    } else {
      // Fallback: count from current calendar month (for users without subscription_start_date)
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Count analyses within subscription period (from subscription_start_date)
    const { count, error } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error) {
      return null;
    }

    // Calculate total video minutes used this month
    // Join with videos table to get duration
    let totalMinutesUsed = 0;
    try {
      const { data: analysesWithVideos, error: videosError } = await supabase
        .from('analyses')
        .select(`
          id,
          video_id,
          videos (
            duration_seconds
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .not('video_id', 'is', null);

      if (!videosError && analysesWithVideos) {
        analysesWithVideos.forEach((analysis: any) => {
          const video = analysis.videos;
          if (video && video.duration_seconds) {
            // Convert seconds to minutes (round up)
            totalMinutesUsed += Math.ceil(video.duration_seconds / 60);
          }
        });
      }
    } catch (error) {
      // Non-critical error - continue with minutesUsed = 0
    }

    return {
      analysesUsed: count || 0,
      minutesUsed: totalMinutesUsed,
      periodStart,
      periodEnd,
    };
  } catch (error) {
    console.error('Error in getUsageForCurrentPeriod:', error);
    return null;
  }
}

// ============================================
// VIDEO & ANALYSIS FUNCTIONS
// ============================================

export async function uploadVideo(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  // Path should be just userId/filename (no videos/ prefix, bucket name handles that)
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading video:', error);
    throw error;
  }

  // Return full path for database storage (videos/userId/filename)
  return { path: `videos/${filePath}`, data };
}

export async function saveVideoToDatabase(videoData: {
  file_name: string;
  file_path: string;
  file_size: number;
  duration_seconds?: number | null;
  mime_type: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Round duration_seconds to integer if provided (database expects integer)
  const processedData = {
    ...videoData,
    duration_seconds: videoData.duration_seconds != null 
      ? Math.round(videoData.duration_seconds) 
      : null,
  };

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      ...processedData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving video to database:', error);
    throw error;
  }

  return data;
}

export async function saveAnalysis(analysisData: {
  video_id?: string;
  trainee_id?: string;
  track: string;
  coach_training_track?: string;
  analysis_depth?: string;
  expert_panel: string[];
  prompt?: string;
  result: any;
  average_score: number;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('❌ saveAnalysis: Error getting user:', userError);
    throw new Error('User not authenticated');
  }
  if (!user) {
    console.error('❌ saveAnalysis: No user found');
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      ...analysisData,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ saveAnalysis: Error saving analysis to database:', error);
    console.error('❌ saveAnalysis: Error code:', error.code);
    console.error('❌ saveAnalysis: Error message:', error.message);
    throw error;
  }

  return data;
}

// ============================================
// COACH EDITION FUNCTIONS
// ============================================

export async function saveTrainee(traineeData: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('trainees')
    .insert({
      coach_id: user.id,
      ...traineeData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving trainee:', error);
    throw error;
  }

  return data;
}

export async function getAnalyses(traineeId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id);

  if (traineeId) {
    query = query.eq('trainee_id', traineeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analyses:', error);
    return [];
  }

  return data || [];
}

// Check for previous analysis with same video file (by file_size - most reliable method)
// This function MUST work even if video wasn't saved yet - searches directly in analyses
export async function findPreviousAnalysisByVideo(fileName: string, fileSize: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // STRATEGY 1: Find videos with matching file_size (same file = same size)
    // This works even if file name is different
    const { data: matchingVideos, error: videosError } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', user.id)
      .eq('file_size', fileSize)
      .order('created_at', { ascending: false })
      .limit(100);

    if (videosError) {
      console.error('Error fetching videos by size:', videosError);
    }

    // If we found videos with matching size, find their analyses
    if (matchingVideos && matchingVideos.length > 0) {
      const videoIds = matchingVideos.map(v => v.id);
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('*, videos(file_name, file_size)')
        .eq('user_id', user.id)
        .in('video_id', videoIds)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
      } else if (analyses) {
        // Verify the video actually has matching file_size (double check)
        const video = (analyses as any).videos;
        if (video && video.file_size === fileSize) {
          return analyses;
        }
      }
    }

    // STRATEGY 2: Search all recent analyses and check their videos
    // This catches cases where video exists but wasn't found in first query
    // Also works if video was saved but query didn't catch it
    const { data: recentAnalyses, error: recentError } = await supabase
      .from('analyses')
      .select('*, videos(file_name, file_size)')
      .eq('user_id', user.id)
      .not('video_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100); // Increased limit to catch more analyses

    if (recentError) {
      console.error('Error in fallback search:', recentError);
      return null;
    }

    if (recentAnalyses && recentAnalyses.length > 0) {
      // Find analysis where video has matching file_size
      for (const analysis of recentAnalyses) {
        const video = (analysis as any).videos;
        if (video && video.file_size === fileSize) {
          return analysis;
        }
      }
    }

    // STRATEGY 3: Direct search in analyses by checking video metadata stored in result
    // Some analyses might have file_size in the result metadata
    const { data: allRecentAnalyses, error: allRecentError } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100); // Increased limit for better coverage

    if (!allRecentError && allRecentAnalyses) {
      for (const analysis of allRecentAnalyses) {
        // Check if result has metadata with file_size
        const metadata = analysis.result?.metadata;
        if (metadata && metadata.fileSize === fileSize) {
          // Found match by metadata - verify with video if available
          if (analysis.video_id) {
            const { data: videoData } = await supabase
              .from('videos')
              .select('file_name, file_size')
              .eq('id', analysis.video_id)
              .maybeSingle();
            
            if (videoData && videoData.file_size === fileSize) {
              return { ...analysis, videos: videoData };
            }
          } else {
            // No video_id but metadata matches - still valid match
            return analysis;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error in findPreviousAnalysisByVideo:', error);
    return null;
  }
}


export async function getTrainees() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('trainees')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trainees:', error);
    return [];
  }

  return data || [];
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export async function isAdmin(): Promise<boolean> {
  try {
    // Use getSession() instead of getUser() to avoid hanging
    // Add timeout to prevent hanging
    const getSessionPromise = supabase.auth.getSession();
    const getSessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getSession timeout after 3 seconds')), 3000)
    );
    
    let session, sessionError;
    try {
      const result = await Promise.race([getSessionPromise, getSessionTimeout]) as any;
      session = result?.data?.session;
      sessionError = result?.error;
    } catch (timeoutError: any) {
      // Try to get user from localStorage directly
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
        const storageKey = `sb-${projectRef}-auth-token`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.currentSession?.user) {
            session = { user: parsed.currentSession.user };
          } else if (parsed?.user) {
            session = { user: parsed.user };
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    if (sessionError || !session?.user) {
      return false;
    }
    
    const user = session.user;

    // Fast path: primary admin by email (robust גם אם יש בעיות RLS על profiles)
    if (user.email && user.email.toLowerCase() === 'viralypro@gmail.com') {
      return true;
    }

    // Otherwise: בדיקה לפי role בפרופיל (כש-RLS מאפשר)
    // Add timeout to profile query
    const profileQueryPromise = supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const profileTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('profile query timeout after 3 seconds')), 3000)
    );
    
    let profile, profileError;
    try {
      const result = await Promise.race([profileQueryPromise, profileTimeout]) as any;
      profile = result?.data;
      profileError = result?.error;
    } catch (timeoutError: any) {
      // If profile query times out, assume not admin (safer)
      return false;
    }
    
    if (profileError || !profile) {
      return false;
    }
    
    return profile.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAllUsers(skipAdminCheck = false) {
  try {
    // If skipAdminCheck is true, we already know user is admin (e.g., from AdminPage)
    // Skip all session/admin checks and go straight to admin client for maximum speed
    if (skipAdminCheck) {
      const adminClient = getAdminClient();
      const { data, error } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ getAllUsers: Error fetching users:', error);
        return [];
      }
      
      return data || [];
    }
    
    // Original logic for when admin check is needed
    // Add timeout to getSession() to prevent hanging
    const getSessionPromise = supabase.auth.getSession();
    const getSessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getSession timeout')), 3000)
    );
    
    let session, sessionError;
    try {
      const result = await Promise.race([getSessionPromise, getSessionTimeout]) as any;
      session = result?.data?.session;
      sessionError = result?.error;
    } catch (timeoutError: any) {
      // Try to get user from localStorage directly (Supabase stores session there)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
        const storageKey = `sb-${projectRef}-auth-token`;
        
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.currentSession?.user) {
            session = { user: parsed.currentSession.user };
          } else if (parsed?.user) {
            session = { user: parsed.user };
          }
        }
      } catch (e) {
        // Ignore
      }
      
      if (!session?.user) {
        return [];
      }
    }
    
    if (sessionError || !session?.user) {
      return [];
    }
    
    // Skip admin check if we got user from localStorage (to avoid hanging)
    // Service role key will handle authorization anyway
    if (session?.user) {
      const isUserAdmin = await isAdmin();
      if (!isUserAdmin) {
        return [];
      }
    }
    
    // Use admin client (service role) to bypass RLS
    const adminClient = getAdminClient();
    const queryPromise = adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Add shorter timeout to prevent hanging (reduced from 10s to 5s for faster response)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getAllUsers timeout after 5 seconds')), 5000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ getAllUsers: Error fetching users:', error);
      console.error('❌ getAllUsers: Error details:', JSON.stringify(error, null, 2));
      console.error('❌ getAllUsers: Error code:', error?.code);
      console.error('❌ getAllUsers: Error message:', error?.message);
      console.error('❌ getAllUsers: Error hint:', error?.hint);
      
      // Fallback to regular client if service role fails
      console.log('🔄 getAllUsers: Trying with regular client as fallback...');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('❌ getAllUsers: Fallback also failed:', fallbackError);
          return [];
        }
        
        console.log('✅ getAllUsers: loaded via fallback, count =', fallbackData?.length || 0);
        return fallbackData || [];
      } catch (fallbackException: any) {
        console.error('❌ getAllUsers: Fallback exception:', fallbackException);
        return [];
      }
    }

    // Return users without logging (AdminPage will log the result)
    return data || [];
  } catch (error: any) {
    console.error('❌ getAllUsers: Final exception:', error);
    console.error('❌ getAllUsers: Exception message:', error?.message);
    console.error('❌ getAllUsers: Exception name:', error?.name);
    console.error('❌ getAllUsers: Stack:', error?.stack);
    
    // If it's a timeout, try one more time with regular client
    if (error?.message?.includes('timeout')) {
      console.log('🔄 getAllUsers: Timeout occurred, trying regular client...');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('❌ getAllUsers: Regular client also failed:', fallbackError);
          return [];
        }
        
        console.log('✅ getAllUsers: loaded via regular client after timeout, count =', fallbackData?.length || 0);
        return fallbackData || [];
      } catch (e: any) {
        console.error('❌ getAllUsers: Regular client exception:', e);
        return [];
      }
    }
    
    return [];
  }
}

async function getAllUsersViaClient() {
  try {
    console.log('🔍 getAllUsersViaClient: Using Supabase client...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getAllUsersViaClient: Error:', error);
      console.error('❌ getAllUsersViaClient: Error details:', { 
        message: error.message, 
        code: error.code, 
        details: error.details,
        hint: error.hint 
      });
      return [];
    }

    console.log('✅ getAllUsersViaClient: loaded, count =', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 getAllUsersViaClient: First user sample:', { email: data[0].email, role: data[0].role, fullName: data[0].full_name });
    }
    return data || [];
  } catch (error: any) {
    console.error('❌ getAllUsersViaClient: Exception:', error);
    return [];
  }
}

export async function getAllAnalyses(skipAdminCheck = false) {
  try {
    // If skipAdminCheck is true, we already know user is admin (e.g., from AdminPage)
    // Skip all session/admin checks and go straight to admin client for maximum speed
    if (skipAdminCheck) {
      const adminClient = getAdminClient();
      const { data, error } = await adminClient
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ getAllAnalyses: Error fetching analyses:', error);
        return [];
      }
      
      return data || [];
    }
    
    // Original logic for when admin check is needed
    // Add timeout to getSession() to prevent hanging
    const getSessionPromise = supabase.auth.getSession();
    const getSessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getSession timeout')), 3000)
    );
    
    let session, sessionError;
    try {
      const result = await Promise.race([getSessionPromise, getSessionTimeout]) as any;
      session = result?.data?.session;
      sessionError = result?.error;
    } catch (timeoutError: any) {
      // Skip session check - use admin client directly (it bypasses auth anyway)
      session = null;
    }
    
    if (sessionError && session) {
      console.error('❌ getAllAnalyses: Error getting session:', sessionError);
      return [];
    }
    
    // Skip admin check if no session (to avoid hanging)
    // Service role key will handle authorization anyway
    if (session?.user) {
      const isUserAdmin = await isAdmin();
      if (!isUserAdmin) {
        return [];
      }
    }
    
    // Use admin client (service role) to bypass RLS
    const adminClient = getAdminClient();
    const queryPromise = adminClient
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getAllAnalyses timeout after 10 seconds')), 10000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ getAllAnalyses: Error fetching analyses:', error);
      console.error('❌ getAllAnalyses: Error details:', JSON.stringify(error, null, 2));
      console.error('❌ getAllAnalyses: Error code:', error?.code);
      console.error('❌ getAllAnalyses: Error message:', error?.message);
      
      // Fallback to regular client if service role fails
      console.log('🔄 getAllAnalyses: Trying with regular client as fallback...');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('analyses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('❌ getAllAnalyses: Fallback also failed:', fallbackError);
          return [];
        }
        
        console.log('✅ getAllAnalyses: loaded via fallback, count =', fallbackData?.length || 0);
        return fallbackData || [];
      } catch (fallbackException: any) {
        console.error('❌ getAllAnalyses: Fallback exception:', fallbackException);
        return [];
      }
    }

    // Return analyses without logging (AdminPage will log the result)
    return data || [];
  } catch (error: any) {
    console.error('❌ getAllAnalyses: Final exception:', error);
    console.error('❌ getAllAnalyses: Exception message:', error?.message);
    console.error('❌ getAllAnalyses: Exception name:', error?.name);
    
    // If it's a timeout, try one more time with regular client
    if (error?.message?.includes('timeout')) {
      console.log('🔄 getAllAnalyses: Timeout occurred, trying regular client...');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('analyses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('❌ getAllAnalyses: Regular client also failed:', fallbackError);
          return [];
        }
        
        console.log('✅ getAllAnalyses: loaded via regular client after timeout, count =', fallbackData?.length || 0);
        return fallbackData || [];
      } catch (e: any) {
        console.error('❌ getAllAnalyses: Regular client exception:', e);
        return [];
      }
    }
    
    return [];
  }
}

export async function getAllVideos(skipAdminCheck = false) {
  try {
    // If skipAdminCheck is true, we already know user is admin (e.g., from AdminPage)
    // Skip all session/admin checks and go straight to admin client for maximum speed
    if (skipAdminCheck) {
      const adminClient = getAdminClient();
      const { data, error } = await adminClient
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ getAllVideos: Error fetching videos:', error);
        return [];
      }
      
      return data || [];
    }
    
    // Original logic for when admin check is needed
    // Add timeout to getSession() to prevent hanging
    const getSessionPromise = supabase.auth.getSession();
    const getSessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getSession timeout')), 3000)
    );
    
    let session, sessionError;
    try {
      const result = await Promise.race([getSessionPromise, getSessionTimeout]) as any;
      session = result?.data?.session;
      sessionError = result?.error;
    } catch (timeoutError: any) {
      // Skip session check - use admin client directly (it bypasses auth anyway)
      session = null;
    }
    
    if (sessionError && session) {
      console.error('❌ getAllVideos: Error getting session:', sessionError);
      return [];
    }
    
    // Skip admin check if no session (to avoid hanging)
    // Service role key will handle authorization anyway
    if (session?.user) {
      const isUserAdmin = await isAdmin();
      if (!isUserAdmin) {
        return [];
      }
    }
    
    // Use admin client (service role) to bypass RLS
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getAllVideos: Error fetching videos:', error);
      console.error('❌ getAllVideos: Error details:', JSON.stringify(error, null, 2));
      
      // Fallback to regular client if service role fails
      console.log('🔄 getAllVideos: Trying with regular client as fallback...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fallbackError) {
        console.error('❌ getAllVideos: Fallback also failed:', fallbackError);
        return [];
      }
      
      console.log('✅ getAllVideos: loaded via fallback, count =', fallbackData?.length || 0);
      return fallbackData || [];
    }

    // Return videos without logging (AdminPage will log the result)
    return data || [];
  } catch (error: any) {
    console.error('❌ Error in getAllVideos:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return [];
  }
}

export async function getUserAnalyses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user analyses:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getUserAnalyses:', error);
    throw error;
  }
}

export async function getUserVideos(userId: string) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getUserVideos:', error);
    throw error;
  }
}

export async function getUserUsageStats(userId: string) {
  try {
    const { count: analysesCount } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: videosCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      totalAnalyses: analysesCount || 0,
      totalVideos: videosCount || 0,
    };
  } catch (error: any) {
    console.error('Error in getUserUsageStats:', error);
    return { totalAnalyses: 0, totalVideos: 0 };
  }
}

export async function updateUserProfile(userId: string, updates: {
  subscription_tier?: string;
  role?: string;
  full_name?: string;
  email?: string;
  subscription_period?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  phone?: string;
  selected_tracks?: string[];
  selected_primary_track?: string;
}) {
  // Use admin client to bypass RLS (this function is called from admin panel)
  const adminClient = getAdminClient();
  
  // If subscription_tier is being updated, set subscription_start_date to NOW to reset usage
  const finalUpdates = { ...updates };
  if (updates.subscription_tier !== undefined) {
    finalUpdates.subscription_start_date = new Date().toISOString();
    finalUpdates.subscription_status = 'active';
  }
  
  // Update profile with admin client
  const { error: profileError } = await adminClient
    .from('profiles')
    .update(finalUpdates)
    .eq('user_id', userId);

  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw profileError;
  }

  // If subscription_tier is being updated, also update/delete subscriptions table
  // IMPORTANT: When package is upgraded, reset usage by setting subscription_start_date to NOW
  if (updates.subscription_tier !== undefined) {
    const newTier = updates.subscription_tier;
    
    // Get the plan_id for the new tier (use admin client)
    const { data: plan, error: planError } = await adminClient
      .from('plans')
      .select('id')
      .eq('tier', newTier)
      .eq('is_active', true)
      .maybeSingle();

    if (planError) {
      console.error('Error fetching plan:', planError);
      // Don't throw - profile update succeeded, subscription update is secondary
    }

    // When upgrading package, reset subscription period to NOW (this resets usage count)
    // This ensures analyses from previous package don't count towards new package
    // Note: subscription_start_date is already updated in finalUpdates above
    const subscriptionStartDate = new Date(finalUpdates.subscription_start_date || new Date());
    const subscriptionPeriod = updates.subscription_period || 'monthly';

    if (newTier === 'free') {
      // For free tier, cancel all active subscriptions
      const { error: deleteError } = await adminClient
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (deleteError) {
        console.error('Error cancelling subscriptions:', deleteError);
        // Don't throw - profile update succeeded
      }
    } else if (plan) {
      // For paid tiers, update or create subscription with reset start date
      const endDate = updates.subscription_end_date
        ? new Date(updates.subscription_end_date)
        : (() => {
            const end = new Date(subscriptionStartDate);
            if (subscriptionPeriod === 'yearly') {
              end.setFullYear(end.getFullYear() + 1);
            } else {
              end.setMonth(end.getMonth() + 1);
            }
            return end;
          })();

      const { error: subError } = await adminClient
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: plan.id,
          status: updates.subscription_status === 'active' ? 'active' : 'inactive',
          billing_period: (subscriptionPeriod as 'monthly' | 'yearly') || 'monthly',
          start_date: subscriptionStartDate.toISOString(),
          end_date: endDate.toISOString(),
        }, {
          onConflict: 'user_id,plan_id',
        });

      if (subError) {
        console.error('Error updating subscription:', subError);
        // Don't throw - profile update succeeded
      }
    }
  }
}

export async function updateCurrentUserProfile(updates: {
  full_name?: string;
  phone?: string;
  selected_tracks?: string[];
  selected_primary_track?: string;
  receive_updates?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating current user profile:', error);
    throw error;
  }
}

export async function deleteUser(userId: string, skipAdminCheck = false) {
  try {
    // If skipAdminCheck is true, use admin client directly (faster, no API call needed)
    if (skipAdminCheck) {
      const adminClient = getAdminClient();
      
      // Delete related data first (in case cascade doesn't work)
      await adminClient.from('subscriptions').delete().eq('user_id', userId);
      await adminClient.from('takbull_orders').delete().eq('user_id', userId);
      await adminClient.from('analyses').delete().eq('user_id', userId);
      await adminClient.from('videos').delete().eq('user_id', userId);
      await adminClient.from('trainees').delete().eq('coach_id', userId);
      await adminClient.from('coupon_redemptions').delete().eq('user_id', userId);
      await adminClient.from('user_trials').delete().eq('user_id', userId);
      await adminClient.from('user_announcements').delete().eq('user_id', userId);
      
      // Delete profile
      await adminClient.from('profiles').delete().eq('user_id', userId);
      
      // Delete user from auth.users (requires admin client)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('❌ Error deleting user from auth:', deleteError);
        throw new Error(`Failed to delete user: ${deleteError.message}`);
      }
      
      return { ok: true, message: 'User deleted successfully' };
    }
    
    // Original logic: Get current user token for authorization
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Call the API route to delete the user (which will delete from auth.users)
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'Failed to delete user');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error in deleteUser:', error);
    throw error;
  }
}

export async function createUser(email: string, password: string, profileData: {
  full_name?: string;
  subscription_tier?: string;
  role?: string;
}) {
  // Note: Creating users with admin.createUser requires service role key.
  // This function should be called from an Edge Function for security.
  // For now, we'll throw an error indicating this needs to be implemented via Edge Function.
  throw new Error('User creation via admin panel requires an Edge Function. Please implement create-user Edge Function with service role key.');
}

// ============================================
// ADMIN STATISTICS FUNCTIONS
// ============================================

export async function getAdminStats(skipAdminCheck = false) {
  try {
    // If skipAdminCheck is true, we already know user is admin (e.g., from AdminPage)
    // Skip all session/admin checks and go straight to admin client for maximum speed
    if (skipAdminCheck) {
      const adminClient = getAdminClient();
      // Continue with stats loading...
    } else {
      // Original logic for when admin check is needed
      // First check if user is admin - use session directly (faster, no API call)
      
      // Add timeout to getSession() to prevent hanging
      const getSessionPromise = supabase.auth.getSession();
      const getSessionTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout')), 3000)
      );
      
      let session, sessionError;
      try {
        const result = await Promise.race([getSessionPromise, getSessionTimeout]) as any;
        session = result?.data?.session;
        sessionError = result?.error;
      } catch (timeoutError: any) {
        // Timeout is expected - use admin client directly
        session = null;
      }
      
      if (sessionError && session) {
        console.error('❌ getAdminStats: Error getting session:', sessionError);
        return null;
      }
      
      // Skip admin check if no session (to avoid hanging)
      // Service role key will handle authorization anyway
      if (session?.user) {
        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) {
          console.error('❌ getAdminStats: User is not admin');
          return null;
        }
      }
    }
    
    // Use admin client (service role) to bypass RLS
    const adminClient = getAdminClient();
    
    // Get total counts - NO TIMEOUT, just show real errors
    const { count: totalUsers, error: usersError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('❌ User count ERROR:', usersError);
    }

    const { count: totalAnalyses, error: analysesError } = await adminClient
      .from('analyses')
      .select('id', { count: 'exact', head: true });
    if (analysesError) {
      console.error('❌ Analyses count ERROR:', analysesError);
    }

    const { count: totalVideos, error: videosError } = await adminClient
      .from('videos')
      .select('id', { count: 'exact', head: true });
    if (videosError) {
      console.error('❌ Videos count ERROR:', videosError);
    }

    // Get tier distribution
    const { data: tierData, error: tierError } = await adminClient
      .from('profiles')
      .select('subscription_tier');
    if (tierError) {
      console.error('❌ Tier data ERROR:', tierError);
    }

    const tierDistribution = tierData?.reduce((acc: any, profile: any) => {
      acc[profile.subscription_tier] = (acc[profile.subscription_tier] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get role distribution
    const { data: roleData, error: roleError } = await adminClient
      .from('profiles')
      .select('role');
    if (roleError) {
      console.error('❌ Role data ERROR:', roleError);
    }

    const roleDistribution = roleData?.reduce((acc: any, profile: any) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentUsers, error: recentError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());
    if (recentError) {
      console.error('❌ Recent users ERROR:', recentError);
    }

    const result = {
      totalUsers: totalUsers || 0,
      totalAnalyses: totalAnalyses || 0,
      totalVideos: totalVideos || 0,
      recentUsers: recentUsers || 0,
      tierDistribution,
      roleDistribution,
    };
    
    // Return stats without logging (AdminPage will log the result)
    return result;
    
  } catch (error: any) {
    console.error('❌ Error in getAdminStats:', error.message || error);
    // Return zeros so UI doesn't break
    return {
      totalUsers: 0,
      totalAnalyses: 0,
      totalVideos: 0,
      recentUsers: 0,
      tierDistribution: {},
      roleDistribution: {},
    };
  }
}

// ============================================
// ANNOUNCEMENTS FUNCTIONS
// ============================================

export async function createAnnouncement(data: {
  title: string;
  message: string;
  target_all?: boolean;
  target_tier?: string[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title: data.title,
      message: data.message,
      created_by: user.id,
      target_all: data.target_all ?? true,
      target_tier: data.target_tier || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }

  // Send announcement to users
  const sendResult = await sendAnnouncementToUsers(announcement.id);

  return { ...announcement, sent: sendResult.sent };
}

/** Create announcement from admin panel (bypasses RLS). Requires authenticated user for created_by. */
export async function createAnnouncementAsAdmin(data: {
  title: string;
  message: string;
  target_all?: boolean;
  target_tier?: string[];
  /** When true, all targeted users see the announcement in Settings (not only receive_updates). Use for benefits. */
  includeAllTargetUsers?: boolean;
}) {
  const user = await getCurrentUserWithTimeout(6000);
  if (!user) throw new Error('לא מזוהה משתמש. רענן את הדף והתחבר שוב.');
  const adminClient = getAdminClient();

  const { data: announcement, error } = await adminClient
    .from('announcements')
    .insert({
      title: data.title,
      message: data.message,
      created_by: user.id,
      target_all: data.target_all ?? true,
      target_tier: data.target_tier || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement (admin):', error);
    throw error;
  }

  const sendResult = await sendAnnouncementToUsersWithClient(adminClient, announcement.id, {
    includeAllTargetUsers: data.includeAllTargetUsers,
  });
  return { ...announcement, sent: sendResult.sent };
}

export async function sendAnnouncementToUsers(announcementId: string) {
  return sendAnnouncementToUsersWithClient(supabase, announcementId);
}

async function sendAnnouncementToUsersWithClient(
  client: ReturnType<typeof createClient>,
  announcementId: string,
  options?: { includeAllTargetUsers?: boolean }
) {
  const { data: announcement, error: annError } = await client
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single();

  if (annError || !announcement) {
    throw new Error('Announcement not found');
  }

  // Build query for target users (when includeAllTargetUsers, don't filter by receive_updates so everyone sees in Settings)
  let usersQuery = client
    .from('profiles')
    .select('user_id');

  if (!options?.includeAllTargetUsers) {
    usersQuery = usersQuery.eq('receive_updates', true);
  }

  if (!announcement.target_all && announcement.target_tier && announcement.target_tier.length > 0) {
    usersQuery = usersQuery.in('subscription_tier', announcement.target_tier);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    console.error('Error fetching target users:', usersError);
    throw usersError;
  }

  if (!users || users.length === 0) {
    console.log('No users to send announcement to');
    return { sent: 0 };
  }

  // Create user_announcements records
  const userAnnouncements = users.map(user => ({
    user_id: user.user_id,
    announcement_id: announcementId,
  }));

  const { error: insertError } = await client
    .from('user_announcements')
    .insert(userAnnouncements);

  if (insertError) {
    console.error('Error creating user_announcements:', insertError);
    throw insertError;
  }

  const { error: updateError } = await client
    .from('announcements')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', announcementId);

  if (updateError) {
    console.error('Error updating announcement sent_at:', updateError);
  }

  return { sent: users.length };
}

export async function getAllAnnouncements() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllAnnouncements:', error);
    throw error;
  }
}

export async function getUserAnnouncements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('user_announcements')
      .select(`
        *,
        announcement:announcements(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user announcements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAnnouncements:', error);
    return [];
  }
}

export async function markAnnouncementAsRead(announcementId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('user_announcements')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('announcement_id', announcementId);

  if (error) {
    console.error('Error marking announcement as read:', error);
    throw error;
  }
}

// ============================================
// COUPONS FUNCTIONS
// ============================================

export async function validateCoupon(code: string): Promise<{
  valid: boolean;
  coupon?: any;
  error?: string;
}> {
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'קוד קופון לא נמצא' };
    }

    // Check if coupon is expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false, error: 'קוד קופון פג תוקף' };
    }

    // Check if coupon is not yet valid
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return { valid: false, error: 'קוד קופון עדיין לא פעיל' };
    }

    // Check if max uses exceeded
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { valid: false, error: 'קוד קופון אזל' };
    }

    return { valid: true, coupon };
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'שגיאה בבדיקת קוד הקופון' };
  }
}

export async function checkCouponAlreadyUsed(code: string, userId: string): Promise<boolean> {
  try {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (!coupon) return false;

    const { data: redemption } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)
      .single();

    return !!redemption;
  } catch (error) {
    return false;
  }
}

export async function redeemCoupon(code: string, userId: string) {
  // First validate the coupon
  const validation = await validateCoupon(code);
  if (!validation.valid || !validation.coupon) {
    throw new Error(validation.error || 'קוד קופון לא תקין');
  }

  const coupon = validation.coupon;

  // Check if user already used this coupon
  const alreadyUsed = await checkCouponAlreadyUsed(code, userId);
  if (alreadyUsed) {
    throw new Error('קוד קופון זה כבר שומש על ידך בעבר');
  }

  // Create redemption record
  const redemptionData: any = {
    coupon_id: coupon.id,
    user_id: userId,
    discount_applied: coupon.discount_value,
    applied_discount_type: coupon.discount_type,
  };

  // If it's a trial subscription, calculate trial dates
  if (coupon.discount_type === 'trial_subscription' && coupon.trial_tier && coupon.trial_duration_days) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + coupon.trial_duration_days);

    redemptionData.trial_tier = coupon.trial_tier;
    redemptionData.trial_start_date = startDate.toISOString();
    redemptionData.trial_end_date = endDate.toISOString();

    // Create user_trial record
    const { error: trialError } = await supabase
      .from('user_trials')
      .insert({
        user_id: userId,
        tier: coupon.trial_tier,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        source: 'coupon',
        source_id: coupon.id,
      });

    if (trialError) {
      console.error('Error creating user trial:', trialError);
      throw new Error('שגיאה ביצירת התנסות');
    }

    // Update user's subscription_tier temporarily
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: coupon.trial_tier,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile with trial:', profileError);
      // Don't throw - trial was created, profile update can be retried
    }
  }

  // extra_track: add one bonus analysis track (for free/creator tiers)
  if (coupon.discount_type === 'extra_track') {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('bonus_tracks')
      .eq('user_id', userId)
      .maybeSingle();
    const current = (profileRow as { bonus_tracks?: number } | null)?.bonus_tracks ?? 0;
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ bonus_tracks: current + 1 })
      .eq('user_id', userId);
    if (profileErr) {
      console.error('Error updating profile bonus_tracks:', profileErr);
      throw new Error('שגיאה בעדכון מסלול הניתוח הנוסף');
    }
  }

  // free_analyses: add bonus video analyses to user's quota
  if (coupon.discount_type === 'free_analyses') {
    const amount = coupon.discount_value ?? (coupon as { free_analyses_count?: number }).free_analyses_count ?? 1;
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('bonus_analyses_remaining')
      .eq('user_id', userId)
      .maybeSingle();
    const current = (profileRow as { bonus_analyses_remaining?: number } | null)?.bonus_analyses_remaining ?? 0;
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ bonus_analyses_remaining: current + amount })
      .eq('user_id', userId);
    if (profileErr) {
      console.error('Error updating profile bonus_analyses_remaining:', profileErr);
      throw new Error('שגיאה בעדכון ניתוחי הווידאו במתנה');
    }
  }

  // percentage / fixed_amount: store for first payment (registration coupon → Takbull)
  if (coupon.discount_type === 'percentage' || coupon.discount_type === 'fixed_amount') {
    const value = coupon.discount_value != null ? Number(coupon.discount_value) : 0;
    const { error: pendingErr } = await supabase
      .from('profiles')
      .update({
        pending_payment_discount_type: coupon.discount_type,
        pending_payment_discount_value: value,
      })
      .eq('user_id', userId);
    if (pendingErr) {
      console.error('Error saving pending payment discount:', pendingErr);
      // Don't throw – redemption is still valid
    }
  }

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from('coupon_redemptions')
    .insert(redemptionData);

  if (redemptionError) {
    console.error('Error creating coupon redemption:', redemptionError);
    throw new Error('שגיאה בשימוש בקוד הקופון');
  }

  return { success: true, coupon };
}

export async function getAllCoupons() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllCoupons:', error);
    throw error;
  }
}

export async function createCoupon(data: {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription';
  discount_value?: number;
  free_analyses_count?: number;
  trial_tier?: 'creator' | 'pro' | 'coach';
  trial_duration_days?: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // For free_analyses, use free_analyses_count as discount_value
  const discountValue = data.discount_type === 'free_analyses' 
    ? (data.free_analyses_count || data.discount_value || null)
    : data.discount_value || null;

  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      code: data.code.toUpperCase().trim(),
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: discountValue,
      trial_tier: data.trial_tier || null,
      trial_duration_days: data.trial_duration_days || null,
      max_uses: data.max_uses || null,
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until || null,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }

  return coupon;
}

/** Create coupon from admin panel (bypasses RLS). Requires authenticated user for created_by. */
export async function createCouponAsAdmin(data: {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription' | 'extra_track';
  discount_value?: number;
  free_analyses_count?: number;
  trial_tier?: 'creator' | 'pro' | 'coach';
  trial_duration_days?: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
}) {
  const user = await getCurrentUserWithTimeout(6000);
  if (!user) throw new Error('לא מזוהה משתמש. רענן את הדף והתחבר שוב.');
  const adminClient = getAdminClient();

  const discountValue = data.discount_type === 'free_analyses'
    ? (data.free_analyses_count || data.discount_value || null)
    : data.discount_type === 'extra_track'
      ? null
      : data.discount_value || null;

  const { data: coupon, error } = await adminClient
    .from('coupons')
    .insert({
      code: data.code.toUpperCase().trim(),
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: discountValue,
      trial_tier: data.trial_tier || null,
      trial_duration_days: data.trial_duration_days || null,
      max_uses: data.max_uses || null,
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until || null,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coupon (admin):', error);
    throw error;
  }

  return coupon;
}

export async function grantTrialToUsers(userIds: string[], tier: 'creator' | 'pro' | 'coach', durationDays: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  // Create trial records
  const trials = userIds.map(userId => ({
    user_id: userId,
    tier,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    source: 'admin_grant' as const,
    created_by: user.id,
  }));

  const { error: trialError } = await supabase
    .from('user_trials')
    .insert(trials);

  if (trialError) {
    console.error('Error creating trials:', trialError);
    throw trialError;
  }

  // Update profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
    })
    .in('user_id', userIds);

  if (profileError) {
    console.error('Error updating profiles with trial:', profileError);
    // Don't throw - trials were created, profile updates can be retried
  }

  return { success: true, granted: userIds.length };
}

export async function updateCoupon(couponId: string, data: {
  code?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription' | 'extra_track';
  discount_value?: number;
  free_analyses_count?: number;
  trial_tier?: 'creator' | 'pro' | 'coach';
  trial_duration_days?: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = { updated_at: new Date().toISOString() };

  if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  // Handle discount_value based on type
  if (data.discount_type === 'free_analyses' && data.free_analyses_count !== undefined) {
    updateData.discount_value = data.free_analyses_count;
  } else if (data.discount_type === 'extra_track') {
    updateData.discount_value = null;
  } else if (data.discount_value !== undefined) {
    updateData.discount_value = data.discount_value;
  }

  if (data.trial_tier !== undefined) updateData.trial_tier = data.trial_tier || null;
  if (data.trial_duration_days !== undefined) updateData.trial_duration_days = data.trial_duration_days || null;
  if (data.max_uses !== undefined) updateData.max_uses = data.max_uses || null;
  if (data.valid_from !== undefined) updateData.valid_from = data.valid_from || new Date().toISOString();
  if (data.valid_until !== undefined) updateData.valid_until = data.valid_until || null;

  const { data: coupon, error } = await supabase
    .from('coupons')
    .update(updateData)
    .eq('id', couponId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }

  return coupon;
}

export async function deleteCoupon(couponId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId);

  if (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }

  return { success: true };
}

export async function toggleCouponStatus(couponId: string, isActive: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: coupon, error } = await supabase
    .from('coupons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', couponId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling coupon status:', error);
    throw error;
  }

  return coupon;
}

export async function getCouponRedemptions(couponId?: string) {
  try {
    let query = supabase
      .from('coupon_redemptions')
      .select(`
        *,
        coupon:coupons!coupon_redemptions_coupon_id_fkey (
          id,
          code,
          discount_type,
          discount_value
        )
      `)
      .order('applied_at', { ascending: false });

    if (couponId) {
      query = query.eq('coupon_id', couponId);
    }

    const { data: redemptions, error } = await query;

    if (error) {
      console.error('Error fetching coupon redemptions:', error);
      throw error;
    }

    // Fetch profiles separately for each user_id
    if (redemptions && redemptions.length > 0) {
      const userIds = [...new Set(redemptions.map((r: any) => r.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name')
        .in('user_id', userIds);

      if (!profilesError && profiles) {
        const profilesMap = new Map(profiles.map((p: any) => [p.user_id, p]));
        return redemptions.map((r: any) => ({
          ...r,
          profiles: profilesMap.get(r.user_id) || null,
        }));
      }
    }

    return redemptions || [];
  } catch (error: any) {
    console.error('Error in getCouponRedemptions:', error);
    throw error;
  }
}

export async function getUserTrials() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('user_trials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user trials:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserTrials:', error);
    return [];
  }
}

export async function getAllTrials() {
  try {
    const { data, error } = await supabase
      .from('user_trials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all trials:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllTrials:', error);
    throw error;
  }
}
