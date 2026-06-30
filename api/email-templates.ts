/**
 * Email templates for Viraly – Video Director Pro.
 * Also hosts viral-share API helpers (same serverless bundle as subscription).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

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

// --- Viral share API (bundled; imported by subscription.ts) ---
/** Internal creator-type keys — stored in DB, never localized labels. */
const CREATOR_TYPE_KEYS = [
  'content_creator',
  'actor',
  'singer',
  'podcaster',
  'influencer',
  'comedian',
  'video_creator',
] as const;

type CreatorTypeKey = (typeof CREATOR_TYPE_KEYS)[number];

const CREATOR_TYPE_LABELS: Record<'he' | 'en', Record<CreatorTypeKey, string>> = {
  he: {
    content_creator: 'יוצר תוכן',
    actor: 'שחקן',
    singer: 'זמר',
    podcaster: 'פודקאסט',
    influencer: 'משפיען',
    comedian: 'סטנדאפיסט',
    video_creator: 'יוצר וידאו',
  },
  en: {
    content_creator: 'Content Creator',
    actor: 'Actor',
    singer: 'Singer',
    podcaster: 'Podcaster',
    influencer: 'Influencer',
    comedian: 'Comedian',
    video_creator: 'Video Creator',
  },
};

/** Legacy rows may still store Hebrew labels from before key-based storage. */
const LEGACY_LABEL_TO_KEY: Record<string, CreatorTypeKey> = {
  'יוצר תוכן': 'content_creator',
  שחקן: 'actor',
  זמר: 'singer',
  פודקאסט: 'podcaster',
  משפיען: 'influencer',
  סטנדאפיסט: 'comedian',
  'יוצר וידאו': 'video_creator',
};

function isCreatorTypeKey(value: string): value is CreatorTypeKey {
  return (CREATOR_TYPE_KEYS as readonly string[]).includes(value);
}

function normalizeCreatorTypeKey(raw: string | null | undefined): CreatorTypeKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isCreatorTypeKey(trimmed)) return trimmed;
  return LEGACY_LABEL_TO_KEY[trimmed] ?? null;
}

function resolveCreatorTypeLabel(
  raw: string | null | undefined,
  lang: string
): string | null {
  if (!raw?.trim()) return null;
  const key = normalizeCreatorTypeKey(raw);
  const locale: 'he' | 'en' = lang === 'en' ? 'en' : 'he';
  if (key) return CREATOR_TYPE_LABELS[locale][key];
  return raw.trim();
}

function sharePublicLocale(lang: string | null | undefined): 'he' | 'en' {
  return lang === 'en' ? 'en' : 'he';
}

/** Server-rendered share page / OG card copy (no React i18n). */
const SHARE_PUBLIC_COPY = {
  he: {
    viralScoreLabel: 'פוטנציאל ויראלי',
    cta: 'נתח את הסרטון שלך',
    unavailable: 'תוצאת השיתוף אינה זמינה עוד.',
    backHome: 'חזרה ל-VIRALY',
    titleSuffix: (score: number) => `${score}% פוטנציאל ויראלי | VIRALY`,
    ogLocale: 'he_IL',
    dir: 'rtl' as const,
  },
  en: {
    viralScoreLabel: 'Your AI Creator Score',
    cta: 'Analyze Your Video',
    unavailable: 'This share is no longer available.',
    backHome: 'Back to VIRALY',
    titleSuffix: (score: number) => `${score}% AI Creator Score | VIRALY`,
    ogLocale: 'en_US',
    dir: 'ltr' as const,
  },
};


const shareSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const shareSupabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const shareSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

function getShareSupabaseAdmin(): SupabaseClient {
  if (!shareSupabaseUrl || !shareSupabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(shareSupabaseUrl, shareSupabaseServiceKey);
}

async function getShareUserFromRequest(req: VercelRequest): Promise<{ id: string } | null> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !shareSupabaseUrl || !shareSupabaseAnonKey) return null;
  const supabase = createClient(shareSupabaseUrl, shareSupabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id };
}


