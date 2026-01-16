-- ============================================
-- FIX RLS INFINITE RECURSION FOR ADMIN POLICIES
-- ============================================
-- This migration fixes the infinite recursion issue in RLS policies
-- by using a security definer function instead of direct subqueries

-- Create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Drop existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.analyses;
DROP POLICY IF EXISTS "Admins can view all trainees" ON public.trainees;
DROP POLICY IF EXISTS "Admins can view all usage" ON public.usage;

-- Recreate admin policies using the helper function (no recursion)
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete all profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can view all videos"
    ON public.videos FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can view all analyses"
    ON public.analyses FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can view all trainees"
    ON public.trainees FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can view all usage"
    ON public.usage FOR SELECT
    USING (public.is_admin());

