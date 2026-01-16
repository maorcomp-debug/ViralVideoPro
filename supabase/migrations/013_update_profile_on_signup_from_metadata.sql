-- ============================================
-- UPDATE PROFILE TRIGGER TO USE SIGNUP METADATA
-- ============================================
-- ⚠️⚠️⚠️ CRITICAL - DO NOT MODIFY THIS FUNCTION ⚠️⚠️⚠️
-- 
-- This migration FIXES the signup race condition issue that took many efforts to solve.
-- The trigger creates profiles with correct values from signup metadata IMMEDIATELY,
-- eliminating the need for separate profile updates after signup.
--
-- PROBLEM SOLVED: Profile was created with default values, then updated later,
-- causing race condition where loadUserData loaded incomplete profile.
-- SOLUTION: Trigger reads metadata (signup_tier, signup_primary_track) and creates
-- profile with all correct values from the start.
--
-- ⚠️ DO NOT MODIFY THIS FUNCTION - IT SOLVES A CRITICAL RACE CONDITION ⚠️
-- Date fixed: 2026-01-16
-- Status: WORKING - DO NOT TOUCH

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    signup_tier TEXT;
    signup_primary_track TEXT;
    profile_subscription_status TEXT;
    profile_subscription_start TIMESTAMPTZ;
    profile_subscription_end TIMESTAMPTZ;
    profile_selected_tracks TEXT[];
BEGIN
    -- Extract signup metadata
    signup_tier := COALESCE(NEW.raw_user_meta_data->>'signup_tier', 'free');
    signup_primary_track := NEW.raw_user_meta_data->>'signup_primary_track';
    
    -- Set subscription status to active for all tiers
    profile_subscription_status := 'active';
    profile_subscription_start := NOW();
    
    -- Set subscription end date based on tier
    IF signup_tier IN ('free', 'creator') THEN
        profile_subscription_end := NULL; -- Free and creator tiers don't expire
    ELSE
        -- Paid tiers get 30 days trial
        profile_subscription_end := profile_subscription_start + INTERVAL '30 days';
    END IF;
    
    -- Set selected tracks based on tier
    IF signup_tier IN ('free', 'creator') AND signup_primary_track IS NOT NULL THEN
        -- Free/creator tiers: single track selected
        profile_selected_tracks := ARRAY[signup_primary_track];
    ELSIF signup_tier NOT IN ('free', 'creator') THEN
        -- Paid tiers: all tracks available
        profile_selected_tracks := ARRAY['actors', 'musicians', 'creators', 'influencers'];
        -- Default primary track for paid tiers
        IF signup_primary_track IS NULL THEN
            signup_primary_track := 'actors';
        END IF;
    ELSE
        -- Free tier without track (fallback)
        profile_selected_tracks := ARRAY[]::TEXT[];
    END IF;
    
    -- Create profile with all signup metadata applied
    INSERT INTO public.profiles (
        user_id,
        email,
        subscription_tier,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        selected_primary_track,
        selected_tracks,
        full_name
    )
    VALUES (
        NEW.id,
        NEW.email,
        signup_tier,
        profile_subscription_status,
        profile_subscription_start,
        profile_subscription_end,
        signup_primary_track,
        profile_selected_tracks,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

