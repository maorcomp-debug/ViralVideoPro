-- =============================================================================
-- מיגרציה מלאה: כל סוגי ההטבות + מימוש קופון בהרשמה + השפעה על מחיר (Takbull)
-- הרץ ב-Supabase → SQL Editor
-- =============================================================================

-- 1) coupons: כל סוגי discount_type (כולל extra_track)
ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS coupons_discount_type_check;

ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_discount_type_check
  CHECK (discount_type IN (
    'percentage',
    'fixed_amount',
    'free_analyses',
    'trial_subscription',
    'extra_track'
  ));

-- 2) profiles: עמודות בונוס (מסלול נוסף, ניתוחים במתנה)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_tracks integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_analyses_remaining integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.bonus_tracks IS 'Extra analysis tracks from extra_track coupons';
COMMENT ON COLUMN public.profiles.bonus_analyses_remaining IS 'Free video analyses from free_analyses coupons';

-- 3) profiles: הנחה ממתינה לתשלום ראשון (קופון בהרשמה – % או סכום)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_payment_discount_type text,
  ADD COLUMN IF NOT EXISTS pending_payment_discount_value numeric;

COMMENT ON COLUMN public.profiles.pending_payment_discount_type IS 'percentage | fixed_amount – applied at first Takbull payment';
COMMENT ON COLUMN public.profiles.pending_payment_discount_value IS 'Value: % or ILS amount';
