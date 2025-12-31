-- Migration: Add unique constraint on (user_id, plan_id) for subscriptions table
-- This allows upsert operations to work correctly

-- ============================================
-- ADD UNIQUE CONSTRAINT TO SUBSCRIPTIONS
-- ============================================

-- First, check if there are any duplicate (user_id, plan_id) combinations
-- If there are, we need to handle them before adding the constraint

-- Delete duplicate subscriptions, keeping only the most recent one
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, plan_id ORDER BY created_at DESC) as rn
    FROM public.subscriptions
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint on (user_id, plan_id)
-- This allows upsert operations with ON CONFLICT (user_id, plan_id)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_plan_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_plan_id_key UNIQUE (user_id, plan_id);
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_plan_id 
ON public.subscriptions(user_id, plan_id);

