-- Remove unique constraint on profiles.phone
-- Phone is only updated during paid upgrade; uniqueness is not required.
-- Run this in Supabase Dashboard → SQL Editor.

DROP INDEX IF EXISTS public.idx_profiles_phone_unique;
