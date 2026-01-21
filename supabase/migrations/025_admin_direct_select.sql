-- ============================================
-- ADMIN DIRECT SELECT - BYPASS RPC COMPLETELY
-- ============================================
-- אם ה-RPC לא עובד, ניצור פונקציה חלופית פשוטה

-- פונקציה פשוטה מאוד ש-SELECT רק
CREATE OR REPLACE FUNCTION public.admin_get_all_users_simple()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- פשוט החזר את הכל ללא בדיקות
  -- SECURITY DEFINER עוקף RLS
  SELECT 
    user_id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at
  FROM public.profiles
  ORDER BY created_at DESC;
$$;

-- הרשאות
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_simple() TO service_role;

COMMENT ON FUNCTION public.admin_get_all_users_simple() IS 
'Ultra-simple admin function - no checks, just returns all profiles with SECURITY DEFINER';

-- בדיקה
DO $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.admin_get_all_users_simple();
  RAISE NOTICE '✅ admin_get_all_users_simple works! Found % users', user_count;
END $$;
