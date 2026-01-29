-- Allow discount_type 'extra_track' in coupons table.
-- Run this in Supabase SQL Editor to fix: "violates check constraint coupons_discount_type_check"

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
