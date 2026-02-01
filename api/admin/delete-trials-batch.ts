import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

async function getAdminClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase credentials');
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(req: VercelRequest, supabaseAdmin: Awaited<ReturnType<typeof getAdminClient>>) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401 as const, error: 'Unauthorized: Missing or invalid authorization header' };
  }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return { ok: false, status: 401 as const, error: 'Unauthorized: Invalid token' };
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') return { ok: false, status: 403 as const, error: 'Forbidden: Admin access required' };
  return { ok: true as const };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const supabaseAdmin = await getAdminClient();
    const auth = await requireAdmin(req, supabaseAdmin);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

    const { trialIds } = req.body;
    if (!Array.isArray(trialIds) || trialIds.length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing or empty trialIds array' });
    }

    const { error } = await supabaseAdmin.from('user_trials').delete().in('id', trialIds);
    if (error) {
      console.error('Error deleting trials batch:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.status(200).json({ ok: true, message: `Deleted ${trialIds.length} trials` });
  } catch (e: any) {
    console.error('delete-trials-batch error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal server error' });
  }
}
