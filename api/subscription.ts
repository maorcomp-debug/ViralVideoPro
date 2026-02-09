import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

const SUBSCRIPTION_EMAIL_SUBJECTS: Record<string, string> = {
  pause: 'השהיית מנוי | Viraly – Video Director Pro',
  cancel: 'ביטול מנוי | Viraly – Video Director Pro',
  resume: 'חידוש מנוי | Viraly – Video Director Pro',
};

const SUBSCRIPTION_EMAIL_CONFIRM_LINE: Record<string, string> = {
  pause: 'אנו מאשרים כי ביקשת להשהות את המנוי. ההשהייה תיכנס לתוקף בסיום התקופה.',
  cancel: 'אנו מאשרים כי ביקשת לבטל את המנוי. הביטול ייכנס לתוקף בסיום התקופה.',
  resume: 'אנו מאשרים כי ביקשת לחדש את המנוי.',
};

function escapeHtml(s: string): string {
  const m: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (c) => m[c] || c);
}

function buildSubscriptionActionEmailHtml(confirmLine: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">body, .rtl-wrap { direction: rtl; text-align: right; }</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: rtl; text-align: right;">
  <div class="rtl-wrap" style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; direction: rtl; text-align: right;">
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff;">
      ברוך הבא ל־Viraly Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.
    </p>
    <p style="margin: 0 0 32px 0; line-height: 1.6; color: #fff;">
      ${escapeHtml(confirmLine)}
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: right;">
      Viraly – Video Director Pro
    </p>
  </div>
</body>
</html>`;
}

async function getEmailForUser(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data: profile } = await admin.from('profiles').select('email').eq('user_id', userId).maybeSingle();
  const email = (profile as any)?.email;
  if (email && typeof email === 'string') return email;
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if ((authUser?.user as any)?.email) return (authUser!.user as any).email;
  } catch (_) {}
  return null;
}

async function sendSubscriptionActionEmail(toEmail: string, action: 'pause' | 'cancel' | 'resume'): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;
  if (!resendApiKey || !fromEmail) {
    console.warn('RESEND_API_KEY or FROM_EMAIL not set – skipping subscription action email');
    return;
  }
  const subject = SUBSCRIPTION_EMAIL_SUBJECTS[action] || `${action} | Viraly – Video Director Pro`;
  const confirmLine = SUBSCRIPTION_EMAIL_CONFIRM_LINE[action] || 'אנו מאשרים כי ביקשת לבצע שינוי במנוי.';
  const html = buildSubscriptionActionEmailHtml(confirmLine);
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

  if (req.method === 'POST' && ['pause', 'cancel', 'resume'].includes(action)) {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'לא מאומת' });
      const admin = getSupabaseAdmin();

      const { data: sub } = await admin
        .from('subscriptions')
        .select('id, subscription_status, takbul_recurring_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) return res.status(400).json({ error: action === 'resume' ? 'לא נמצא מנוי' : 'לא נמצא מנוי פעיל' });

      const subAny = sub as any;
      const recurringId = subAny.takbul_recurring_id;

      if (action === 'pause') {
        if (subAny.subscription_status === 'paused') return res.status(200).json({ ok: true, message: 'המנוי כבר מושהה' });
        if (recurringId) {
          try {
            const takbulApiKey = process.env.TAKBULL_API_KEY;
            const takbulApiSecret = process.env.TAKBULL_API_SECRET;
            if (takbulApiKey && takbulApiSecret) {
              const resTakbul = await fetch('https://api.takbull.co.il/api/ExtranalAPI/StopRecurringCharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ API_Key: takbulApiKey, API_Secret: takbulApiSecret, RecurringId: recurringId }),
              });
              if (!resTakbul.ok) console.warn('Takbul stopRecurringCharge failed:', await resTakbul.text());
            }
          } catch (e) { console.warn('Takbul pause error:', e); }
        }
        const now = new Date().toISOString();
        await admin.from('subscriptions').update({
          subscription_status: 'paused',
          auto_renew: false,
          paused_at: now,
          updated_at: now,
        } as any).eq('id', sub.id);
        await logEvent(admin, user.id, 'pause', { subscription_id: sub.id });
        const { data: profile } = await admin.from('profiles').select('user_id').eq('user_id', user.id).single();
        // חשוב: בפרופיל נשמור סטטוס "paused" כדי לשקף למנהל שמדובר במנוי מושהה (לא "לא פעיל")
        if (profile) await admin.from('profiles').update({ subscription_status: 'paused', updated_at: now }).eq('user_id', user.id);
        const email = await getEmailForUser(admin, user.id);
        if (email) await sendSubscriptionActionEmail(email, 'pause');
        return res.status(200).json({ ok: true });
      }

      if (action === 'cancel') {
        if (subAny.subscription_status === 'canceled') return res.status(200).json({ ok: true, message: 'המנוי כבר בוטל' });
        
        // Get the original order's uniqId for CancelSubscription API call
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
       

        // Call CancelSubscription with original uniqId from GetRedirectUrl
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
                const errorMsg = cancelData.InternalDescription || 'Unknown error';
                console.warn('Takbull CancelSubscription failed:', {
                  uniqId,
                  InternalCode: cancelData.InternalCode,
                  InternalDescription: errorMsg,
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
        const emailCancel = await getEmailForUser(admin, user.id);
        if (emailCancel) await sendSubscriptionActionEmail(emailCancel, 'cancel');
        return res.status(200).json({ ok: true });
      }

      if (action === 'resume') {
        if (subAny.subscription_status !== 'paused') return res.status(400).json({ error: 'המנוי לא מושהה' });
        if (recurringId) {
          try {
            const takbulApiKey = process.env.TAKBULL_API_KEY;
            const takbulApiSecret = process.env.TAKBULL_API_SECRET;
            if (takbulApiKey && takbulApiSecret) {
              const resTakbul = await fetch('https://api.takbull.co.il/api/ExtranalAPI/ResumeRecurringCharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ API_Key: takbulApiKey, API_Secret: takbulApiSecret, RecurringId: recurringId }),
              });
              if (!resTakbul.ok) console.warn('Takbul resumeRecurringCharge failed:', await resTakbul.text());
            }
          } catch (e) { console.warn('Takbul resume error:', e); }
        }
        const now = new Date().toISOString();
        await admin.from('subscriptions').update({
          subscription_status: 'active',
          status: 'active',
          auto_renew: true,
          paused_at: null,
          updated_at: now,
        } as any).eq('id', sub.id);
        await logEvent(admin, user.id, 'resume', { subscription_id: sub.id });
        await admin.from('profiles').update({ subscription_status: 'active', updated_at: now }).eq('user_id', user.id);
        const emailResume = await getEmailForUser(admin, user.id);
        if (emailResume) await sendSubscriptionActionEmail(emailResume, 'resume');
        return res.status(200).json({ ok: true });
      }
    } catch (e) {
      console.error('Subscription action error:', e);
      return res.status(500).json({ error: 'שגיאת שרת' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
