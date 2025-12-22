import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Loading Supabase configuration...');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ MISSING');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file');
  console.error('Make sure to restart the dev server after creating/updating .env.local');
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
          created_at: string;
          updated_at: string;
          subscription_tier: 'free' | 'creator' | 'pro' | 'coach';
          subscription_period: 'monthly' | 'yearly' | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          subscription_status: 'active' | 'inactive' | 'cancelled' | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
    };
  };
}

