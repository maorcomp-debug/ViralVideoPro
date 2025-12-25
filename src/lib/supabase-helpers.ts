import { supabase } from './supabase.js';
import type { Database } from './supabase';

// Helper functions for common operations

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
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
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `videos/${fileName}`;

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

  return { path: filePath, data };
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
    
    if (userError) {
      console.error('❌ isAdmin: Error getting user:', userError);
      return false;
    }
    
    if (!user) {
      console.warn('⚠️ isAdmin: No user found');
      return false;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ isAdmin: Error checking admin status:', error);
      return false;
    }

    const isAdminUser = profile?.role === 'admin';
    
    return isAdminUser;
  } catch (error) {
    console.error('❌ isAdmin: Exception:', error);
    return false;
  }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    throw error;
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
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
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
  // Note: This only deletes the profile. To fully delete the auth user,
  // you need to use an Edge Function with service role key.
  // The profile deletion will be handled by RLS policies for admins.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
  
  // Note: The auth user will remain but without a profile.
  // For full deletion, implement an Edge Function.
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
  try {
    // Get total counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const { count: totalAnalyses } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true });

    const { count: totalVideos } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true });

    // Get tier distribution
    const { data: tierData } = await supabase
      .from('profiles')
      .select('subscription_tier');

    const tierDistribution = tierData?.reduce((acc: any, profile: any) => {
      acc[profile.subscription_tier] = (acc[profile.subscription_tier] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get role distribution
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role');

    const roleDistribution = roleData?.reduce((acc: any, profile: any) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      totalAnalyses: totalAnalyses || 0,
      totalVideos: totalVideos || 0,
      recentUsers: recentUsers || 0,
      tierDistribution,
      roleDistribution,
    };
  } catch (error: any) {
    console.error('Error in getAdminStats:', error);
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
  await sendAnnouncementToUsers(announcement.id);

  return announcement;
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
