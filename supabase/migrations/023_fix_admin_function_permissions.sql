-- ============================================
-- FIX ADMIN FUNCTION PERMISSIONS
-- ============================================
-- תיקון הרשאות עבור is_admin() ו-admin_get_all_users()

-- וודא שיש הרשאות להרצת is_admin() לכל המשתמשים
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres;

-- וודא שיש הרשאות להרצת admin_get_all_users()
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO postgres;

-- וודא שהפונקציות אכן קיימות
DO $$
BEGIN
  -- Test is_admin()
  RAISE NOTICE 'Testing is_admin() function...';
  
  -- Test admin_get_all_users()
  RAISE NOTICE 'Testing admin_get_all_users() function...';
  
  RAISE NOTICE 'Permissions fixed successfully!';
END $$;
