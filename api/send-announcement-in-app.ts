import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface SendAnnouncementInAppRequest {
  title: string;
  message: string;
  target_all?: boolean;
  target_tier?: string[] | null;
  /** When true, all targeted users see the announcement (not only receive_updates). Use for benefits. */
  includeAllTargetUsers?: boolean;
}

async function getAdminClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase credentials');
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(req: VercelRequest, supabaseAdmin: Awaited<ReturnType<typeof getAdminClient>>) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401 as const, error: 'Unauthorized: Missing or invalid authorization header', userId: null as string | null };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { ok: false as const, status: 401 as const, error: 'Unauthorized: Invalid token', userId: null as string | null };
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') return { ok: false as const, status: 403 as const, error: 'Forbidden: Admin access required', userId: null as string | null };
  return { ok: true as const, status: 200 as const, error: null, userId: user.id };
}

/**
 * Creates an announcement and delivers it in-app (user_announcements) to the correct target users
 * using service role so targeting by subscription_tier works (RLS would otherwise limit to current user only).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = await getAdminClient();
    const auth = await requireAdmin(req, supabaseAdmin);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
    if (!auth.userId) return res.status(401).json({ ok: false, error: 'User not found' });

    const body = req.body as SendAnnouncementInAppRequest;
    if (!body.title || typeof body.title !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing or invalid title' });
    }

    const target_all = body.target_all ?? true;
    const target_tier = Array.isArray(body.target_tier) && body.target_tier.length > 0 ? body.target_tier : null;
    const includeAllTargetUsers = body.includeAllTargetUsers === true;

    const { data: announcement, error: insertAnnError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: body.title.trim(),
        message: (body.message && typeof body.message === 'string') ? body.message.trim() : '',
        created_by: auth.userId,
        target_all,
        target_tier,
      })
      .select('id')
      .single();

    if (insertAnnError || !announcement) {
      console.error('Error creating announcement:', insertAnnError);
      return res.status(500).json({ ok: false, error: insertAnnError?.message || 'Failed to create announcement' });
    }

    const announcementId = announcement.id;

    let usersQuery = supabaseAdmin
      .from('profiles')
      .select('user_id');

    if (!includeAllTargetUsers) {
      usersQuery = usersQuery.eq('receive_updates', true);
    }

    if (!target_all && target_tier && target_tier.length > 0) {
      usersQuery = usersQuery.in('subscription_tier', target_tier);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching target users:', usersError);
      return res.status(500).json({ ok: false, error: usersError.message });
    }

    if (!users || users.length === 0) {
      await supabaseAdmin
        .from('announcements')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', announcementId);
      return res.status(200).json({ ok: true, sent: 0 });
    }

    const userAnnouncements = users.map((u: { user_id: string }) => ({
      user_id: u.user_id,
      announcement_id: announcementId,
    }));

    const { error: insertUAError } = await supabaseAdmin
      .from('user_announcements')
      .insert(userAnnouncements);

    if (insertUAError) {
      console.error('Error creating user_announcements:', insertUAError);
      return res.status(500).json({ ok: false, error: insertUAError.message });
    }

    await supabaseAdmin
      .from('announcements')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', announcementId);

    return res.status(200).json({ ok: true, sent: users.length });
  } catch (e: any) {
    console.error('send-announcement-in-app error:', e);
    return res.status(500).json({ ok: false, error: e?.message || 'Internal server error' });
  }
}
