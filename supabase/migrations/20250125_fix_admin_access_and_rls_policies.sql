-- Migration: Fix admin access and RLS policies
-- Date: 2025-01-25
-- Problem: Admin user cannot access all profiles/analyses due to missing RLS policies
-- Solution: Create is_admin() function and add proper admin policies

-- ============================================
-- CREATE is_admin() FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'viralypro@gmail.com'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ============================================
-- FIX PROFILES RLS POLICIES
-- ============================================

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Create SELECT policy - admins can see all, users can see own
CREATE POLICY "Admins can view all profiles"
    ON public.profiles 
    FOR SELECT
    USING (
        is_admin()
        OR
        user_id = auth.uid()
    );

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all profiles"
    ON public.profiles 
    FOR UPDATE
    USING (
        is_admin()
        OR
        user_id = auth.uid()
    )
    WITH CHECK (
        is_admin()
        OR
        user_id = auth.uid()
    );

-- Create DELETE policy - admins can delete all, users can delete own
CREATE POLICY "Admins can delete all profiles"
    ON public.profiles 
    FOR DELETE
    USING (
        is_admin()
        OR
        user_id = auth.uid()
    );

-- ============================================
-- FIX ANALYSES RLS POLICIES (avoid recursion)
-- ============================================

-- Drop existing admin policies on analyses
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.analyses;
DROP POLICY IF EXISTS "Admins can update all analyses" ON public.analyses;
DROP POLICY IF EXISTS "Admins can delete all analyses" ON public.analyses;

-- Create SELECT policy - admins can see all, users can see own
-- Use is_admin() function instead of checking profiles table directly
CREATE POLICY "Admins can view all analyses"
    ON public.analyses 
    FOR SELECT
    USING (
        is_admin()
        OR
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM trainees t
            WHERE t.id = analyses.trainee_id
            AND t.coach_id = auth.uid()
        )
    );

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all analyses"
    ON public.analyses 
    FOR UPDATE
    USING (
        is_admin()
        OR
        user_id = auth.uid()
    )
    WITH CHECK (
        is_admin()
        OR
        user_id = auth.uid()
    );

-- Create DELETE policy - admins can delete all, users can delete own
CREATE POLICY "Admins can delete all analyses"
    ON public.analyses 
    FOR DELETE
    USING (
        is_admin()
        OR
        user_id = auth.uid()
    );

-- ============================================
-- VERIFY
-- ============================================

-- Show all policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'analyses')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;
