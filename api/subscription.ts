import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.shareAction === 'public') {
    return res.status(404).json({ error: 'unavailable', message: 'test' });
  }
  return res.status(200).json({ ok: true, route: 'subscription-minimal' });
}
