-- ============================================
-- ADMIN RPC: admin_get_all_users
-- ============================================
-- פונקציה אדמינית שמחזירה את כל המשתמשים (profiles)
-- רצה כ-security definer כדי לעקוף RLS, אבל נבדקת is_admin()

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- הרץ רק אם המשתמש הנוכחי הוא אדמין
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_get_all_users: access denied, user is not admin';
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- הרצת הפונקציה מותרת רק ל-authenticated (ושם בתוך is_admin בודק תפקיד)
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;

