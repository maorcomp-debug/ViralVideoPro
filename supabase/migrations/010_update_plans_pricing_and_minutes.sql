-- Migration: Update plans pricing and video minutes limits
-- This migration:
-- 1. Adds max_video_minutes_per_period and max_trainees columns if they don't exist
-- 2. Updates coach-pro plan name and description to match UI requirements
-- 3. Ensures all video minutes per period limits are correct:
--    - creator: 30 minutes/month
--    - pro: 100 minutes/month
--    - coach: 200 minutes/month
--    - coach-pro: 300 minutes/month
-- 4. Ensures coach-pro price is 299 ILS/month

-- ============================================
-- Add columns if they don't exist (from migration 006)
-- ============================================

-- Add max_video_minutes_per_period column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'max_video_minutes_per_period'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN max_video_minutes_per_period INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add max_trainees column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'max_trainees'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN max_trainees INTEGER;
    END IF;
END $$;

-- ============================================
-- Update tier constraints to include coach-pro (if needed)
-- ============================================

-- Drop and recreate the CHECK constraint to include 'coach-pro' if not already there
DO $$
BEGIN
    -- Check if constraint exists and includes coach-pro
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'plans_tier_check' 
        AND pg_get_constraintdef(oid) LIKE '%coach-pro%'
    ) THEN
        ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_tier_check;
        ALTER TABLE public.plans ADD CONSTRAINT plans_tier_check CHECK (tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));
    END IF;
END $$;

-- Update profiles constraint if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_subscription_tier_check' 
        AND pg_get_constraintdef(oid) LIKE '%coach-pro%'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));
    END IF;
END $$;

-- ============================================
-- Update video minutes per period limits
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
-- Update coach-pro plan
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
  'מאמנים, סוכנויות ובתי ספר למשחק', 
  'יותר מתאמנים, יותר דקות ניתוח', 
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

