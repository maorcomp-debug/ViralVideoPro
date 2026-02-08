/**
 * Cron: הורדה אוטומטית ל-Free כשהתקופה או המכסה נגמרו.
 * להפעיל פעם ביום (או פעם בשעה) דרך Vercel Cron או שירות חיצוני.
 * חובה: לשלוח CRON_SECRET או Authorization: Bearer <CRON_SECRET> כדי לאבטח.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './auth';

const CRON_SECRET = process.env.CRON_SECRET || process.env.SUBSCRIPTION_CRON_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  const secret = auth?.startsWith('Bearer ') ? auth.slice(7) : (req.body?.secret ?? req.query?.secret);
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: subs, error: fetchErr } = await admin
      .from('subscriptions')
      .select('id, user_id, plan, subscription_status, current_period_end, end_date, usage_quota_used, usage_quota_total')
      .neq('plan', 'free')
      .in('subscription_status', ['active', 'paused']);

    if (fetchErr) {
      console.error('downgrade-expired fetch error:', fetchErr);
      return res.status(500).json({ error: 'Database error' });
    }

    const toExpire: { id: string; user_id: string }[] = [];
    for (const s of subs || []) {
      const row = s as any;
      const periodEnd = row.current_period_end || row.end_date;
      const quotaOk = row.usage_quota_total == null || row.usage_quota_total <= 0 || (row.usage_quota_used || 0) < row.usage_quota_total;
      const periodOk = !periodEnd || new Date(periodEnd) > new Date();
      if (!quotaOk || !periodOk) toExpire.push({ id: row.id, user_id: row.user_id });
    }

    for (const { id, user_id } of toExpire) {
      await admin
        .from('subscriptions')
        .update({
          plan: 'free',
          subscription_status: 'expired',
          status: 'expired',
          auto_renew: false,
          expired_at: now,
          updated_at: now,
        } as any)
        .eq('id', id);

      await admin.from('profiles').update({
        subscription_tier: 'free',
        subscription_status: 'inactive',
        updated_at: now,
      }).eq('user_id', user_id);

      await admin.from('subscription_events').insert({
        user_id,
        event_type: 'expire',
        meta: { subscription_id: id },
      } as any).then(() => {}).catch((e) => console.warn('subscription_events insert:', e));

      // TODO: שליחת מייל "המנוי הסתיים והועברת לחבילה החינמית" – קרא ל-Resend כאן
    }

    return res.status(200).json({ ok: true, downgraded: toExpire.length });
  } catch (e) {
    console.error('downgrade-expired:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
