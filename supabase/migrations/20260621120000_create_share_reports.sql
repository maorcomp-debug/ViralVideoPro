-- =============================================================================
-- VIRALY — מערכת שיתוף ציבורי (Phase 2)
-- =============================================================================
-- איפה להריץ: Supabase Dashboard → SQL Editor → New query → הדבק והרץ
-- פרויקט: poejxozjnwrsakrhiyny (viraly.co.il)
--
-- בטוח להרצה חד-פעמית. אם הטבלה כבר קיימת — CREATE IF NOT EXISTS לא ישבור.
-- אם policies כבר קיימים — DROP IF EXISTS לפני CREATE.
-- =============================================================================

-- טבלה מבודדת — ללא קישור לטבלת analyses
CREATE TABLE IF NOT EXISTS public.share_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viral_score smallint NOT NULL CHECK (viral_score >= 0 AND viral_score <= 100),
  metrics jsonb NOT NULL,
  ai_insight text NOT NULL,
  creator_name text,
  creator_type text,
  track_id text,
  language text NOT NULL DEFAULT 'he',
  view_count integer NOT NULL DEFAULT 0,
  share_click_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.share_reports IS 'VIRALY public share snapshots — minimal safe data only';
COMMENT ON COLUMN public.share_reports.public_token IS 'Unguessable token for /share/{token} URLs';
COMMENT ON COLUMN public.share_reports.expires_at IS 'NULL = no expiration (default)';
COMMENT ON COLUMN public.share_reports.is_active IS 'false = link deactivated by user';

CREATE INDEX IF NOT EXISTS idx_share_reports_user_created
  ON public.share_reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_reports_public_token
  ON public.share_reports (public_token)
  WHERE is_active = true;

ALTER TABLE public.share_reports ENABLE ROW LEVEL SECURITY;

-- הרשאות בסיס (RLS מגביל authenticated לשורות שלו בלבד)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_reports TO authenticated;
GRANT ALL ON public.share_reports TO service_role;

DROP POLICY IF EXISTS share_reports_insert_own ON public.share_reports;
CREATE POLICY share_reports_insert_own
  ON public.share_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS share_reports_select_own ON public.share_reports;
CREATE POLICY share_reports_select_own
  ON public.share_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS share_reports_update_own ON public.share_reports;
CREATE POLICY share_reports_update_own
  ON public.share_reports FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS share_reports_delete_own ON public.share_reports;
CREATE POLICY share_reports_delete_own
  ON public.share_reports FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- אימות (אופציונלי — אמור להחזיר share_reports אחרי ההרצה)
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'share_reports';
