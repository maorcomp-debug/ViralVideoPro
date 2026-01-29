-- Add bonus columns to profiles for coupon benefits:
-- bonus_tracks: extra analysis track from "מסלול ניתוח נוסף חינם" (extra_track)
-- bonus_analyses_remaining: free video analyses from "ניתוח וידאו מתנה" (free_analyses)
-- Run this in Supabase SQL Editor if the columns don't exist yet.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_tracks integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_analyses_remaining integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.bonus_tracks IS 'Extra analysis tracks from extra_track coupons (for free/creator tiers)';
COMMENT ON COLUMN public.profiles.bonus_analyses_remaining IS 'Free video analyses from free_analyses coupons; added to effective limit per period';
