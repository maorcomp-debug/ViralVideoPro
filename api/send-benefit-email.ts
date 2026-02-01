import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface SendBenefitEmailRequest {
  title: string;
  message?: string;
  /** סוג ההטבה (אחוז הנחה, ניתוח מתנה, קוד קופון...) */
  benefitTypeLabel?: string;
  /** כותרת ההודעה (למשל: הטבה לנרשמים חדשים) */
  benefitTitle?: string;
  /** קוד הקופון – למייל עם קוד ולקישור מימוש ?redeem= */
  couponCode?: string;
  /** פירוט ההטבה למייל (אחוז הנחה, סכום, ניתוחים וכו') */
  benefitDetails?: string;
  /** חבילה מיועדת להטבה (creator, pro, coach, coach-pro) – נוסף ל-URL ולדף ההרשמה */
  targetPackage?: string;
  targetAll?: boolean;
  targetTier?: string[];
  /** כשמוגדר – שולח אך ורק לכתובת זו (משתמש ספציפי, כולל לא רשום) */
  targetUserEmail?: string;
}

const PACKAGE_LABELS: Record<string, string> = {
  creator: 'חבילת היוצרים',
  pro: 'חבילת יוצרים באקסטרים',
  coach: 'חבילת המאמנים',
  'coach-pro': 'חבילת המאמנים גרסת פרו',
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c] || c);
}

/** Benefit email HTML – RTL Hebrew, same visual style as account verification (dark theme, yellow CTA). */
function buildBenefitEmailHtml(
  redemptionUrl: string,
  couponCode?: string,
  benefitDetails?: string,
  packageLabel?: string
): string {
  const packageLine = packageLabel ? `הטבה בהרשמה ל${packageLabel}.` : '';
  const benefitText = [benefitDetails, packageLine].filter(Boolean).join(' ');
  const ctaIntro = couponCode
    ? `כדי לממש את ההטבה, העתק או הזן את קוד ההטבה :  <strong>${escapeHtml(couponCode)}</strong>  ולחץ על הכפתור למימוש ההטבה.`
    : 'כדי לממש את ההטבה, לחץ על הכפתור:';
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">body, .rtl-wrap { direction: rtl; text-align: right; }</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: rtl; text-align: right;">
  <div class="rtl-wrap" style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; direction: rtl; text-align: right;">
    <h1 style="margin: 0 0 20px 0; font-size: 1.75rem; font-weight: 700; color: #fff;">
      ברוך הבא ל־ Viraly
    </h1>
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff;">
      Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.
    </p>
    ${benefitText ? `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #D4A043; font-weight: 600;">${escapeHtml(benefitText)}</p>` : ''}
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #fff;">
      ${ctaIntro}
    </p>
    <p style="margin: 0 0 24px 0; text-align: right;">
      <a href="${escapeHtml(redemptionUrl)}" style="display: inline-block; background: #D4A043; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem;">
        מימוש הטבה
      </a>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #ccc;">
      אם הכפתור לא עובד, לחץ כאן: <a href="${escapeHtml(redemptionUrl)}" style="color: #D4A043;">פתח קישור למימוש ההטבה</a>
    </p>
    <p style="margin: 0 0 32px 0; font-size: 0.85rem; color: #999;">
      אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: right;">
      Viraly – Video Director Pro<br>
      <span style="color: #D4A043;">AI Analysis • Performance • Presence</span>
    </p>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body as SendBenefitEmailRequest;
    if (!body.title) {
      return res.status(400).json({ ok: false, error: 'Missing title' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://viraly.co.il';

    if (!resendApiKey || !fromEmail) {
      console.warn('RESEND_API_KEY or FROM_EMAIL not set – skipping benefit email');
      return res.status(200).json({ ok: true, sent: 0, skipped: 'Email not configured' });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('Supabase credentials not set for send-benefit-email');
      return res.status(200).json({ ok: true, sent: 0, skipped: 'Supabase not configured' });
    }

    let emails: string[];

    if (body.targetUserEmail?.trim()) {
      const email = body.targetUserEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid target user email' });
      }
      emails = [email];
    } else {
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

      emails = profiles.map((p: { email?: string }) => p.email).filter(Boolean) as string[];
    }
    const benefitTypeLabel = (body.benefitTypeLabel || 'הטבה').trim();
    const benefitTitle = (body.benefitTitle || body.title || '').trim();
    const packageLabel = body.targetPackage && PACKAGE_LABELS[body.targetPackage]
      ? PACKAGE_LABELS[body.targetPackage]
      : undefined;
    const subjectSuffix = packageLabel ? ` – הטבה בהרשמה ל${packageLabel}` : '';
    const subject = `Viraly – Video Director Pro | ${benefitTypeLabel} | ${benefitTitle || 'הטבה'}${subjectSuffix}`;
    const baseUrl = appUrl.replace(/\/$/, '');
    const redeemParams = new URLSearchParams();
    if (body.couponCode) redeemParams.set('redeem', body.couponCode);
    if (body.targetPackage && ['creator', 'pro', 'coach', 'coach-pro'].includes(body.targetPackage)) {
      redeemParams.set('package', body.targetPackage);
    }
    const redemptionUrl = redeemParams.toString()
      ? `${baseUrl}?${redeemParams.toString()}`
      : baseUrl;
    const fromDisplay = fromEmail.includes('@') ? `Viraly <${fromEmail}>` : fromEmail;
    const htmlBody = buildBenefitEmailHtml(redemptionUrl, body.couponCode, body.benefitDetails, packageLabel);
    const ctaText = body.couponCode
      ? `כדי לממש את ההטבה, העתק או הזן את קוד ההטבה :  ${body.couponCode}  ולחץ על הכפתור למימוש ההטבה.`
      : 'כדי לממש את ההטבה, לחץ על הקישור:';
    const textBenefit = [body.benefitDetails, packageLabel ? `הטבה בהרשמה ל${packageLabel}.` : ''].filter(Boolean).join(' ');
    const textBody = [
      'ברוך הבא ל־ Viraly',
      'Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.',
      '',
      ...(textBenefit ? [textBenefit, ''] : []),
      ctaText,
      redemptionUrl,
      '',
      'אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.',
      '',
      'Viraly – Video Director Pro',
      'AI Analysis • Performance • Presence',
    ].join('\n');

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
            from: fromDisplay,
            to: [to],
            subject,
            html: htmlBody,
            text: textBody,
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
