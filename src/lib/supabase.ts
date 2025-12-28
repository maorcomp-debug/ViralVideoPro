import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Loading Supabase configuration...');
  console.log('Full VITE_SUPABASE_URL from env:', import.meta.env.VITE_SUPABASE_URL || 'NOT FOUND');
  console.log('Full VITE_SUPABASE_ANON_KEY from env:', import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 50)}...` : 'NOT FOUND');
  console.log('Trimmed VITE_SUPABASE_URL:', supabaseUrl || '❌ MISSING');
  console.log('Trimmed VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 50)}...` : '❌ MISSING');
  console.log('URL length:', supabaseUrl?.length || 0);
  console.log('Key length:', supabaseAnonKey?.length || 0);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('Raw VITE_SUPABASE_URL from env:', import.meta.env.VITE_SUPABASE_URL || 'NOT FOUND');
  console.error('Raw VITE_SUPABASE_ANON_KEY from env:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'FOUND' : 'NOT FOUND');
  console.error('Trimmed VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('Trimmed VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'FOUND' : 'MISSING');
  console.error('⚠️ Please check:');
  console.error('1. .env.local file exists in project root');
  console.error('2. File contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('3. Dev server was restarted after creating/updating .env.local');
  console.error('4. Variables start with VITE_ prefix (required by Vite)');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid VITE_SUPABASE_URL format. Should start with https://');
}

// Validate key format (JWT tokens start with eyJ)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY format looks unusual (should start with eyJ...)');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for better security and browser compatibility
    },
    global: {
      headers: {
        'X-Client-Info': 'viraly-video-director-pro'
      }
    }
  }
);

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          selected_tracks: string[] | null;
          selected_primary_track: 'actors' | 'musicians' | 'creators' | 'influencers' | 'coach' | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
          subscription_tier: 'free' | 'creator' | 'pro' | 'coach';
          subscription_period: 'monthly' | 'yearly' | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          subscription_status: 'active' | 'inactive' | 'cancelled' | null;
          receive_updates: boolean;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          created_by: string;
          created_at: string;
          sent_at: string | null;
          target_tier: string[] | null;
          target_all: boolean;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      user_announcements: {
        Row: {
          id: string;
          user_id: string;
          announcement_id: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_announcements']['Insert']>;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription';
          discount_value: number | null;
          trial_tier: 'creator' | 'pro' | 'coach' | null;
          trial_duration_days: number | null;
          max_uses: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coupons']['Row'], 'id' | 'created_at' | 'updated_at' | 'used_count'>;
        Update: Partial<Database['public']['Tables']['coupons']['Insert']>;
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          user_id: string;
          applied_at: string;
          discount_applied: number | null;
          applied_discount_type: string;
          trial_tier: string | null;
          trial_start_date: string | null;
          trial_end_date: string | null;
        };
        Insert: Omit<Database['public']['Tables']['coupon_redemptions']['Row'], 'id' | 'applied_at'>;
        Update: Partial<Database['public']['Tables']['coupon_redemptions']['Insert']>;
      };
      user_trials: {
        Row: {
          id: string;
          user_id: string;
          tier: 'creator' | 'pro' | 'coach';
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_by: string | null;
          source: 'coupon' | 'admin_grant' | 'announcement' | null;
          source_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_trials']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_trials']['Insert']>;
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          duration_seconds: number | null;
          mime_type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['videos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['videos']['Insert']>;
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          video_id: string | null;
          trainee_id: string | null;
          track: 'actors' | 'musicians' | 'creators' | 'coach' | 'influencers';
          coach_training_track: 'actors' | 'musicians' | 'creators' | 'influencers' | null;
          analysis_depth: 'standard' | 'deep' | null;
          expert_panel: string[];
          prompt: string | null;
          result: any; // JSON
          average_score: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analyses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>;
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          analyses_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['usage']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['usage']['Insert']>;
      };
      plans: {
        Row: {
          id: string;
          tier: 'free' | 'creator' | 'pro' | 'coach';
          name: string;
          description: string;
          monthly_price: number;
          yearly_price: number;
          max_analyses_per_period: number;
          max_video_seconds: number;
          max_file_bytes: number;
          features: any; // JSON
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['plans']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: 'active' | 'inactive' | 'cancelled' | 'expired';
          billing_period: 'monthly' | 'yearly';
          start_date: string;
          end_date: string;
          payment_provider: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      trainees: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trainees']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trainees']['Insert']>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          status: 'pending' | 'read' | 'replied' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_messages']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
      };
    };
  };
}

