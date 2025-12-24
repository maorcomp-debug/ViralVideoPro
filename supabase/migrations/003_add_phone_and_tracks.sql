-- ============================================
-- ADD PHONE AND SELECTED TRACKS TO PROFILES
-- ============================================

-- Add phone column to profiles (with unique constraint for preventing duplicate accounts)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create unique index on phone (allowing NULL values but ensuring uniqueness when present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique 
ON public.profiles(phone) 
WHERE phone IS NOT NULL;

-- Add selected_tracks column to store array of selected tracks (for creators who can choose 2 tracks)
-- This will store track IDs like: ['actors', 'musicians'] or ['creators', 'influencers']
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_tracks TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add selected_primary_track column for free users (who can only choose 1 track)
-- For free tier: this will be the single track they chose
-- For other tiers: this will be the first selected track or the main track they use
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_primary_track TEXT 
CHECK (selected_primary_track IS NULL OR selected_primary_track IN ('actors', 'musicians', 'creators', 'influencers', 'coach'));

-- Ensure email uniqueness (if not already enforced)
-- Note: email might already be unique via auth.users, but we add index here for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
ON public.profiles(email) 
WHERE email IS NOT NULL;

-- Add constraint to ensure phone is provided for new registrations
-- We'll enforce this in application logic, not at DB level (to allow NULL for existing users)
-- But we add a comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'Phone number required for new registrations. Must be unique.';

-- Update handle_new_user trigger to include phone and set default selected_tracks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        phone,
        selected_tracks,
        subscription_tier
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone', -- Extract phone from user metadata
        ARRAY[]::TEXT[], -- Default empty array, will be set after track selection
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE RLS POLICIES FOR PHONE FIELD
-- ============================================

-- Phone field should be readable by the user themselves and admins
-- (Already covered by existing policies, but we ensure it's included)