const SHARE_APP_BASE_URL =
  (process.env.VITE_APP_URL || process.env.APP_URL || 'https://viraly.co.il').replace(/\/$/, '');

interface PublicShareRecord {
  viral_score: number;
  metrics: string[];
  ai_insight: string;
  creator_name: string | null;
  creator_type: string | null;
  language: string;
  is_active: boolean;
  expires_at: string | null;
}

interface CreateShareBody {
  viralScore: number;
  metrics: [string, string, string];
  aiInsight: string;
  includeCreatorName: boolean;
  creatorName?: string;
  creatorType?: string;
  trackId?: string;
  language?: string;
}

function generatePublicToken(): string {
  return randomBytes(24).toString('base64url');
}

function truncate(text: string, max: number): string {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function sanitizeCreateBody(raw: unknown): CreateShareBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const viralScore = Number(b.viralScore);
  if (!Number.isFinite(viralScore) || viralScore < 0 || viralScore > 100) return null;
  const metricsRaw = b.metrics;
  if (!Array.isArray(metricsRaw) || metricsRaw.length < 3) return null;
  const metrics: [string, string, string] = [
    truncate(String(metricsRaw[0]), 80),
    truncate(String(metricsRaw[1]), 80),
    truncate(String(metricsRaw[2]), 80),
  ];
  const aiInsight = truncate(String(b.aiInsight || ''), 200);
  if (!aiInsight) return null;
  const includeCreatorName = b.includeCreatorName === true;
  const creatorName = includeCreatorName ? truncate(String(b.creatorName || ''), 60) || null : null;
  const creatorTypeRaw = includeCreatorName ? String(b.creatorType || '').trim() : '';
  const creatorType =
    includeCreatorName && creatorTypeRaw && isCreatorTypeKey(creatorTypeRaw)
      ? creatorTypeRaw
      : null;
  const trackId = b.trackId ? truncate(String(b.trackId), 32) : undefined;
  const lang = b.language === 'en' ? 'en' : 'he';
  return {
    viralScore: Math.round(viralScore),
    metrics,
    aiInsight,
    includeCreatorName,
    creatorName: creatorName || undefined,
    creatorType: creatorType || undefined,
    trackId,
    language: lang,
  };
}

function isShareAvailable(row: {
  is_active: boolean;
  expires_at: string | null;
}): boolean {
  if (!row.is_active) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}

function toPublicPayload(row: PublicShareRecord) {
  return {
    viralScore: row.viral_score,
    metrics: row.metrics.slice(0, 3),
    aiInsight: row.ai_insight,
    creatorName: row.creator_name,
    creatorType: row.creator_type,
    language: row.language,
  };
}

