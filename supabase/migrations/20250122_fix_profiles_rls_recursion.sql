-- Migration: Fix infinite recursion in profiles RLS policies
-- Date: 2025-01-22
-- Problem: The previous migration created policies that check profiles table within profiles policies, causing infinite recursion
-- Solution: Simplify policies to avoid recursion by not querying profiles within profiles policies

-- First, disable RLS temporarily to fix the policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple SELECT policy - users can see their own profile
-- For admin access, we'll use a separate function or service role
CREATE POLICY "Users can view own profile"
    ON public.profiles 
    FOR SELECT
    USING (user_id = auth.uid());

-- Create simple UPDATE policy - users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles 
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create INSERT policy - authenticated users can create their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles 
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;

-- Note: Admin access to all profiles should be done via service role or a separate function
-- This avoids recursion issues. The admin panel should use service role key.
