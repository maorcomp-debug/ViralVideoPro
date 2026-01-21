-- ============================================
-- RE-ENABLE RLS WITH FIXED POLICIES
-- ============================================
-- מחזירים את RLS עם policies מתוקנות שלא יוצרות loops

-- הפעל RLS מחדש
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- מחק את כל ה-policies הישנות
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- צור policies חדשות פשוטות
-- משתמשים רגילים - רק הפרופיל שלהם
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- אדמין - גישה לכל דבר (ללא קריאה ל-is_admin שגורמת ל-loop)
-- במקום is_admin(), נבדוק ישירות את האימייל
CREATE POLICY "Admin can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'viralypro@gmail.com'
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'viralypro@gmail.com'
    )
  );

CREATE POLICY "Admin can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'viralypro@gmail.com'
    )
  );

-- הודעה
DO $$
BEGIN
  RAISE NOTICE '✅ RLS re-enabled with fixed policies!';
  RAISE NOTICE '✅ No more circular dependencies!';
END $$;
