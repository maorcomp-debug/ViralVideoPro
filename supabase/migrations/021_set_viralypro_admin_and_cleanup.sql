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

-- Ensure is_admin() function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission on is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
