-- ============================================
-- ADMIN RLS POLICIES FOR CORE TABLES
-- ============================================
-- מטרה: לאפשר למשתמשי admin (role='admin' בטבלת profiles
-- או דרך הפונקציה public.is_admin()) גישה מלאה לנתונים
-- שהפאנל ניהול צריך: profiles, subscriptions, videos,
-- analyses, trainees, usage.
--
-- חשוב: לא משנים את מדיניות ה‑RLS הקיימת למשתמשים רגילים,
-- רק מוסיפים מדיניות נוספת שתקפה כאשר is_admin() = true.

-- בטחון: נוודא שהפונקציה is_admin קיימת
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'is_admin'
      AND pg_catalog.pg_function_is_visible(oid)
  ) THEN
    RAISE EXCEPTION 'Function public.is_admin() must exist before applying 022_admin_policies_for_core_tables.sql';
  END IF;
END $$;

-- ============================================
-- PROFILES
-- ============================================

-- Admins can view all profiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Admins can update any profile
CREATE POLICY IF NOT EXISTS "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

-- Admins can view all subscriptions
CREATE POLICY IF NOT EXISTS "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert subscriptions for any user
CREATE POLICY IF NOT EXISTS "Admins can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update any subscription
CREATE POLICY IF NOT EXISTS "Admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- VIDEOS
-- ============================================

-- Admins can view all videos
CREATE POLICY IF NOT EXISTS "Admins can view all videos"
  ON public.videos
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ANALYSES
-- ============================================

-- Admins can view all analyses
CREATE POLICY IF NOT EXISTS "Admins can view all analyses"
  ON public.analyses
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- TRAINEES
-- ============================================

-- Admins can view all trainees
CREATE POLICY IF NOT EXISTS "Admins can view all trainees"
  ON public.trainees
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- USAGE
-- ============================================

-- Admins can view all usage rows
CREATE POLICY IF NOT EXISTS "Admins can view all usage"
  ON public.usage
  FOR SELECT
  USING (public.is_admin());