async function fetchShareByToken(
  admin: SupabaseClient,
  token: string,
  opts?: { incrementView?: boolean }
): Promise<(PublicShareRecord & { id?: string }) | null> {
  const { data, error } = await admin
    .from('share_reports')
    .select(
      'id, viral_score, metrics, ai_insight, creator_name, creator_type, language, is_active, expires_at, view_count'
    )
    .eq('public_token', token)
    .maybeSingle();

  if (error || !data) return null;

  if (opts?.incrementView && isShareAvailable(data)) {
    await admin
      .from('share_reports')
      .update({
        view_count: (data.view_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
  }

  return {
    viral_score: data.viral_score,
    metrics: Array.isArray(data.metrics) ? data.metrics.map(String) : [],
    ai_insight: data.ai_insight,
    creator_name: data.creator_name,
    creator_type: data.creator_type,
    language: data.language || 'he',
    is_active: data.is_active,
    expires_at: data.expires_at,
    id: data.id,
  };
}

/** Public share links always use the production domain (never localhost). */
function resolveSharePublicUrl(): string {
  return SHARE_APP_BASE_URL;
}

function shareEscapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderShareHtmlPage(
  token: string,
  row: PublicShareRecord | null,
  unavailable: boolean
): string {
  const base = SHARE_APP_BASE_URL;
  const cardImage = `${base}/Logo.png`;
  const pageUrl = `${base}/share/${encodeURIComponent(token)}`;

  if (unavailable || !row || !isShareAvailable(row)) {
    const copy = SHARE_PUBLIC_COPY.he;
    const title = `${copy.unavailable} | VIRALY`;
    const desc = copy.unavailable;
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${shareEscapeHtml(title)}</title>
  <meta property="og:title" content="${shareEscapeHtml(title)}" />
  <meta property="og:description" content="${shareEscapeHtml(desc)}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:locale" content="${copy.ogLocale}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:#050505; color:#e0e0e0; font-family:Assistant,sans-serif; text-align:center; padding:24px; }
    p { color:#D4A043; font-size:1.1rem; }
    a { color:#e6be74; }
  </style>
</head>
<body>
  <div>
    <p>${shareEscapeHtml(copy.unavailable)}</p>
    <p><a href="${base}">${shareEscapeHtml(copy.backHome)}</a></p>
  </div>
</body>
</html>`;
  }

  const locale = sharePublicLocale(row.language);
  const copy = SHARE_PUBLIC_COPY[locale];
  const payload = toPublicPayload(row);
  const title = copy.titleSuffix(payload.viralScore);
  const desc = shareEscapeHtml(payload.aiInsight);
  const nameBlock = payload.creatorName
    ? `<div class="name">${shareEscapeHtml(payload.creatorName)}</div>`
    : '';
  const creatorTypeLabel = resolveCreatorTypeLabel(payload.creatorType, locale);
  const typeBlock = creatorTypeLabel
    ? `<div class="type">${shareEscapeHtml(creatorTypeLabel)}</div>`
    : '';
  const metricsHtml = payload.metrics
    .map((m) => `<li>${shareEscapeHtml(m)}</li>`)
    .join('');
  const listAlign = locale === 'en' ? 'left' : 'right';
  const insightBorder = locale === 'en' ? 'border-left' : 'border-right';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${copy.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${shareEscapeHtml(title)}</title>
  <meta property="og:title" content="${shareEscapeHtml(title)}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${cardImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${copy.ogLocale}" />
  <meta property="og:site_name" content="VIRALY" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${shareEscapeHtml(title)}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${cardImage}" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; background:linear-gradient(160deg,#050505,#1a1208); color:#e0e0e0;
      font-family:Assistant,sans-serif; display:flex; align-items:center; justify-content:center; padding:20px; }
    .card { max-width:420px; width:100%; background:linear-gradient(145deg,rgba(212,160,67,.12),#0a0a0a);
      border:1px solid rgba(212,160,67,.35); border-radius:20px; padding:28px 22px; text-align:center;
      box-shadow:0 24px 60px rgba(0,0,0,.5); }
    .logo { height:36px; margin-bottom:16px; }
    .name { font-size:1.1rem; font-weight:700; color:#fff; }
    .type { color:#D4A043; font-size:.85rem; margin-bottom:12px; }
    .score { font-size:3.5rem; font-weight:800; color:#fff; text-shadow:0 0 24px rgba(212,160,67,.4); line-height:1; }
    .score-label { color:#D4A043; font-size:.85rem; margin:8px 0 18px; letter-spacing:1px; }
    ul { list-style:none; padding:0; margin:0 0 16px; text-align:${listAlign}; }
    li { padding:6px 0; border-bottom:1px solid rgba(255,255,255,.06); font-size:.9rem; }
    li::before { content:'✦ '; color:#D4A043; }
    .insight { font-style:italic; background:rgba(0,0,0,.35); padding:12px; border-radius:10px;
      ${insightBorder}:3px solid #D4A043; margin-bottom:18px; text-align:${listAlign}; line-height:1.55; }
    .cta { display:inline-block; padding:12px 24px; border-radius:24px;
      background:linear-gradient(135deg,#b8862e,#e6be74); color:#000; font-weight:700; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="${base}/Logo.png" alt="VIRALY" />
    ${nameBlock}
    ${typeBlock}
    <div class="score">${payload.viralScore}%</div>
    <div class="score-label">${shareEscapeHtml(copy.viralScoreLabel)}</div>
    <ul>${metricsHtml}</ul>
    <div class="insight">"${desc}"</div>
    <a class="cta" href="${base}">${shareEscapeHtml(copy.cta)}</a>
  </div>
</body>
</html>`;
}


async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const user = await getShareUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'נדרשת התחברות' });
  }

  const body = sanitizeCreateBody(req.body);
  if (!body) {
    return res.status(400).json({ error: 'נתוני שיתוף לא תקינים' });
  }

  const admin = getShareSupabaseAdmin();
  const publicToken = generatePublicToken();

  const { data, error } = await admin
    .from('share_reports')
    .insert({
      public_token: publicToken,
      user_id: user.id,
      viral_score: body.viralScore,
      metrics: body.metrics,
      ai_insight: body.aiInsight,
      creator_name: body.includeCreatorName ? body.creatorName || null : null,
      creator_type: body.includeCreatorName ? body.creatorType || null : null,
      track_id: body.trackId || null,
      language: body.language || 'he',
      expires_at: null,
      is_active: true,
    })
    .select('public_token')
    .single();

  if (error || !data) {
    console.error('share create error:', error);
    return res.status(500).json({ error: 'שגיאה ביצירת קישור שיתוף' });
  }

  const url = `${resolveSharePublicUrl()}/share/${data.public_token}`;
  return res.status(200).json({ token: data.public_token, url });
}

async function handlePublic(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const admin = getShareSupabaseAdmin();
  const row = await fetchShareByToken(admin, token, { incrementView: true });
  if (!row || !isShareAvailable(row)) {
    return res.status(404).json({
      error: 'unavailable',
      message: 'תוצאת השיתוף אינה זמינה עוד.',
    });
  }
  return res.status(200).json(toPublicPayload(row));
}

async function handlePage(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).end('Invalid token');
  }

  const admin = getShareSupabaseAdmin();
  const row = await fetchShareByToken(admin, token, { incrementView: true });
  const unavailable = !row || !isShareAvailable(row);
  const html = renderShareHtmlPage(token, row, unavailable);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', unavailable ? 'no-store' : 'public, max-age=60, s-maxage=300');
  return res.status(unavailable ? 404 : 200).end(html);
}

