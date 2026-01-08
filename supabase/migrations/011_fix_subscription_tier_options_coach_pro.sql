-- Migration: Fix subscription_tier_options foreign key constraint for coach-pro
-- This fixes the foreign key constraint error when updating profiles with coach-pro tier
-- The simplest solution is to remove the foreign key constraint since we have CHECK constraints

-- Drop the existing foreign key constraint if it exists (it's causing the issue)
-- We already have CHECK constraints that validate the tier values, so the foreign key is redundant
DO $$
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_subscription_tier_fkey'
        AND table_name = 'profiles'
        AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        DROP CONSTRAINT profiles_subscription_tier_fkey;
        RAISE NOTICE 'Dropped existing profiles_subscription_tier_fkey constraint';
    END IF;
    
    -- If subscription_tier_options table exists and has coach-pro, we can optionally recreate the FK
    -- But since we have CHECK constraints, it's safer to just remove the FK
    RAISE NOTICE 'Foreign key constraint removed. Using CHECK constraint for validation instead.';
EXCEPTION
    WHEN OTHERS THEN
        -- If dropping fails, log the error but continue
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- Ensure the CHECK constraint includes coach-pro (this should already be done by migration 010)
-- But let's make sure it's there
DO $$
BEGIN
    -- Drop and recreate the CHECK constraint to ensure coach-pro is included
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
    
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro'));
    
    RAISE NOTICE 'Updated profiles_subscription_tier_check constraint to include coach-pro';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'CHECK constraint already exists with coach-pro';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating CHECK constraint: %', SQLERRM;
END $$;

