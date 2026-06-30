import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSubscriptionSubject } from '../lib/email-templates';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, subject: getSubscriptionSubject('cancel', 'he').slice(0, 20) });
}
