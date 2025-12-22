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
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subscription } = await getCurrentSubscription();
  if (!subscription) {
    // Free tier - count total analyses
    const { data: analyses } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return {
      analysesUsed: analyses?.length || 0,
      periodStart: new Date(0),
      periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Far future
    };
  }

  const periodStart = new Date(subscription.start_date);
  const periodEnd = new Date(subscription.end_date);

  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  if (error) {
    console.error('Error fetching usage:', error);
    return null;
  }

  return {
    analysesUsed: count || 0,
    periodStart,
    periodEnd,
  };
}

export async function uploadVideo(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading video:', error);
    throw error;
  }

  // Get public URL (will be signed URL for private bucket)
  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

export async function saveVideoToDatabase(videoData: {
  file_name: string;
  file_path: string;
  file_size: number;
  duration_seconds: number | null;
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

