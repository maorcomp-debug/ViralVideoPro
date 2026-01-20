-- ============================================
-- FIX IS_ADMIN PERFORMANCE ISSUE
-- ============================================
-- הבעיה: is_admin() עלולה להיתקע בגלל circular dependency עם RLS
-- כאשר RLS policy קורא ל-is_admin(), ו-is_admin() קורא ל-profiles
-- הפתרון: נשתמש ב-SECURITY DEFINER כדי לעקוף RLS ב-is_admin()

-- שפר את is_admin() כך שלא תלויה ב-RLS של profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- קבל את user_id הנוכחי
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Fast path: בדיקה ישירה של האימייל (מהיר מאוד, לא תלוי ב-RLS)
  BEGIN
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_user_id;
    
    IF user_email = 'viralypro@gmail.com' THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- אם יש בעיה עם auth.users, נמשיך לבדיקה הבאה
      NULL;
  END;
  
  -- Fallback: בדיקה לפי role בפרופיל
  -- SECURITY DEFINER עוקף RLS, אז זה לא יגרום ללולאה
  BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE user_id = current_user_id
    LIMIT 1;
    
    RETURN COALESCE(user_role = 'admin', FALSE);
  EXCEPTION
    WHEN OTHERS THEN
      -- אם יש בעיה, נחזיר false
      RETURN FALSE;
  END;
END;
$$;

-- וודא שההרשאות נכונות
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
