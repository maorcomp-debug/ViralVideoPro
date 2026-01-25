-- Migration: Create is_admin() function and fix admin RLS policies
-- Date: 2025-01-25
-- Problem: is_admin() function doesn't exist and admin SELECT/UPDATE policies are missing
-- Solution: Create function and add missing policies

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
-- ADD MISSING ADMIN POLICIES FOR PROFILES
-- ============================================

-- Add SELECT policy for admins (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
        ON public.profiles 
        FOR SELECT
        USING (
            is_admin()
            OR
            user_id = auth.uid()
        );
  END IF;
END $$;

-- Add UPDATE policy for admins (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can update all profiles'
  ) THEN
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
  END IF;
END $$;

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

-- Verify function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';
