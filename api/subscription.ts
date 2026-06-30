import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSubscriptionSubject,
  getSubscriptionConfirmLine,
  buildSubscriptionActionEmailHtml,
} from './email-templates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subject = getSubscriptionSubject('cancel', 'he');
  return res.status(200).json({ ok: true, subjectLen: subject.length });
}
