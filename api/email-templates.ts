/**
 * Email templates for Viraly – Video Director Pro.
 * Supports Hebrew (he) and English (en) for benefit emails and subscription action emails.
 */

export type EmailLang = 'he' | 'en';

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c] || c);
}

const PACKAGE_LABELS: Record<EmailLang, Record<string, string>> = {
  he: {
    creator: 'חבילת היוצרים',
    pro: 'חבילת יוצרים באקסטרים',
    coach: 'חבילת המאמנים',
    'coach-pro': 'חבילת המאמנים גרסת פרו',
  },
  en: {
    creator: 'Creators Package',
    pro: 'Creators Extreme Package',
    coach: 'Coaches Package',
    'coach-pro': 'Coaches Pro Package',
  },
};

// Benefit email strings
const BENEFIT_STRINGS: Record<EmailLang, {
  welcomeTitle: string;
  welcomeSubtitle: string;
  ctaIntroWithCode: (code: string) => string;
  ctaIntroNoCode: string;
  ctaButton: string;
  ctaFallback: string;
  footerIgnore: string;
  footerBrand: string;
  footerTagline: string;
}> = {
  he: {
    welcomeTitle: 'ברוך הבא ל־ Viraly',
    welcomeSubtitle: 'Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.',
    ctaIntroWithCode: (code) => `כדי לממש את ההטבה, העתק או הזן את קוד ההטבה :  <strong>${escapeHtml(code)}</strong>  ולחץ על הכפתור למימוש ההטבה.`,
    ctaIntroNoCode: 'כדי לממש את ההטבה, לחץ על הכפתור:',
    ctaButton: 'מימוש הטבה',
    ctaFallback: 'פתח קישור למימוש ההטבה',
    footerIgnore: 'אם לא ביקשת להצטרף ל-Viraly, ניתן להתעלם מהמייל.',
    footerBrand: 'Viraly – Video Director Pro',
    footerTagline: 'AI Analysis • Performance • Presence',
  },
  en: {
    welcomeTitle: 'Welcome to Viraly',
    welcomeSubtitle: 'Video Director Pro – Advanced AI system for analyzing and improving on-camera presence.',
    ctaIntroWithCode: (code) => `To redeem your benefit, copy or enter the code: <strong>${escapeHtml(code)}</strong> and click the button below.`,
    ctaIntroNoCode: 'To redeem your benefit, click the button below:',
    ctaButton: 'Redeem Benefit',
    ctaFallback: 'Open redemption link',
    footerIgnore: 'If you did not request to join Viraly, you can ignore this email.',
    footerBrand: 'Viraly – Video Director Pro',
    footerTagline: 'AI Analysis • Performance • Presence',
  },
};

// Subscription action email strings
const SUBSCRIPTION_STRINGS: Record<EmailLang, {
  welcomeLine: string;
  confirmPause: string;
  confirmCancel: string;
  confirmResume: string;
  subjectPause: string;
  subjectCancel: string;
  subjectResume: string;
}> = {
  he: {
    welcomeLine: 'ברוך הבא ל־Viraly Video Director Pro – מערכת AI מתקדמת לניתוח ושיפור נוכחות מצולמת.',
    confirmPause: 'אנו מאשרים כי ביקשת להשהות את המנוי. ההשהייה תיכנס לתוקף בסיום התקופה.',
    confirmCancel: 'אנו מאשרים כי ביקשת לבטל את המנוי. הביטול ייכנס לתוקף בסיום התקופה.',
    confirmResume: 'אנו מאשרים כי ביקשת לחדש את המנוי.',
    subjectPause: 'השהיית מנוי | Viraly – Video Director Pro',
    subjectCancel: 'ביטול מנוי | Viraly – Video Director Pro',
    subjectResume: 'חידוש מנוי | Viraly – Video Director Pro',
  },
  en: {
    welcomeLine: 'Welcome to Viraly Video Director Pro – Advanced AI system for analyzing and improving on-camera presence.',
    confirmPause: 'We confirm that you requested to pause your subscription. The pause will take effect at the end of the current period.',
    confirmCancel: 'We confirm that you requested to cancel your subscription. The cancellation will take effect at the end of the current period.',
    confirmResume: 'We confirm that you requested to resume your subscription.',
    subjectPause: 'Subscription Paused | Viraly – Video Director Pro',
    subjectCancel: 'Subscription Canceled | Viraly – Video Director Pro',
    subjectResume: 'Subscription Resumed | Viraly – Video Director Pro',
  },
};

export function getPackageLabel(pkg: string, lang: EmailLang): string | undefined {
  return PACKAGE_LABELS[lang][pkg] ?? PACKAGE_LABELS.he[pkg];
}

