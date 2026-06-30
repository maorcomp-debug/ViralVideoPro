import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchShareByToken, getSupabaseAdmin, isShareAvailable, renderShareHtmlPage } from '../../../server/share-lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).end('Invalid token');
  }

  try {
    const admin = getSupabaseAdmin();
    const row = await fetchShareByToken(admin, token, { incrementView: true });
    const unavailable = !row || !isShareAvailable(row);
    const html = renderShareHtmlPage(token, row, unavailable);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', unavailable ? 'no-store' : 'public, max-age=60, s-maxage=300');
    return res.status(unavailable ? 404 : 200).end(html);
  } catch (e) {
    console.error('share/page:', e);
    return res.status(500).end('Server error');
  }
}
