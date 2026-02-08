/**
 * מקור יחיד למייל אימות הרשמה – נשלח רק מכאן (Resend), בעיצוב Viraly (כפתור צהוב "כניסה לחשבון").
 * לא להשתמש במייל אימות אחר. כדי שלא יישלחו שני מיילים – כבה ב-Supabase את שליחת מייל האימות
 * המובנית (Authentication → Providers → Email או Auth Hook). ראה api/README_EMAIL.md.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function escapeHtml(s: string): string {
  const m: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (c) => m[c] || c);
}

/** עיצוב נכון: כל המלל ממורכז (כמו בתמונה הנכונה). */
function buildConfirmationEmailHtml(buttonUrl: string, fallbackUrl?: string): string {
  const linkUrl = fallbackUrl || buttonUrl;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">body, .wrap { text-align: center; }</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: rtl; text-align: center;">
  <div class="wrap" style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; text-align: center;">
    <h1 style="margin: 0 0 20px 0; font-size: 1.75rem; font-weight: 700; color: #fff; text-align: center;">
      ברוך הבא ל־ Viraly
    </h1>
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff; text-align: center;">
      אתה רגע לפני כניסה ל־Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.
    </p>
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #fff; text-align: center;">
      כדי לאשר את החשבון ולהתחיל, לחץ על הכפתור:
    </p>
    <p style="margin: 0 0 24px 0; text-align: center;">
      <a href="${escapeHtml(buttonUrl)}" style="display: inline-block; background: #D4A043; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem;">
        כניסה לחשבון
      </a>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #ccc; text-align: center;">
      אם הכפתור לא עובד, לחץ כאן: <a href="${escapeHtml(linkUrl)}" style="color: #D4A043;">פתח קישור אימות</a>
    </p>
    <p style="margin: 0 0 32px 0; font-size: 0.85rem; color: #999; text-align: center;">
      אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: center;">
      Viraly – Video Director Pro<br>
      <span style="color: #D4A043;">AI Analysis • Performance • Presence</span>
    </p>
  </div>
</body>
</html>`;
}

const IDEMPOTENCY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const lastSentByEmail: Record<string, number> = {};

function shouldSkipDuplicate(email: string): boolean {
  const now = Date.now();
  const sent = lastSentByEmail[email];
  if (sent && now - sent < IDEMPOTENCY_WINDOW_MS) return true;
  Object.keys(lastSentByEmail).forEach((key) => {
    if (now - (lastSentByEmail[key] || 0) > IDEMPOTENCY_WINDOW_MS) delete lastSentByEmail[key];
  });
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }
    if (shouldSkipDuplicate(email)) {
      return res.status(200).json({ ok: true });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ ok: false, error: 'Server configuration error' });
    }
    if (!resendApiKey || !fromEmail) {
      return res.status(500).json({ ok: false, error: 'Email not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const redirectTo = typeof req.body?.redirectTo === 'string' ? req.body.redirectTo : (req.headers.origin || '');

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });

    const props = linkData && (linkData as any).properties;
    const actionLink = props?.action_link ?? (linkData as any)?.action_link;
    const hashedToken = props?.hashed_token;
    const verificationType = props?.verification_type || 'magiclink';
    if (linkError || !actionLink) {
      console.warn('generateLink failed:', linkError?.message || 'no action_link');
      return res.status(400).json({ ok: false, error: 'Could not generate confirmation link' });
    }
    const baseUrl = (redirectTo || '').replace(/\/$/, '');
    const fallbackUrl = hashedToken ? `${baseUrl}?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}` : undefined;

    const subject = 'אישור חשבון | Viraly - Video Director Pro';
    const html = buildConfirmationEmailHtml(actionLink, fallbackUrl);
    const fromDisplay = fromEmail.includes('@') ? `Viraly <${fromEmail}>` : fromEmail;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: fromDisplay, to: [email], subject, html }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', resendRes.status, errText);
      return res.status(500).json({ ok: false, error: 'Failed to send email' });
    }

    lastSentByEmail[email] = Date.now();
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('send-confirmation-email error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal server error' });
  }
}
