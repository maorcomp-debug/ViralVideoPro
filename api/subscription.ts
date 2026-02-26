import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EmailLang } from './email-templates';
import {
  getSubscriptionSubject,
  getSubscriptionConfirmLine,
  buildSubscriptionActionEmailHtml,
} from './email-templates';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || process.env.SUBSCRIPTION_CRON_SECRET || '';

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getUserFromRequest(req: VercelRequest): Promise<{ id: string } | null> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id };
}

async function logEvent(admin: SupabaseClient, user_id: string, event_type: string, meta: object): Promise<void> {
  try {
    await admin.from('subscription_events').insert({
      user_id,
      event_type,
      meta,
    } as any);
  } catch (e) {
    console.warn('subscription_events insert:', e);
  }
}

async function getEmailAndLangForUser(admin: SupabaseClient, userId: string): Promise<{ email: string | null; lang: EmailLang }> {
  const { data: profile } = await admin.from('profiles').select('email, preferred_language').eq('user_id', userId).maybeSingle();
  const email = (profile as any)?.email;
  if (email && typeof email === 'string') {
    const lang: EmailLang = (profile as any)?.preferred_language === 'en' ? 'en' : 'he';
    return { email, lang };
  }
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if ((authUser?.user as any)?.email) {
      return { email: (authUser!.user as any).email, lang: 'he' };
    }
  } catch (_) {}
  return { email: null, lang: 'he' };
}

async function sendSubscriptionActionEmail(toEmail: string, action: 'pause' | 'cancel' | 'resume', lang: EmailLang = 'he'): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;
  if (!resendApiKey || !fromEmail) {
    console.warn('RESEND_API_KEY or FROM_EMAIL not set – skipping subscription action email');
    return;
  }
  const subject = getSubscriptionSubject(action, lang);
  const confirmLine = getSubscriptionConfirmLine(action, lang);
  const html = buildSubscriptionActionEmailHtml(confirmLine, lang);
  const fromDisplay = fromEmail.includes('@') ? `Viraly <${fromEmail}>` : fromEmail;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: fromDisplay, to: [toEmail], subject, html }),
    });
    if (!res.ok) console.warn('Resend subscription email failed:', await res.text());
  } catch (e) {
    console.warn('Resend subscription email error:', e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = typeof req.body?.action === 'string' ? req.body.action : null;

  if (req.method === 'GET') {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'לא מאומת' });
      const admin = getSupabaseAdmin();
      const { data: sub, error } = await admin
        .from('subscriptions')
        .select('id, status, subscription_status, auto_renew, current_period_start, current_period_end, plan, start_date, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Subscription status error:', error);
        return res.status(500).json({ error: 'שגיאה בקבלת סטטוס מנוי' });
      }
      const subscription_status = (sub as any)?.subscription_status ?? (sub?.status === 'cancelled' ? 'canceled' : sub?.status === 'active' ? 'active' : 'expired');
      const auto_renew = (sub as any)?.auto_renew ?? (sub?.status === 'active');
      const current_period_end = (sub as any)?.current_period_end ?? sub?.end_date ?? null;
      return res.status(200).json({
        subscription_status,
        auto_renew: !!auto_renew,
        current_period_end: current_period_end || null,
        plan: (sub as any)?.plan ?? null,
      });
    } catch (e) {
      console.error('Subscription status:', e);
      return res.status(500).json({ error: 'שגיאת שרת' });
    }
  }

  if (req.method === 'POST' && action === 'downgrade-expired') {
    const auth = req.headers.authorization;
    const secret = auth?.startsWith('Bearer ') ? auth.slice(7) : (req.body?.secret ?? req.query?.secret);
    if (CRON_SECRET && secret !== CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
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
        await admin.from('subscriptions').update({
          plan: 'free',
          subscription_status: 'expired',
          status: 'expired',
          auto_renew: false,
          expired_at: now,
          updated_at: now,
        } as any).eq('id', id);
        await admin.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          updated_at: now,
        }).eq('user_id', user_id);
        await logEvent(admin, user_id, 'expire', { subscription_id: id });
      }
      return res.status(200).json({ ok: true, downgraded: toExpire.length });
    } catch (e) {
      console.error('downgrade-expired:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST' && action === 'cancel') {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'לא מאומת' });
      const admin = getSupabaseAdmin();

      const { data: sub } = await admin
        .from('subscriptions')
        .select('id, subscription_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) return res.status(400).json({ error: 'לא נמצא מנוי פעיל' });

      const subAny = sub as any;
      if (subAny.subscription_status === 'canceled') return res.status(200).json({ ok: true, message: 'המנוי כבר בוטל' });

      // Get the original order's uniqId for CancelSubscription API call (sync with Takbull immediately)
      let uniqId: string | null = null;
      try {
        const { data: order } = await admin
          .from('takbull_orders')
          .select('uniq_id')
          .eq('subscription_id', sub.id)
          .not('uniq_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        uniqId = (order as any)?.uniq_id || null;
      } catch (e) {
        console.warn('Error fetching order uniqId:', e);
      }

      if (uniqId) {
        try {
          const cancelUrl = `https://api.takbull.co.il/api/ExtranalAPI/CancelSubscription?uniqId=${encodeURIComponent(uniqId)}`;
          const resCancel = await fetch(cancelUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          if (!resCancel.ok) {
            const errorText = await resCancel.text();
            console.warn('Takbull CancelSubscription HTTP error:', resCancel.status, errorText);
          } else {
            const cancelData = await resCancel.json();
            if (cancelData.InternalCode === 0) {
              console.log('Takbull CancelSubscription succeeded for uniqId:', uniqId);
            } else {
              console.warn('Takbull CancelSubscription failed:', {
                uniqId,
                InternalCode: cancelData.InternalCode,
                InternalDescription: cancelData.InternalDescription || 'Unknown error',
              });
            }
          }
        } catch (e) {
          console.warn('Takbull CancelSubscription error:', e);
        }
      } else {
        console.warn('No uniqId found for subscription cancellation');
      }

      const now = new Date().toISOString();
      await admin.from('subscriptions').update({
        subscription_status: 'canceled',
        status: 'cancelled',
        auto_renew: false,
        canceled_at: now,
        updated_at: now,
      } as any).eq('id', sub.id);
      await logEvent(admin, user.id, 'cancel', { subscription_id: sub.id, uniqId });
      await admin.from('profiles').update({ subscription_status: 'cancelled', updated_at: now }).eq('user_id', user.id);
      const { email: emailCancel, lang: langCancel } = await getEmailAndLangForUser(admin, user.id);
      if (emailCancel) await sendSubscriptionActionEmail(emailCancel, 'cancel', langCancel);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Subscription action error:', e);
      return res.status(500).json({ error: 'שגיאת שרת' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
