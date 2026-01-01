-- Migration: Update plans pricing and video minutes limits
-- Adds columns, updates constraints, sets limits, and upserts coach-pro plan

-- Add columns if missing
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS max_video_minutes_per_period INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_trainees INTEGER;

-- Update constraints to include coach-pro
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_tier_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_tier_check CHECK (tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));

-- Update all plans limits in single operation
UPDATE public.plans SET
  max_video_minutes_per_period = CASE tier WHEN 'free' THEN 0 WHEN 'creator' THEN 30 WHEN 'pro' THEN 100 WHEN 'coach' THEN 200 WHEN 'coach-pro' THEN 300 END,
  max_trainees = CASE tier WHEN 'coach' THEN 10 WHEN 'coach-pro' THEN 30 END
WHERE tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro');

-- Upsert coach-pro plan
INSERT INTO public.plans (tier, name, description, monthly_price, yearly_price, max_analyses_per_period, max_video_seconds, max_file_bytes, max_video_minutes_per_period, max_trainees, features, is_active)
VALUES ('coach-pro', 'מאמנים, סוכנויות ובתי ספר למשחק', 'יותר מתאמנים, יותר דקות ניתוח', 299, 2990, -1, 300, 41943040, 300, 30, '{"saveHistory":true,"improvementTracking":true,"comparison":true,"advancedAnalysis":true,"traineeManagement":true,"pdfExport":true,"coachDashboard":true,"customExperts":true}', true)
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
