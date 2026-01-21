import { supabase } from './supabase.js';
import type { Database } from './supabase';

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
    const subscription = await getCurrentSubscription();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (!subscription || !subscription.plans) {
      // Free tier - count analyses in current calendar month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const { count, error } = await supabase
        .from('analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) {
        console.error('Error counting analyses:', error);
        return null;
      }

      return {
        analysesUsed: count || 0,
        periodStart: monthStart,
        periodEnd: monthEnd,
      };
    }

    // Paid tier - count analyses in subscription period
    const { count, error } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', subscription.start_date)
      .lte('created_at', subscription.end_date);

    if (error) {
      console.error('Error counting analyses:', error);
      return null;
    }

    return {
      analysesUsed: count || 0,
      periodStart: new Date(subscription.start_date),
      periodEnd: new Date(subscription.end_date),
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

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      ...videoData,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      ...analysisData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving analysis:', error);
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return false;
    }

    // Fast path: primary admin by email (robust גם אם יש בעיות RLS על profiles)
    if (user.email && user.email.toLowerCase() === 'viralypro@gmail.com') {
      return true;
    }

    // Otherwise: בדיקה לפי role בפרופיל (כש-RLS מאפשר)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError || !profile) {
      return false;
    }
    
    return profile.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAllUsers() {
  try {
    console.log('🔍 getAllUsers: Starting fetch...');
    
    // Try direct select first (faster and more reliable)
    console.log('🔍 getAllUsers: Attempting direct select from profiles...');
    
    const { data: directData, error: directError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!directError && directData) {
      console.log('✅ getAllUsers: loaded via direct select, count =', directData.length);
      if (directData.length > 0) {
        console.log('📋 getAllUsers: First user sample:', { email: directData[0].email, role: directData[0].role });
      }
      return directData;
    }

    if (directError) {
      console.warn('⚠️ getAllUsers: Direct select error, trying RPC fallback:', directError.message);
    }

    // Fallback to RPC if direct select fails
    console.log('🔍 getAllUsers: Attempting admin_get_all_users RPC...');
    
    const rpcPromise = supabase.rpc('admin_get_all_users');
    const rpcTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('RPC timeout after 15 seconds')), 15000)
    );
    
    try {
      const rpcResult = await Promise.race([rpcPromise, rpcTimeoutPromise]) as { data: any, error: any };
      const { data, error } = rpcResult;

      if (!error && data) {
        console.log('✅ getAllUsers: loaded via RPC, count =', data.length);
        return data;
      }

      if (error) {
        console.error('❌ getAllUsers: RPC error:', error.message);
      }
    } catch (rpcError: any) {
      console.error('❌ getAllUsers: RPC timeout/exception:', rpcError.message);
    }

    // If both fail, return empty array
    console.error('❌ getAllUsers: All methods failed');
    const { data, error } = { data: directData, error: directError };

    if (error) {
      console.error('❌ getAllUsers: Direct select error:', error);
      console.error('❌ getAllUsers: Error details:', { 
        message: error.message, 
        code: error.code, 
        details: error.details,
        hint: error.hint 
      });
      return [];
    }

    console.log('✅ getAllUsers: loaded via direct select, count =', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 getAllUsers: First user sample:', { email: data[0].email, role: data[0].role, fullName: data[0].full_name });
    } else {
      console.warn('⚠️ getAllUsers: No users returned (empty array or null)');
    }
    return data || [];
  } catch (error: any) {
    console.error('❌ getAllUsers: Final exception:', error);
    console.error('❌ getAllUsers: Exception message:', error.message);
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

export async function getAllAnalyses() {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all analyses:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllAnalyses:', error);
    throw error;
  }
}

export async function getAllVideos() {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all videos:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllVideos:', error);
    throw error;
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
  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw profileError;
  }

  // If subscription_tier is being updated, also update/delete subscriptions table
  if (updates.subscription_tier !== undefined) {
    const newTier = updates.subscription_tier;
    
    // Get the plan_id for the new tier
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('tier', newTier)
      .eq('is_active', true)
      .maybeSingle();

    if (planError) {
      console.error('Error fetching plan:', planError);
      // Don't throw - profile update succeeded, subscription update is secondary
    }

    if (newTier === 'free') {
      // For free tier, delete all active subscriptions
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (deleteError) {
        console.error('Error cancelling subscriptions:', deleteError);
        // Don't throw - profile update succeeded
      }
    } else if (plan) {
      // For paid tiers, update or create subscription
      const startDate = updates.subscription_start_date 
        ? new Date(updates.subscription_start_date)
        : new Date();
      
      const endDate = updates.subscription_end_date
        ? new Date(updates.subscription_end_date)
        : (() => {
            const end = new Date(startDate);
            if (updates.subscription_period === 'yearly') {
              end.setFullYear(end.getFullYear() + 1);
            } else {
              end.setMonth(end.getMonth() + 1);
            }
            return end;
          })();

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: plan.id,
          status: updates.subscription_status === 'active' ? 'active' : 'inactive',
          billing_period: (updates.subscription_period as 'monthly' | 'yearly') || 'monthly',
          start_date: startDate.toISOString(),
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

export async function deleteUser(userId: string) {
  // Get current user token for authorization
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

export async function getAdminStats() {
  console.log('📊 getAdminStats: Starting fetch...');
  
  try {
    // Get total counts - NO TIMEOUT, just show real errors
    console.log('🔍 Fetching user count...');
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('❌ User count ERROR:', usersError);
      console.error('❌ Error details:', {
        message: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint
      });
    }

    console.log('🔍 Fetching analyses count...');
    const { count: totalAnalyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true });
    if (analysesError) {
      console.error('❌ Analyses count ERROR:', analysesError);
    }

    console.log('🔍 Fetching videos count...');
    const { count: totalVideos, error: videosError } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true });
    if (videosError) {
      console.error('❌ Videos count ERROR:', videosError);
    }

    // Get tier distribution
    console.log('🔍 Fetching tier distribution...');
    const { data: tierData, error: tierError } = await supabase
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
    console.log('🔍 Fetching role distribution...');
    const { data: roleData, error: roleError } = await supabase
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
    console.log('🔍 Fetching recent users...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentUsers, error: recentError } = await supabase
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
    
    console.log('✅ getAdminStats: Success!', result);
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

export async function sendAnnouncementToUsers(announcementId: string) {
  const { data: announcement, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single();

  if (annError || !announcement) {
    throw new Error('Announcement not found');
  }

  // Build query for target users
  let usersQuery = supabase
    .from('profiles')
    .select('user_id')
    .eq('receive_updates', true);

  // Filter by tier if specified
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

  const { error: insertError } = await supabase
    .from('user_announcements')
    .insert(userAnnouncements);

  if (insertError) {
    console.error('Error creating user_announcements:', insertError);
    throw insertError;
  }

  // Update announcement sent_at
  const { error: updateError } = await supabase
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
  discount_type?: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription';
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
