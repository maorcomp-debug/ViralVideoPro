-- ============================================
-- ADMIN SYSTEM - COMPLETE REFACTORED VERSION
-- ============================================
-- מטרה: ליצור מערכת אדמין שלמה וזהירה בלי circular dependencies
-- 
-- סדר הפעולות:
-- 1. יצירת פונקציית is_admin() שעוקפת RLS
-- 2. יצירת RLS policies שמשתמשות ב-is_admin()
-- 3. יצירת פונקציות עזר לאדמין (admin_get_all_users)
-- 
-- הפתרון ל-Circular Dependency:
-- is_admin() מוגדרת עם SECURITY DEFINER + SET search_path
-- כך היא עוקפת את RLS ולא נוצרת לולאה אינסופית

-- ============================================
-- 1. DROP OLD POLICIES FIRST (they depend on is_admin)
-- ============================================

-- מחק את כל ה-policies הקיימות שתלויות ב-is_admin()
-- כדי למנוע שגיאות dependency

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Subscriptions (כל הגרסאות האפשריות)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.subscriptions;

-- Videos (כל הגרסאות האפשריות)
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view videos" ON public.videos;

-- Analyses (כל הגרסאות האפשריות)
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.analyses;
DROP POLICY IF EXISTS "Admins can view analyses" ON public.analyses;

-- Trainees (כל הגרסאות האפשריות)
DROP POLICY IF EXISTS "Admins can view all trainees" ON public.trainees;
DROP POLICY IF EXISTS "Admins can view trainees" ON public.trainees;

-- Usage (כל הגרסאות האפשריות)
DROP POLICY IF EXISTS "Admins can view all usage" ON public.usage;
DROP POLICY IF EXISTS "Admins can view usage" ON public.usage;

-- Announcements
DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;

-- Contact Messages
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;

-- Coupon Redemptions
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.coupon_redemptions;

-- Coupons
DROP POLICY IF EXISTS "Admins can create coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;

-- Takbull Orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.takbull_orders;

-- User Trials
DROP POLICY IF EXISTS "Admins can delete trials" ON public.user_trials;
DROP POLICY IF EXISTS "Admins can update trials" ON public.user_trials;
DROP POLICY IF EXISTS "Admins can view all trials" ON public.user_trials;

-- ============================================
-- 2. DROP OLD FUNCTIONS
-- ============================================

-- עכשיו אפשר למחוק את הפונקציות הישנות
DROP FUNCTION IF EXISTS public.admin_get_all_users();
DROP FUNCTION IF EXISTS public.is_admin();

-- ============================================
-- 3. CREATE NEW is_admin() FUNCTION
-- ============================================

-- צור פונקציה חדשה נקייה
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- עוקף RLS - חשוב למניעת circular dependency!
STABLE            -- מחזיר אותו ערך לאותו input בטרנזקציה
SET search_path = public  -- מגדיר search_path מפורש לבטיחות
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- קבל את ה-user_id הנוכחי
  current_user_id := auth.uid();
  
  -- אם אין משתמש מחובר, החזר false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Fast path: בדיקה ישירה של האימייל מ-auth.users
  -- זה מהיר מאוד ולא תלוי ב-RLS בכלל
  BEGIN
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- אם זה viralypro@gmail.com, זה אדמין מוכח
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
      -- אם יש בעיה כלשהי, נחזיר false
      RETURN FALSE;
  END;
END;
$$;

-- הרשאות: כל משתמש מחובר יכול לקרוא לפונקציה
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS 
'Checks if current user is an admin. Uses SECURITY DEFINER to bypass RLS and prevent circular dependencies.';

-- ============================================
-- 4. CREATE NEW RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles  
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- Admins can delete profiles (optional - use with caution)
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert subscriptions for any user
CREATE POLICY "Admins can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update any subscription
CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- VIDEOS TABLE
-- ============================================

-- Admins can view all videos
CREATE POLICY "Admins can view all videos"
  ON public.videos
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ANALYSES TABLE
-- ============================================

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
  ON public.analyses
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- TRAINEES TABLE
-- ============================================

-- Admins can view all trainees
CREATE POLICY "Admins can view all trainees"
  ON public.trainees
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- USAGE TABLE
-- ============================================

-- Admins can view all usage records
CREATE POLICY "Admins can view all usage"
  ON public.usage
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================

-- Admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements"
  ON public.announcements
  FOR SELECT
  USING (public.is_admin());

-- Admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  USING (public.is_admin());

-- Admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  USING (public.is_admin());

-- ============================================
-- CONTACT_MESSAGES TABLE
-- ============================================

-- Admins can view contact messages
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (public.is_admin());

-- Admins can update contact messages
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- COUPONS TABLE
-- ============================================

-- Admins can view all coupons
CREATE POLICY "Admins can view all coupons"
  ON public.coupons
  FOR SELECT
  USING (public.is_admin());

-- Admins can create coupons
CREATE POLICY "Admins can create coupons"
  ON public.coupons
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update coupons
CREATE POLICY "Admins can update coupons"
  ON public.coupons
  FOR UPDATE
  USING (public.is_admin());

-- Admins can delete coupons
CREATE POLICY "Admins can delete coupons"
  ON public.coupons
  FOR DELETE
  USING (public.is_admin());

-- ============================================
-- COUPON_REDEMPTIONS TABLE
-- ============================================

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.coupon_redemptions
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- TAKBULL_ORDERS TABLE
-- ============================================

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.takbull_orders
  FOR SELECT
  USING (public.is_admin());

-- ============================================
-- USER_TRIALS TABLE
-- ============================================

-- Admins can view all trials
CREATE POLICY "Admins can view all trials"
  ON public.user_trials
  FOR SELECT
  USING (public.is_admin());

-- Admins can update trials
CREATE POLICY "Admins can update trials"
  ON public.user_trials
  FOR UPDATE
  USING (public.is_admin());

-- Admins can delete trials
CREATE POLICY "Admins can delete trials"
  ON public.user_trials
  FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 5. ADMIN HELPER FUNCTIONS
-- ============================================

-- פונקציה שמחזירה את כל המשתמשים (לפאנל ניהול)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER  -- עוקף RLS כדי לגשת לכל הפרופילים
STABLE
SET search_path = public
AS $$
BEGIN
  -- וידוא שהמשתמש הנוכחי הוא אדמין
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin_get_all_users requires admin privileges';
  END IF;

  -- החזר את כל הפרופילים, ממוינים לפי תאריך יצירה
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- הרשאות
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;

COMMENT ON FUNCTION public.admin_get_all_users() IS 
'Returns all user profiles. Only accessible by admins. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- וודא שהכל עובד
DO $$
DECLARE
  admin_email TEXT := 'viralypro@gmail.com';
  admin_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- בדוק אם viralypro@gmail.com קיים
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- וודא שיש לו role='admin' בפרופיל
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = admin_user_id;
    
    RAISE NOTICE 'Admin system verified: % set as admin', admin_email;
  ELSE
    RAISE NOTICE 'Admin user % not found in auth.users yet', admin_email;
  END IF;
END;
$$;
