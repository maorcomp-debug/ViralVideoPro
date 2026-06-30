import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generatePublicToken,
  getSupabaseAdmin,
  getUserFromRequest,
  resolveSharePublicUrl,
  sanitizeCreateBody,
} from '../server/share-lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
  } catch (e) {
    console.error('share-create:', e);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
