-- Migration: Add coach-pro tier and video minutes/trainees limits
-- This migration:
-- 1. Adds 'coach-pro' to tier constraints
-- 2. Adds max_video_minutes_per_period and max_trainees columns to plans
-- 3. Updates existing plans with new limits
-- 4. Adds the new coach-pro plan

-- ============================================
-- Update PLANS TABLE
-- ============================================

-- Drop and recreate the CHECK constraint to include 'coach-pro'
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_tier_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_tier_check CHECK (tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));

-- Add new columns for video minutes and trainees limits
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_video_minutes_per_period INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_trainees INTEGER;

-- ============================================
-- Update PROFILES TABLE
-- ============================================

-- Drop and recreate the CHECK constraint to include 'coach-pro'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));

-- ============================================
-- Update existing plans with new limits
-- ============================================

UPDATE public.plans SET 
  max_video_minutes_per_period = 0,
  max_trainees = NULL
WHERE tier = 'free';

UPDATE public.plans SET 
  max_video_minutes_per_period = 30,
  max_trainees = NULL
WHERE tier = 'creator';

UPDATE public.plans SET 
  max_video_minutes_per_period = 100,
  max_trainees = NULL
WHERE tier = 'pro';

UPDATE public.plans SET 
  max_video_minutes_per_period = 200,
  max_trainees = 10
WHERE tier = 'coach';

-- ============================================
-- Add new coach-pro plan
-- ============================================

INSERT INTO public.plans (
  tier, 
  name, 
  description, 
  monthly_price, 
  yearly_price, 
  max_analyses_per_period, 
  max_video_seconds, 
  max_file_bytes, 
  max_video_minutes_per_period,
  max_trainees,
  features, 
  is_active
) VALUES (
  'coach-pro', 
  'מאמנים, סוכנויות ובתי ספר למשחק PRO', 
  'פלטפורמה מקצועית למאמנים וסטודיואים - גרסת PRO', 
  299, 
  2990, 
  -1, 
  300, 
  41943040, 
  300,
  30,
  '{"saveHistory": true, "improvementTracking": true, "comparison": true, "advancedAnalysis": true, "traineeManagement": true, "pdfExport": true, "coachDashboard": true, "customExperts": true}', 
  true
)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_analyses_per_period = EXCLUDED.max_analyses_per_period,
  max_video_seconds = EXCLUDED.max_video_seconds,
  max_file_bytes = EXCLUDED.max_file_bytes,
  max_video_minutes_per_period = EXCLUDED.max_video_minutes_per_period,
  max_trainees = EXCLUDED.max_trainees,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

