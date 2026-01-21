-- ============================================
-- ADD ADMIN ROLE TO PROFILES
-- ============================================
-- Note: This migration only adds the role column and index.
-- Admin RLS policies and functions are now defined in migration 022_admin_system_refactored.sql

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