async function handleDeactivate(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token.length > 64) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await getShareUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'נדרשת התחברות' });

  const admin = getShareSupabaseAdmin();
  const { data, error } = await admin
    .from('share_reports')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('public_token', token)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    console.error('share-deactivate:', error);
    return res.status(500).json({ error: 'שגיאה בביטול קישור' });
  }
  if (!data?.length) {
    return res.status(404).json({ error: 'קישור לא נמצא' });
  }
  return res.status(200).json({ ok: true });
}

/** Routed via /api/subscription?shareAction=... to stay within Vercel Hobby function limit. */
export async function handleShareApi(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.shareAction || '');

  try {
    if (action === 'create' && req.method === 'POST') {
      return await handleCreate(req, res);
    }
    if (action === 'public' && req.method === 'GET') {
      return await handlePublic(req, res);
    }
    if (action === 'page' && req.method === 'GET') {
      return await handlePage(req, res);
    }
    if (action === 'deactivate' && req.method === 'POST') {
      return await handleDeactivate(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('share api:', e);
    if (action === 'page') {
      return res.status(500).end('Server error');
    }
    const msg = e instanceof Error && e.message.includes('SUPABASE')
      ? 'שגיאת תצורת שרת'
      : 'שגיאת שרת';
    return res.status(500).json({ error: msg });
  }
}
