-- ============================================
-- FIX ADMIN PERMISSIONS AND PERFORMANCE
-- ============================================
-- מטרה: לתקן בעיות הרשאות ולשפר ביצועים של פונקציות אדמין

-- 1. שפר את is_admin() עם fast path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Fast path: בדיקה ישירה של האימייל (מהיר מאוד)
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email = 'viralypro@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: בדיקה לפי role בפרופיל
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$;

-- 2. שפר את admin_get_all_users עם ביצועים טובים יותר
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- בדיקה מהירה של is_admin (עם fast path)
  is_admin_user := public.is_admin();
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'admin_get_all_users: access denied, user is not admin';
  END IF;

  -- החזר את כל הפרופילים (ללא RLS כי SECURITY DEFINER)
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. וודא שההרשאות נכונות (חשוב!)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;

-- 4. וודא שהמדיניות RLS קיימת (אם לא, תוסיף)
DO $$
BEGIN
  -- Profiles: Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles
      FOR SELECT
      USING (public.is_admin());
  END IF;

  -- Profiles: Admins can update all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON public.profiles
      FOR UPDATE
      USING (public.is_admin());
  END IF;

  -- Subscriptions: Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscriptions' 
      AND policyname = 'Admins can view all subscriptions'
  ) THEN
    CREATE POLICY "Admins can view all subscriptions"
      ON public.subscriptions
      FOR SELECT
      USING (public.is_admin());
  END IF;

  -- Videos: Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'videos' 
      AND policyname = 'Admins can view all videos'
  ) THEN
    CREATE POLICY "Admins can view all videos"
      ON public.videos
      FOR SELECT
      USING (public.is_admin());
  END IF;

  -- Analyses: Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'analyses' 
      AND policyname = 'Admins can view all analyses'
  ) THEN
    CREATE POLICY "Admins can view all analyses"
      ON public.analyses
      FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;