export function buildBenefitEmailHtml(
  lang: EmailLang,
  redemptionUrl: string,
  couponCode?: string,
  benefitDetails?: string,
  packageLabel?: string
): string {
  const s = BENEFIT_STRINGS[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const packageLine = packageLabel ? (lang === 'he' ? `הטבה בהרשמה ל${packageLabel}.` : `Benefit on signup for ${packageLabel}.`) : '';
  const benefitText = [benefitDetails, packageLine].filter(Boolean).join(' ');
  const ctaIntro = couponCode ? s.ctaIntroWithCode(couponCode) : s.ctaIntroNoCode;

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">body, .wrap { direction: ${dir}; text-align: ${lang === 'he' ? 'right' : 'left'}; }</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: ${dir}; text-align: ${lang === 'he' ? 'right' : 'left'};">
  <div class="wrap" style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; direction: ${dir}; text-align: ${lang === 'he' ? 'right' : 'left'};">
    <h1 style="margin: 0 0 20px 0; font-size: 1.75rem; font-weight: 700; color: #fff;">
      ${s.welcomeTitle}
    </h1>
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff;">
      ${s.welcomeSubtitle}
    </p>
    ${benefitText ? `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #D4A043; font-weight: 600;">${escapeHtml(benefitText)}</p>` : ''}
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #fff;">
      ${ctaIntro}
    </p>
    <p style="margin: 0 0 24px 0; text-align: ${lang === 'he' ? 'right' : 'left'};">
      <a href="${escapeHtml(redemptionUrl)}" style="display: inline-block; background: #D4A043; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem;">
        ${s.ctaButton}
      </a>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #ccc;">
      ${lang === 'he' ? 'אם הכפתור לא עובד, לחץ כאן:' : 'If the button doesn\'t work, click here:'} <a href="${escapeHtml(redemptionUrl)}" style="color: #D4A043;">${s.ctaFallback}</a>
    </p>
    <p style="margin: 0 0 32px 0; font-size: 0.85rem; color: #999;">
      ${s.footerIgnore}
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: ${lang === 'he' ? 'right' : 'left'};">
      ${s.footerBrand}<br>
      <span style="color: #D4A043;">${s.footerTagline}</span>
    </p>
  </div>
</body>
</html>`;
}

export function buildBenefitEmailText(
  lang: EmailLang,
  redemptionUrl: string,
  couponCode?: string,
  benefitDetails?: string,
  packageLabel?: string
): string {
  const s = BENEFIT_STRINGS[lang];
  const packageLine = packageLabel ? (lang === 'he' ? `הטבה בהרשמה ל${packageLabel}.` : `Benefit on signup for ${packageLabel}.`) : '';
  const benefitText = [benefitDetails, packageLine].filter(Boolean).join(' ');
  const ctaText = couponCode
    ? (lang === 'he' ? `כדי לממש את ההטבה, העתק או הזן את קוד ההטבה :  ${couponCode}  ולחץ על הכפתור למימוש ההטבה.` : `To redeem your benefit, copy or enter the code: ${couponCode} and click the button below.`)
    : (lang === 'he' ? 'כדי לממש את ההטבה, לחץ על הקישור:' : 'To redeem your benefit, click the link below:');
  return [
    s.welcomeTitle,
    s.welcomeSubtitle,
    '',
    ...(benefitText ? [benefitText, ''] : []),
    ctaText,
    redemptionUrl,
    '',
    s.footerIgnore,
    '',
    s.footerBrand,
    s.footerTagline,
  ].join('\n');
}

export function buildBenefitEmailSubject(
  lang: EmailLang,
  benefitTypeLabel: string,
  benefitTitle: string,
  packageLabel?: string
): string {
  const suffix = packageLabel
    ? (lang === 'he' ? ` – הטבה בהרשמה ל${packageLabel}` : ` – Signup benefit for ${packageLabel}`)
    : '';
  return `Viraly – Video Director Pro | ${benefitTypeLabel} | ${benefitTitle || (lang === 'he' ? 'הטבה' : 'Benefit')}${suffix}`;
}

// Subscription action emails
export function getSubscriptionSubject(action: 'pause' | 'cancel' | 'resume', lang: EmailLang): string {
  const s = SUBSCRIPTION_STRINGS[lang];
  if (action === 'pause') return s.subjectPause;
  if (action === 'cancel') return s.subjectCancel;
  return s.subjectResume;
}

export function getSubscriptionConfirmLine(action: 'pause' | 'cancel' | 'resume', lang: EmailLang): string {
  const s = SUBSCRIPTION_STRINGS[lang];
  if (action === 'pause') return s.confirmPause;
  if (action === 'cancel') return s.confirmCancel;
  return s.confirmResume;
}

export function buildSubscriptionActionEmailHtml(confirmLine: string, lang: EmailLang): string {
  const s = SUBSCRIPTION_STRINGS[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const align = lang === 'he' ? 'right' : 'left';
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">body, .wrap { direction: ${dir}; text-align: ${align}; }</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family: Arial, sans-serif; direction: ${dir}; text-align: ${align};">
  <div class="wrap" style="max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #fff; direction: ${dir}; text-align: ${align};">
    <p style="margin: 0 0 24px 0; line-height: 1.6; color: #fff;">
      ${s.welcomeLine}
    </p>
    <p style="margin: 0 0 32px 0; line-height: 1.6; color: #fff;">
      ${escapeHtml(confirmLine)}
    </p>
    <p style="margin: 0; font-size: 0.85rem; color: #888; text-align: ${align};">
      Viraly – Video Director Pro
    </p>
  </div>
</body>
</html>`;
}
