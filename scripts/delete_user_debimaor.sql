-- הרץ ב-Supabase Dashboard → SQL Editor (מחיקת כל הרשומות שמפנות למשתמש debimaor@gmail.com)
-- אחרי ההרצה: Authentication → Users → מחק את debimaor@gmail.com

DO $$
DECLARE
  uid uuid := '17bc0538-d986-466f-b3a3-bdafe4843334';
BEGIN
  DELETE FROM public.takbull_orders WHERE user_id = uid;
  DELETE FROM public.subscriptions WHERE user_id = uid;
  DELETE FROM public.subscription_events WHERE user_id = uid;
  DELETE FROM public.usage WHERE user_id = uid;
  DELETE FROM public.analyses WHERE user_id = uid;
  DELETE FROM public.videos WHERE user_id = uid;
  DELETE FROM public.trainees WHERE coach_id = uid;
  DELETE FROM public.coupon_redemptions WHERE user_id = uid;
  DELETE FROM public.user_trials WHERE user_id = uid;
  DELETE FROM public.user_announcements WHERE user_id = uid;
  DELETE FROM public.user_announcements WHERE announcement_id IN (SELECT id FROM public.announcements WHERE created_by = uid);
  DELETE FROM public.announcements WHERE created_by = uid;
  DELETE FROM public.coupon_redemptions WHERE coupon_id IN (SELECT id FROM public.coupons WHERE created_by = uid);
  DELETE FROM public.coupons WHERE created_by = uid;
  DELETE FROM public.profiles WHERE user_id = uid;
  RAISE NOTICE 'נוקה. עכשיו מחק את המשתמש ב-Authentication → Users';
END $$;
