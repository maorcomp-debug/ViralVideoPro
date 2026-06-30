import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  fetchShareByToken,
  getSupabaseAdmin,
  isShareAvailable,
  toPublicPayload,
} from './_share-lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = getSupabaseAdmin();
    const row = await fetchShareByToken(admin, token, { incrementView: true });
    if (!row || !isShareAvailable(row)) {
      return res.status(404).json({
        error: 'unavailable',
        message: 'תוצאת השיתוף אינה זמינה עוד.',
      });
    }
    return res.status(200).json(toPublicPayload(row));
  } catch (e) {
    console.error('share-public:', e);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
}
