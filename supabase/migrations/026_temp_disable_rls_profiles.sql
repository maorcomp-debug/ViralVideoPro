-- ============================================
-- TEMPORARY DISABLE RLS ON PROFILES FOR DEBUGGING
-- ============================================
-- נכבה RLS זמנית כדי לבדוק אם זו הבעיה

-- כבה RLS על profiles (זמני!)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- הודעה
DO $$
BEGIN
  RAISE NOTICE '⚠️ RLS DISABLED on profiles table for debugging!';
  RAISE NOTICE '⚠️ This is TEMPORARY - re-enable RLS after testing!';
END $$;
