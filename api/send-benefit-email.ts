import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { EmailLang } from './email-templates';
import {
  buildBenefitEmailHtml,
  buildBenefitEmailText,
  buildBenefitEmailSubject,
  getPackageLabel,
} from './email-templates';

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

    type Recipient = { email: string; lang: EmailLang };
    let recipients: Recipient[];

    if (body.targetUserEmail?.trim()) {
      const email = body.targetUserEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid target user email' });
      }
      recipients = [{ email, lang: 'he' }];
    } else {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      let query = supabase
        .from('profiles')
        .select('user_id, email, preferred_language')
        .eq('receive_updates', true)
        .not('email', 'is', null);

      if (!body.targetAll && body.targetTier && body.targetTier.length > 0) {
        query = query.in('subscription_tier', body.targetTier);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError || !profiles || profiles.length === 0) {
        return res.status(200).json({ ok: true, sent: 0 });
      }

      recipients = profiles
        .map((p: { email?: string; preferred_language?: string | null }) => {
          const email = p.email;
          if (!email || typeof email !== 'string') return null;
          const lang: EmailLang = p.preferred_language === 'en' ? 'en' : 'he';
          return { email, lang };
        })
        .filter((r): r is Recipient => r !== null);
    }

    const benefitTypeLabel = (body.benefitTypeLabel || 'הטבה').trim();
    const benefitTitle = (body.benefitTitle || body.title || '').trim();
    const packageLabelHe = body.targetPackage ? getPackageLabel(body.targetPackage, 'he') : undefined;
    const packageLabelEn = body.targetPackage ? getPackageLabel(body.targetPackage, 'en') : undefined;
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

    let sent = 0;
    for (const { email: to, lang } of recipients) {
      const packageLabel = lang === 'en' ? packageLabelEn : packageLabelHe;
      const subject = buildBenefitEmailSubject(lang, benefitTypeLabel, benefitTitle, packageLabel);
      const htmlBody = buildBenefitEmailHtml(lang, redemptionUrl, body.couponCode, body.benefitDetails, packageLabel);
      const textBody = buildBenefitEmailText(lang, redemptionUrl, body.couponCode, body.benefitDetails, packageLabel);
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
