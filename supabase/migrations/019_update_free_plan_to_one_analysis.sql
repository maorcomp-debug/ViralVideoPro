-- Migration: Update free plan to 1 analysis instead of 2
-- Updates the free plan's max_analyses_per_period from 2 to 1

UPDATE public.plans 
SET max_analyses_per_period = 1
WHERE tier = 'free';

-- Verify the update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.plans 
    WHERE tier = 'free' AND max_analyses_per_period = 1
  ) THEN
    RAISE EXCEPTION 'Failed to update free plan max_analyses_per_period to 1';
  END IF;
END $$;
