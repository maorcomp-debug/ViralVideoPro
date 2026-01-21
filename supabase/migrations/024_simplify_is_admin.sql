-- ============================================
-- SIMPLIFY IS_ADMIN - REMOVE CIRCULAR DEPENDENCY
-- ============================================
-- הבעיה: is_admin() קוראת ל-profiles שיוצרת deadlock
-- הפתרון: נסתמך רק על auth.users ולא על profiles בכלל

-- החלף את is_admin() בגרסה פשוטה יותר
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  current_user_id UUID;
BEGIN
  -- קבל את ה-user_id הנוכחי
  current_user_id := auth.uid();
  
  -- אם אין משתמש מחובר, החזר false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- בדיקה ישירה של האימייל מ-auth.users בלבד
  -- לא ניגש ל-profiles בכלל כדי למנוע circular dependency
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- רק viralypro@gmail.com הוא אדמין
  RETURN (user_email = 'viralypro@gmail.com');
EXCEPTION
  WHEN OTHERS THEN
    -- אם יש בעיה כלשהי, נחזיר false
    RETURN FALSE;
END;
$$;

-- וודא הרשאות
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

COMMENT ON FUNCTION public.is_admin() IS 
'Simplified is_admin - checks only auth.users email, not profiles table. Prevents circular dependency.';

-- בדיקה
DO $$
BEGIN
  RAISE NOTICE '✅ is_admin() simplified successfully!';
END $$;
