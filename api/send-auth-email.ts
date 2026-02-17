/**
 * Auth emails (signup confirmation + password reset). Supports Hebrew (he) and English (en).
 * Called by Supabase auth-send-email hook. Lang from user metadata or profiles.preferred_language.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export type EmailLang = 'he' | 'en';
export type EmailType = 'signup' | 'recovery';

function escapeHtml(s: string): string {
  const m: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (c) => m[c] || c);
}

const SIGNUP_STRINGS: Record<EmailLang, {
  welcome: string;
  intro: string;
  ctaIntro: string;
  ctaButton: string;
  fallback: string;
  ignore: string;
  subject: string;
}> = {
  he: {
    welcome: 'ברוך הבא ל־ Viraly',
    intro: 'אתה רגע לפני כניסה ל־Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.',
    ctaIntro: 'כדי לאשר את החשבון ולהתחיל, לחץ על הכפתור:',
    ctaButton: 'כניסה לחשבון',
    fallback: 'פתח קישור אימות',
    ignore: 'אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.',
    subject: 'אישור חשבון | Viraly - Video Director Pro',
  },
  en: {
    welcome: 'Welcome to Viraly',
    intro: "You're moments away from Video Director Pro – AI-powered analysis and feedback for your on-camera presence.",
    ctaIntro: 'To confirm your account and get started, click the button:',
    ctaButton: 'Log in to account',
    fallback: 'Open verification link',
    ignore: 'If you did not request to join Viraly, you can ignore this email.',
    subject: 'Account Confirmation | Viraly - Video Director Pro',
  },
};

const RECOVERY_STRINGS: Record<EmailLang, {
  title: string;
  intro: string;
  ctaIntro: string;
  ctaButton: string;
  fallback: string;
  ignore: string;
  subject: string;
}> = {
  he: {
    title: 'איפוס סיסמה',
    intro: 'ביקשת לאפס את סיסמת החשבון ב־Viraly - Video Director Pro.',
    ctaIntro: 'לחץ על הכפתור כדי לבחור סיסמה חדשה:',
    ctaButton: 'איפוס סיסמה',
    fallback: 'פתח קישור איפוס',
    ignore: 'אם לא ביקשת לאפס סיסמה, ניתן להתעלם מהמייל.',
    subject: 'איפוס סיסמה | Viraly - Video Director Pro',
  },
  en: {
    title: 'Reset your password',
    intro: 'You requested to reset your password for Viraly - Video Director Pro.',
    ctaIntro: 'Click the button below to choose a new password:',
    ctaButton: 'Reset password',
    fallback: 'Open reset link',
    ignore: 'If you did not request a password reset, you can ignore this email.',
    subject: 'Password Reset | Viraly - Video Director Pro',
  },
};

function buildSignupEmailHtml(lang: EmailLang, buttonUrl: string, fallbackUrl?: string): string {
  const s = SIGNUP_STRINGS[lang];
  const linkUrl = fallbackUrl || buttonUrl;
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const align = 'center';
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: ${dir}; text-align: ${align};">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; text-align: ${align};">
    <h1 style="margin: 0 0 20px 0; font-size: 1.75rem; font-weight: 700; color: #fff; text-align: ${align};">
      ${s.welcome}
    </h1>
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff; text-align: ${align};">
      ${s.intro}
    </p>
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #fff; text-align: ${align};">
      ${s.ctaIntro}
    </p>
    <p style="margin: 0 0 24px 0; text-align: ${align};">
      <a href="${escapeHtml(buttonUrl)}" style="display: inline-block; background: #D4A043; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem;">
        ${s.ctaButton}
      </a>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #ccc; text-align: ${align};">
      ${lang === 'he' ? 'אם הכפתור לא עובד, לחץ כאן:' : "If the button doesn't work, click here:"} <a href="${escapeHtml(linkUrl)}" style="color: #D4A043;">${s.fallback}</a>
    </p>
    <p style="margin: 0 0 32px 0; font-size: 0.85rem; color: #999; text-align: ${align};">
      ${s.ignore}
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: ${align};">
      Viraly – Video Director Pro<br>
      <span style="color: #D4A043;">AI Analysis • Performance • Presence</span>
    </p>
  </div>
</body>
</html>`;
}

function buildRecoveryEmailHtml(lang: EmailLang, buttonUrl: string, fallbackUrl?: string): string {
  const s = RECOVERY_STRINGS[lang];
  const linkUrl = fallbackUrl || buttonUrl;
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const align = 'center';
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: ${dir}; text-align: ${align};">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; text-align: ${align};">
    <h1 style="margin: 0 0 20px 0; font-size: 1.75rem; font-weight: 700; color: #fff; text-align: ${align};">
      ${s.title}
    </h1>
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff; text-align: ${align};">
      ${s.intro}
    </p>
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #fff; text-align: ${align};">
      ${s.ctaIntro}
    </p>
    <p style="margin: 0 0 24px 0; text-align: ${align};">
      <a href="${escapeHtml(buttonUrl)}" style="display: inline-block; background: #D4A043; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem;">
        ${s.ctaButton}
      </a>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #ccc; text-align: ${align};">
      ${lang === 'he' ? 'אם הכפתור לא עובד, לחץ כאן:' : "If the button doesn't work, click here:"} <a href="${escapeHtml(linkUrl)}" style="color: #D4A043;">${s.fallback}</a>
    </p>
    <p style="margin: 0 0 32px 0; font-size: 0.85rem; color: #999; text-align: ${align};">
      ${s.ignore}
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: ${align};">
      Viraly – Video Director Pro<br>
      <span style="color: #D4A043;">AI Analysis • Performance • Presence</span>
    </p>
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

    const typeParam = req.body?.type;
    const emailType: EmailType = (typeParam === 'signup' || typeParam === 'recovery') ? typeParam : 'signup';

    const langParam = req.body?.lang;
    const lang: EmailLang = (langParam === 'en' || langParam === 'he') ? langParam : 'he';

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

    let actionLink: string;
    let fallbackUrl: string | undefined;

    const providedActionLink = typeof req.body?.actionLink === 'string' ? req.body.actionLink.trim() : '';
    if (providedActionLink && providedActionLink.startsWith('http')) {
      actionLink = providedActionLink;
      fallbackUrl = providedActionLink;
    } else {
      const supabase = createClient(supabaseUrl, serviceKey);
      const redirectTo = typeof req.body?.redirectTo === 'string' ? req.body.redirectTo : (req.headers.origin || '');

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: emailType === 'recovery' ? 'recovery' : 'magiclink',
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      const props = linkData && (linkData as any).properties;
      actionLink = props?.action_link ?? (linkData as any)?.action_link;
      const hashedToken = props?.hashed_token;
      const verificationType = props?.verification_type || (emailType === 'recovery' ? 'recovery' : 'magiclink');
      if (linkError || !actionLink) {
        console.warn('generateLink failed:', linkError?.message || 'no action_link');
        return res.status(400).json({ ok: false, error: 'Could not generate link' });
      }
      const baseUrl = (redirectTo || '').replace(/\/$/, '');
      fallbackUrl = hashedToken ? `${baseUrl}?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}` : undefined;
    }

    const subject = emailType === 'signup' ? SIGNUP_STRINGS[lang].subject : RECOVERY_STRINGS[lang].subject;
    const html = emailType === 'signup'
      ? buildSignupEmailHtml(lang, actionLink, fallbackUrl)
      : buildRecoveryEmailHtml(lang, actionLink, fallbackUrl);
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
    console.error('send-auth-email error:', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal server error' });
  }
}
