/**
 * שולח מייל אימות הרשמה דרך Resend (בפורמט "אישור חשבון" – כפתור כניסה, קישור אימות).
 * נקרא מהלקוח אחרי signUp כאשר נדרש אימות מייל, כדי שהמייל יגיע דרך Resend גם בלי SMTP ב-Supabase.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function escapeHtml(s: string): string {
  const m: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (c) => m[c] || c);
}

/** מייל אימות מקורי – קישור Supabase (action_link), תצוגה מלאה (קומפקטי). */
function buildConfirmationEmailHtml(primaryUrl: string, fallbackUrl?: string): string {
  const linkUrl = fallbackUrl || primaryUrl;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>אישור חשבון | Viraly - Video Director Pro</title>
</head>
<body style="margin:0;padding:12px;background:#1a1a1a;font-family:Arial,sans-serif;direction:rtl;text-align:right;color:#fff;">
<div style="max-width:560px;margin:0 auto;">
<h1 style="margin:0 0 12px 0;font-size:1.5rem;font-weight:700;color:#fff;">ברוך הבא ל־ Viraly</h1>
<p style="margin:0 0 12px 0;line-height:1.5;color:#fff;">אתה רגע לפני כניסה ל־Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.</p>
<p style="margin:0 0 10px 0;color:#fff;">כדי לאשר את החשבון ולהתחיל, לחץ על הכפתור:</p>
<p style="margin:0 0 10px 0;">
<a href="${escapeHtml(primaryUrl)}" style="display:inline-block;background:#D4A043;color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">כניסה לחשבון</a>
</p>
<p style="margin:0 0 8px 0;font-size:0.9rem;color:#ccc;">אם הכפתור לא עובד, לחץ כאן: <a href="${escapeHtml(linkUrl)}" style="color:#D4A043;">פתח קישור אימות</a></p>
<p style="margin:0 0 16px 0;font-size:0.8rem;color:#999;">אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.</p>
<p style="margin:0;font-size:0.8rem;color:#888;">Viraly – Video Director Pro | <span style="color:#D4A043;">AI Analysis • Performance • Presence</span></p>
</div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
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
    const actionLink = props?.action_link;
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

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('send-confirmation-email error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal server error' });
  }
}
