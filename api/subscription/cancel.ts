import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, getSupabaseAdmin } from './auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'לא מאומת' });

    const admin = getSupabaseAdmin();

    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, subscription_status, takbul_recurring_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'inactive'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return res.status(400).json({ error: 'לא נמצא מנוי פעיל' });
    if ((sub as any).subscription_status === 'canceled') return res.status(200).json({ ok: true, message: 'המנוי כבר בוטל' });

    const recurringId = (sub as any).takbul_recurring_id;
    if (recurringId) {
      try {
        const takbulApiKey = process.env.TAKBULL_API_KEY;
        const takbulApiSecret = process.env.TAKBULL_API_SECRET;
        if (takbulApiKey && takbulApiSecret) {
          const stopUrl = 'https://api.takbull.co.il/api/ExtranalAPI/StopRecurringCharge';
          const resTakbul = await fetch(stopUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              API_Key: takbulApiKey,
              API_Secret: takbulApiSecret,
              RecurringId: recurringId,
            }),
          });
          if (!resTakbul.ok) console.warn('Takbul stopRecurringCharge failed:', await resTakbul.text());
        }
      } catch (e) {
        console.warn('Takbul stop recurring (cancel) error:', e);
      }
    } else {
      console.warn('No takbul_recurring_id for user – updating DB only (cancel)');
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await admin
      .from('subscriptions')
      .update({
        subscription_status: 'canceled',
        status: 'cancelled',
        auto_renew: false,
        canceled_at: now,
        updated_at: now,
      } as any)
      .eq('id', sub.id);

    if (updateErr) {
      const fallback = await admin.from('subscriptions').update({ status: 'cancelled', updated_at: now }).eq('id', sub.id);
      if (fallback.error) {
        console.error('Subscription cancel update error:', updateErr);
        return res.status(500).json({ error: 'שגיאה בעדכון מנוי' });
      }
    }

    await admin.from('subscription_events').insert({
      user_id: user.id,
      event_type: 'cancel',
      meta: { subscription_id: sub.id },
    } as any).then(() => {}).catch((e) => console.warn('subscription_events insert:', e));

    await admin.from('profiles').update({ subscription_status: 'cancelled', updated_at: now }).eq('user_id', user.id);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Cancel error:', e);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
