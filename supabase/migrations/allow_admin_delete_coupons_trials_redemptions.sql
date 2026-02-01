-- =============================================================================
-- מאפשר למשתמש admin (profiles.role = 'admin') למחוק מטבלאות הטבות/התנסויות/מימושים
-- הרץ ב-Supabase → SQL Editor
-- אחרי הרצה: מחיקה מהפאנל תעבוד גם דרך ה-API (service role) וגם ישירות מהדפדפן (session של admin)
-- =============================================================================

-- Helper: בודק אם המשתמש הנוכחי הוא admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- coupons: RLS + admin יכול למחוק, authenticated יכול לקרוא
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_can_delete_coupons" ON public.coupons;
CREATE POLICY "admin_can_delete_coupons"
  ON public.coupons FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "authenticated_read_coupons" ON public.coupons;
CREATE POLICY "authenticated_read_coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (true);

-- coupon_redemptions: RLS + admin יכול למחוק, authenticated יכול לקרוא
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_can_delete_coupon_redemptions" ON public.coupon_redemptions;
CREATE POLICY "admin_can_delete_coupon_redemptions"
  ON public.coupon_redemptions FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "authenticated_read_redemptions" ON public.coupon_redemptions;
CREATE POLICY "authenticated_read_redemptions"
  ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (true);

-- user_trials: RLS + admin יכול למחוק, authenticated יכול לקרוא
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_can_delete_user_trials" ON public.user_trials;
CREATE POLICY "admin_can_delete_user_trials"
  ON public.user_trials FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "authenticated_read_trials" ON public.user_trials;
CREATE POLICY "authenticated_read_trials"
  ON public.user_trials FOR SELECT TO authenticated
  USING (true);
