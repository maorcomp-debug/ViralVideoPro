-- ============================================
-- FIX ADMIN_GET_ALL_USERS PERFORMANCE
-- ============================================
-- הבעיה: הפונקציה admin_get_all_users נתקעת בגלל is_admin() איטי
-- הפתרון: נשפר את הפונקציה כך שתעבוד מהר יותר

-- קודם כל, נוודא ש-is_admin() קיימת ומהירה
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
  -- Fast path: בדיקה ישירה של האימייל
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

-- עכשיו נשפר את admin_get_all_users כך שתעבוד מהר יותר
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

-- וודא שההרשאות נכונות
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
