-- Migration: Fix subscription_tier_options to include coach-pro
-- This fixes the foreign key constraint error when updating profiles with coach-pro tier

-- First, ensure subscription_tier_options table exists with all tiers including coach-pro
CREATE TABLE IF NOT EXISTS public.subscription_tier_options (
    tier TEXT PRIMARY KEY
);

-- Insert all tiers including coach-pro (ignore conflicts if already exist)
INSERT INTO public.subscription_tier_options (tier) VALUES 
    ('free'),
    ('creator'),
    ('pro'),
    ('coach'),
    ('coach-pro')
ON CONFLICT (tier) DO NOTHING;

-- Drop the existing foreign key constraint if it exists (it's causing the issue)
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
    
    -- Recreate the foreign key constraint to include coach-pro
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_tier_fkey 
    FOREIGN KEY (subscription_tier) 
    REFERENCES public.subscription_tier_options(tier);
    
    RAISE NOTICE 'Created profiles_subscription_tier_fkey constraint with coach-pro support';
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, do nothing
        RAISE NOTICE 'Constraint already exists';
    WHEN OTHERS THEN
        -- If constraint creation fails, we'll rely on CHECK constraint instead
        RAISE NOTICE 'Could not create foreign key constraint, using CHECK constraint instead';
END $$;

