import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface SendBenefitEmailRequest {
  title: string;
  message: string;
  targetAll?: boolean;
  targetTier?: string[];
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c] || c);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body as SendBenefitEmailRequest;
    if (!body.title || !body.message) {
      return res.status(400).json({ ok: false, error: 'Missing title or message' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey || !fromEmail) {
      console.warn('RESEND_API_KEY or FROM_EMAIL not set – skipping benefit email');
      return res.status(200).json({ ok: true, sent: 0, skipped: 'Email not configured' });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('Supabase credentials not set for send-benefit-email');
      return res.status(200).json({ ok: true, sent: 0, skipped: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    let query = supabase
      .from('profiles')
      .select('user_id, email')
      .eq('receive_updates', true)
      .not('email', 'is', null);

    if (!body.targetAll && body.targetTier && body.targetTier.length > 0) {
      query = query.in('subscription_tier', body.targetTier);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError || !profiles || profiles.length === 0) {
      return res.status(200).json({ ok: true, sent: 0 });
    }

    const emails = profiles.map((p: { email?: string }) => p.email).filter(Boolean) as string[];
    const messagePlain = body.message.replace(/\n/g, '\n');
    const htmlBody = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #D4A043; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">${escapeHtml(body.title)}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; white-space: pre-wrap;">${escapeHtml(body.message)}</div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Viraly - Video Director Pro</p>
        </body>
      </html>
    `;

    let sent = 0;
    for (const to of emails) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject: body.title,
            html: htmlBody,
            text: messagePlain,
          }),
        });
        if (resendRes.ok) sent++;
      } catch (e) {
        console.error('Resend error for', to, e);
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (error: any) {
    console.error('send-benefit-email error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Failed to send emails' });
  }
}
