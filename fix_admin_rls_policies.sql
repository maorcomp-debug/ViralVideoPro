-- Fix RLS Policies for Admin Access
-- Run this in Supabase SQL Editor to allow admin to read all data

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create SELECT policy - admins can see all, users can see own
CREATE POLICY "Admins can view all profiles"
    ON public.profiles 
    FOR SELECT
    USING (
        -- Allow if user is admin
        role = 'admin'
        OR
        -- Allow users to see their own profile
        user_id = auth.uid()
    );

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all profiles"
    ON public.profiles 
    FOR UPDATE
    USING (
        -- Allow if user is admin
        role = 'admin'
        OR
        -- Allow users to update their own profile
        user_id = auth.uid()
    );

-- Create INSERT policy - authenticated users can create profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles 
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- ANALYSES TABLE
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;

-- Create SELECT policy - admins can see all, users can see own
CREATE POLICY "Admins can view all analyses"
    ON public.analyses 
    FOR SELECT
    USING (
        -- Allow if user is admin (check via profiles table)
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        -- Allow users to see their own analyses
        user_id = auth.uid()
    );

-- Create INSERT policy - users can create own analyses
CREATE POLICY "Users can insert own analyses"
    ON public.analyses 
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all analyses"
    ON public.analyses 
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        user_id = auth.uid()
    );

-- Create DELETE policy - admins can delete all, users can delete own
CREATE POLICY "Admins can delete all analyses"
    ON public.analyses 
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        user_id = auth.uid()
    );

-- ============================================
-- VIDEOS TABLE
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view own videos" ON public.videos;

-- Create SELECT policy - admins can see all, users can see own
CREATE POLICY "Admins can view all videos"
    ON public.videos 
    FOR SELECT
    USING (
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        -- Allow users to see their own videos
        user_id = auth.uid()
    );

-- Create INSERT policy - users can create own videos
CREATE POLICY "Users can insert own videos"
    ON public.videos 
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all videos"
    ON public.videos 
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        user_id = auth.uid()
    );

-- Create DELETE policy - admins can delete all, users can delete own
CREATE POLICY "Admins can delete all videos"
    ON public.videos 
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        user_id = auth.uid()
    );

-- ============================================
-- RPC FUNCTION FOR ADMIN STATS
-- ============================================

-- Create a function to get admin stats (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Check if caller is admin
    SELECT * FROM profiles
    WHERE EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
    ORDER BY created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'analyses', 'videos')
ORDER BY tablename, policyname;
