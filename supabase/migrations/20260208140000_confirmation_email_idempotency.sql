-- Idempotency for signup confirmation email: only one email per address per time window.
-- Used by api/send-confirmation-email so that across all serverless instances only one email is sent.
CREATE TABLE IF NOT EXISTS public.confirmation_email_sent (
  email text PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.confirmation_email_sent IS 'One row per email; api/send-confirmation-email uses this to send at most one confirmation email per email per 2 minutes (single source: app only).';

ALTER TABLE public.confirmation_email_sent ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (API) can read/write. Authenticated users cannot access.

-- Atomic claim: returns true only if this invocation may send (first send or last send > 2 min ago).
CREATE OR REPLACE FUNCTION public.claim_confirmation_email_send(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed boolean;
BEGIN
  INSERT INTO confirmation_email_sent (email, sent_at) VALUES (lower(trim(p_email)), now())
  ON CONFLICT (email) DO UPDATE SET sent_at = now()
  WHERE confirmation_email_sent.sent_at < now() - interval '2 minutes'
  RETURNING true INTO v_claimed;
  RETURN COALESCE(v_claimed, false);
END;
$$;
