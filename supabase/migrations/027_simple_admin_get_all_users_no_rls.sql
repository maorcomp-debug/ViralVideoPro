-- ============================================
-- SIMPLE ADMIN GET ALL USERS (NO RLS DEPENDENCY)
-- ============================================
-- מטרה: ליצור פונקציה פשוטה שמחזירה את כל המשתמשים
-- בלי תלות ב-RLS או ב-is_admin() כדי למנוע תקיעות

-- מחק את הפונקציה הישנה אם קיימת
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- צור פונקציה חדשה פשוטה יותר
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- בדוק אימייל ישירות (לא דרך is_admin() כדי למנוע circular dependency)
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- רק viralypro@gmail.com יכול להשתמש בפונקציה הזו
  IF current_user_email != 'viralypro@gmail.com' THEN
    -- נבדוק גם role בפרופיל (עוקף RLS כי SECURITY DEFINER)
    DECLARE
      user_role TEXT;
    BEGIN
      SELECT role INTO user_role
      FROM public.profiles
      WHERE user_id = auth.uid()
      LIMIT 1;
      
      IF user_role != 'admin' THEN
        RAISE EXCEPTION 'admin_get_all_users: access denied, user is not admin';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'admin_get_all_users: access denied, user is not admin';
    END;
  END IF;

  -- החזר את כל הפרופילים (עוקף RLS כי SECURITY DEFINER)
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- וודא שההרשאות נכונות
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
