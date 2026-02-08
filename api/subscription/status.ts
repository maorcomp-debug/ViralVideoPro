import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, getSupabaseAdmin } from './auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true }).setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS').setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' }).setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'לא מאומת' }).setHeader('Access-Control-Allow-Headers', 'authorization');
    }

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
    }).setHeader('Access-Control-Allow-Headers', 'authorization');
  } catch (e) {
    console.error('Subscription status:', e);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
