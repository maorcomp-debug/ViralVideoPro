import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  fetchShareByToken,
  generatePublicToken,
  getSupabaseAdmin,
  getUserFromRequest,
  isShareAvailable,
  renderShareHtmlPage,
  resolveSharePublicUrl,
  sanitizeCreateBody,
  toPublicPayload,
} from './share-lib';

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'נדרשת התחברות' });
  }

  const body = sanitizeCreateBody(req.body);
  if (!body) {
    return res.status(400).json({ error: 'נתוני שיתוף לא תקינים' });
  }

  const admin = getSupabaseAdmin();
  const publicToken = generatePublicToken();

  const { data, error } = await admin
    .from('share_reports')
    .insert({
      public_token: publicToken,
      user_id: user.id,
      viral_score: body.viralScore,
      metrics: body.metrics,
      ai_insight: body.aiInsight,
      creator_name: body.includeCreatorName ? body.creatorName || null : null,
      creator_type: body.includeCreatorName ? body.creatorType || null : null,
      track_id: body.trackId || null,
      language: body.language || 'he',
      expires_at: null,
      is_active: true,
    })
    .select('public_token')
    .single();

  if (error || !data) {
    console.error('share create error:', error);
    return res.status(500).json({ error: 'שגיאה ביצירת קישור שיתוף' });
  }

  const url = `${resolveSharePublicUrl()}/share/${data.public_token}`;
  return res.status(200).json({ token: data.public_token, url });
}

async function handlePublic(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const admin = getSupabaseAdmin();
  const row = await fetchShareByToken(admin, token, { incrementView: true });
  if (!row || !isShareAvailable(row)) {
    return res.status(404).json({
      error: 'unavailable',
      message: 'תוצאת השיתוף אינה זמינה עוד.',
    });
  }
  return res.status(200).json(toPublicPayload(row));
}

async function handlePage(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).end('Invalid token');
  }

  const admin = getSupabaseAdmin();
  const row = await fetchShareByToken(admin, token, { incrementView: true });
  const unavailable = !row || !isShareAvailable(row);
  const html = renderShareHtmlPage(token, row, unavailable);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', unavailable ? 'no-store' : 'public, max-age=60, s-maxage=300');
  return res.status(unavailable ? 404 : 200).end(html);
}

async function handleDeactivate(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'נדרשת התחברות' });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('share_reports')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('public_token', token)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    console.error('share-deactivate:', error);
    return res.status(500).json({ error: 'שגיאה בביטול קישור' });
  }
  if (!data?.length) {
    return res.status(404).json({ error: 'קישור לא נמצא' });
  }
  return res.status(200).json({ ok: true });
}

/** Routed via /api/subscription?shareAction=... to stay within Vercel Hobby function limit. */
export async function handleShareApi(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.shareAction || '');

  try {
    if (action === 'create' && req.method === 'POST') {
      return await handleCreate(req, res);
    }
    if (action === 'public' && req.method === 'GET') {
      return await handlePublic(req, res);
    }
    if (action === 'page' && req.method === 'GET') {
      return await handlePage(req, res);
    }
    if (action === 'deactivate' && req.method === 'POST') {
      return await handleDeactivate(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('share api:', e);
    if (action === 'page') {
      return res.status(500).end('Server error');
    }
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
