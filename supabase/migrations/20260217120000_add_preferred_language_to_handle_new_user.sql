-- Update handle_new_user to copy preferred_language from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    signup_tier TEXT;
    signup_primary_track TEXT;
    signup_preferred_language TEXT;
    profile_subscription_status TEXT;
    profile_subscription_start TIMESTAMPTZ;
    profile_subscription_end TIMESTAMPTZ;
    profile_selected_tracks TEXT[];
BEGIN
    signup_tier := COALESCE(NEW.raw_user_meta_data->>'signup_tier', 'free');
    signup_primary_track := NEW.raw_user_meta_data->>'signup_primary_track';
    signup_preferred_language := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'he');
    IF signup_preferred_language NOT IN ('he', 'en') THEN
        signup_preferred_language := 'he';
    END IF;
    
    profile_subscription_status := 'active';
    profile_subscription_start := NOW();
    
    IF signup_tier IN ('free', 'creator') THEN
        profile_subscription_end := NULL;
    ELSE
        profile_subscription_end := profile_subscription_start + INTERVAL '30 days';
    END IF;
    
    IF signup_tier IN ('free', 'creator') AND signup_primary_track IS NOT NULL THEN
        profile_selected_tracks := ARRAY[signup_primary_track];
    ELSIF signup_tier NOT IN ('free', 'creator') THEN
        profile_selected_tracks := ARRAY['actors', 'musicians', 'creators', 'influencers'];
        IF signup_primary_track IS NULL THEN
            signup_primary_track := 'actors';
        END IF;
    ELSE
        profile_selected_tracks := ARRAY[]::TEXT[];
    END IF;
    
    INSERT INTO public.profiles (
        user_id,
        email,
        subscription_tier,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        selected_primary_track,
        selected_tracks,
        full_name,
        preferred_language
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        signup_preferred_language
    );
    
    RETURN NEW;
END;
$function$;
