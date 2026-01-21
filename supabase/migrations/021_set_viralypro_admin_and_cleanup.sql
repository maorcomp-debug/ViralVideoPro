-- ============================================
-- SET VIRALYPRO AS ADMIN AND CLEANUP
-- ============================================
-- This migration ensures viralypro@gmail.com is set as admin
-- and cleans up any old admin configurations

-- Set viralypro@gmail.com as admin
UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'viralypro@gmail.com'
);

-- Verify the update
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email = 'viralypro@gmail.com' AND p.role = 'admin';
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Failed to set viralypro@gmail.com as admin';
  END IF;
END $$;

-- Note: is_admin() function is now defined in migration 022_admin_system_refactored.sql
-- This migration only ensures the admin user is set correctly
