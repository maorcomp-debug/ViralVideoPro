-- Migration: Update all plans with correct pricing and limits
-- Updates all subscription plans to match the current configuration:
-- free: 1 analysis, 0 NIS
-- creator: 10 analyses, 30 min/month, 49 NIS
-- pro: 30 analyses, 100 min/month, 99 NIS
-- coach: unlimited analyses, 200 min/month, 10 trainees, 199 NIS
-- coach-pro: unlimited analyses, 300 min/month, 30 trainees, 299 NIS

-- Update free plan
UPDATE public.plans 
SET 
  max_analyses_per_period = 1,
  monthly_price = 0,
  yearly_price = 0,
  max_video_seconds = 60,
  max_file_bytes = 10485760, -- 10MB
  max_video_minutes_per_period = 0
WHERE tier = 'free';

-- Update creator plan
UPDATE public.plans 
SET 
  max_analyses_per_period = 10,
  monthly_price = 49,
  yearly_price = 490,
  max_video_seconds = 180, -- 3 minutes
  max_file_bytes = 15728640, -- 15MB
  max_video_minutes_per_period = 30
WHERE tier = 'creator';

-- Update pro plan
UPDATE public.plans 
SET 
  max_analyses_per_period = 30,
  monthly_price = 99,
  yearly_price = 990,
  max_video_seconds = 300, -- 5 minutes
  max_file_bytes = 41943040, -- 40MB
  max_video_minutes_per_period = 100
WHERE tier = 'pro';

-- Update coach plan
UPDATE public.plans 
SET 
  max_analyses_per_period = -1, -- Unlimited
  monthly_price = 199,
  yearly_price = 1990,
  max_video_seconds = 300, -- 5 minutes
  max_file_bytes = 41943040, -- 40MB
  max_video_minutes_per_period = 200,
  max_trainees = 10
WHERE tier = 'coach';

-- Update coach-pro plan (upsert to ensure it exists)
INSERT INTO public.plans (tier, name, description, monthly_price, yearly_price, max_analyses_per_period, max_video_seconds, max_file_bytes, max_video_minutes_per_period, max_trainees, features, is_active)
VALUES (
  'coach-pro', 
  'מאמנים, סוכנויות ובתי ספר למשחק', 
  'יותר מתאמנים, יותר דקות ניתוח', 
  299, 
  2990, 
  -1, -- Unlimited analyses
  300, -- 5 minutes
  41943040, -- 40MB
  300, -- 300 minutes per month
  30, -- 30 trainees
  '{"saveHistory":true,"improvementTracking":true,"comparison":true,"advancedAnalysis":true,"traineeManagement":true,"pdfExport":true,"coachDashboard":true,"customExperts":true}', 
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

-- Verify all updates
DO $$
DECLARE
  free_count INTEGER;
  creator_count INTEGER;
  pro_count INTEGER;
  coach_count INTEGER;
  coach_pro_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_count FROM public.plans WHERE tier = 'free' AND max_analyses_per_period = 1 AND monthly_price = 0;
  SELECT COUNT(*) INTO creator_count FROM public.plans WHERE tier = 'creator' AND max_analyses_per_period = 10 AND monthly_price = 49 AND max_video_minutes_per_period = 30;
  SELECT COUNT(*) INTO pro_count FROM public.plans WHERE tier = 'pro' AND max_analyses_per_period = 30 AND monthly_price = 99 AND max_video_minutes_per_period = 100;
  SELECT COUNT(*) INTO coach_count FROM public.plans WHERE tier = 'coach' AND max_analyses_per_period = -1 AND monthly_price = 199 AND max_video_minutes_per_period = 200 AND max_trainees = 10;
  SELECT COUNT(*) INTO coach_pro_count FROM public.plans WHERE tier = 'coach-pro' AND max_analyses_per_period = -1 AND monthly_price = 299 AND max_video_minutes_per_period = 300 AND max_trainees = 30;
  
  IF free_count != 1 THEN
    RAISE EXCEPTION 'Failed to update free plan correctly';
  END IF;
  IF creator_count != 1 THEN
    RAISE EXCEPTION 'Failed to update creator plan correctly';
  END IF;
  IF pro_count != 1 THEN
    RAISE EXCEPTION 'Failed to update pro plan correctly';
  END IF;
  IF coach_count != 1 THEN
    RAISE EXCEPTION 'Failed to update coach plan correctly';
  END IF;
  IF coach_pro_count != 1 THEN
    RAISE EXCEPTION 'Failed to update coach-pro plan correctly';
  END IF;
END $$;
