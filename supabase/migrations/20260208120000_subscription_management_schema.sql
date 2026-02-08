-- subscription_events for logging
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  event_type text NOT NULL CHECK (event_type IN ('pause', 'cancel', 'resume', 'expire', 'renew', 'payment_failed')),
  meta jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription_events" ON public.subscription_events;
CREATE POLICY "Users can read own subscription_events"
  ON public.subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Add new columns to subscriptions (keep existing for backward compatibility)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS usage_quota_total int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_quota_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS takbul_customer_id text,
  ADD COLUMN IF NOT EXISTS takbul_recurring_id text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz;

-- Backfill from existing data
UPDATE public.subscriptions s
SET
  plan = COALESCE(p.tier, 'free'),
  subscription_status = CASE
    WHEN s.status = 'cancelled' THEN 'canceled'
    ELSE s.status
  END,
  auto_renew = (s.status = 'active'),
  current_period_start = COALESCE(s.current_period_start, s.start_date),
  current_period_end = COALESCE(s.current_period_end, s.end_date)
FROM public.plans p
WHERE p.id = s.plan_id AND (s.plan IS NULL OR s.subscription_status IS NULL);

UPDATE public.subscriptions SET plan = 'free' WHERE plan IS NULL;
UPDATE public.subscriptions SET subscription_status = status WHERE subscription_status IS NULL;
UPDATE public.subscriptions SET subscription_status = 'canceled' WHERE status = 'cancelled' AND (subscription_status IS NULL OR subscription_status = 'cancelled');

-- Constraint for subscription_status
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_subscription_status_check
  CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'paused', 'canceled', 'expired'));

-- RLS: user can only read own subscription row(s). Updates only via service role.
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
