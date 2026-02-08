import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase credentials');
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(req: VercelRequest, supabaseAdmin: ReturnType<typeof getAdminClient>) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401 as const, error: 'Unauthorized: Missing or invalid authorization header' };
  }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return { ok: false as const, status: 401 as const, error: 'Unauthorized: Invalid token' };
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') return { ok: false as const, status: 403 as const, error: 'Forbidden: Admin access required' };
  return { ok: true as const };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const action = typeof req.body?.action === 'string' ? req.body.action : '';

  try {
    const supabaseAdmin = getAdminClient();
    const auth = await requireAdmin(req, supabaseAdmin);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

    if (action === 'delete-user') {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId in request body' });
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return res.status(500).json({ ok: false, error: `Failed to delete user: ${deleteError.message}` });
      }
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
      await supabaseAdmin.from('takbull_orders').delete().eq('user_id', userId);
      await supabaseAdmin.from('analyses').delete().eq('user_id', userId);
      await supabaseAdmin.from('videos').delete().eq('user_id', userId);
      await supabaseAdmin.from('trainees').delete().eq('coach_id', userId);
      await supabaseAdmin.from('coupon_redemptions').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_trials').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_announcements').delete().eq('user_id', userId);
      return res.status(200).json({ ok: true, message: 'User deleted successfully' });
    }

    if (action === 'delete-coupon') {
      const { couponId } = req.body;
      if (!couponId || typeof couponId !== 'string') return res.status(400).json({ ok: false, error: 'Missing couponId' });
      await supabaseAdmin.from('coupon_redemptions').delete().eq('coupon_id', couponId);
      const { error } = await supabaseAdmin.from('coupons').delete().eq('id', couponId);
      if (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true, message: 'Coupon deleted' });
    }

    if (action === 'delete-all-trials') {
      const { error } = await supabaseAdmin.from('user_trials').delete().neq('id', null as any);
      if (error) {
        console.error('Error deleting all trials:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true, message: 'All trials deleted' });
    }

    if (action === 'delete-all-redemptions') {
      const { error } = await supabaseAdmin.from('coupon_redemptions').delete().neq('id', null as any);
      if (error) {
        console.error('Error deleting all redemptions:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true, message: 'All redemptions deleted' });
    }

    if (action === 'delete-trials-batch') {
      const { trialIds } = req.body;
      if (!Array.isArray(trialIds) || trialIds.length === 0) return res.status(400).json({ ok: false, error: 'Missing or empty trialIds array' });
      const { error } = await supabaseAdmin.from('user_trials').delete().in('id', trialIds);
      if (error) {
        console.error('Error deleting trials batch:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true, message: `Deleted ${trialIds.length} trials` });
    }

    if (action === 'delete-coupons-batch') {
      const { couponIds } = req.body;
      if (!Array.isArray(couponIds) || couponIds.length === 0) return res.status(400).json({ ok: false, error: 'Missing or empty couponIds array' });
      await supabaseAdmin.from('coupon_redemptions').delete().in('coupon_id', couponIds);
      const { error } = await supabaseAdmin.from('coupons').delete().in('id', couponIds);
      if (error) {
        console.error('Error deleting coupons batch:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true, message: `Deleted ${couponIds.length} coupons` });
    }

    return res.status(400).json({ ok: false, error: 'Unknown or missing action' });
  } catch (e: any) {
    console.error('admin API error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal server error' });
  }
}
