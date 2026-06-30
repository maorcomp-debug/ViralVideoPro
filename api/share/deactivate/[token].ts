import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromRequest } from '../share-lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
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
      console.error('share/deactivate:', error);
      return res.status(500).json({ error: 'שגיאה בביטול קישור' });
    }
    if (!data?.length) {
      return res.status(404).json({ error: 'קישור לא נמצא' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('share/deactivate:', e);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
