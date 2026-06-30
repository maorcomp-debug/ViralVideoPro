import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import type { EmailLang } from './email-templates';
import {
  getSubscriptionSubject,
  getSubscriptionConfirmLine,
  buildSubscriptionActionEmailHtml,
} from './email-templates';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';
const CRON_SECRET = process.env.CRON_SECRET || process.env.SUBSCRIPTION_CRON_SECRET || '';
const takbullApiKey = process.env.TAKBULL_API_KEY || '';
const takbullApiSecret = process.env.TAKBULL_API_SECRET || '';

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (add to .env.local for local API)');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function isMissingColumnError(error: unknown): boolean {
  const anyErr = error as { code?: string; message?: string } | null;
  return anyErr?.code === '42703' || (typeof anyErr?.message === 'string' && anyErr.message.includes('does not exist'));
}

async function getUserFromRequest(req: VercelRequest): Promise<{ id: string } | null> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id };
}

async function logEvent(admin: SupabaseClient, user_id: string, event_type: string, meta: object): Promise<void> {
  try {
    await admin.from('subscription_events').insert({
      user_id,
      event_type,
      meta,
    } as any);
  } catch (e) {
    console.warn('subscription_events insert:', e);
  }
}

async function getEmailAndLangForUser(admin: SupabaseClient, userId: string): Promise<{ email: string | null; lang: EmailLang }> {
  const { data: profile } = await admin.from('profiles').select('email, preferred_language').eq('user_id', userId).maybeSingle();
  const email = (profile as any)?.email;
  if (email && typeof email === 'string') {
    const lang: EmailLang = (profile as any)?.preferred_language === 'en' ? 'en' : 'he';
    return { email, lang };
  }
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if ((authUser?.user as any)?.email) {
      return { email: (authUser!.user as any).email, lang: 'he' };
    }
  } catch (_) {}
  return { email: null, lang: 'he' };
}

async function sendSubscriptionActionEmail(toEmail: string, action: 'pause' | 'cancel' | 'resume', lang: EmailLang = 'he'): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.FROM_EMAIL;
  if (!resendApiKey || !fromEmail) {
    console.warn('RESEND_API_KEY or FROM_EMAIL not set – skipping subscription action email');
    return;
  }
  const subject = getSubscriptionSubject(action, lang);
  const confirmLine = getSubscriptionConfirmLine(action, lang);
  const html = buildSubscriptionActionEmailHtml(confirmLine, lang);
  const fromDisplay = fromEmail.includes('@') ? `Viraly <${fromEmail}>` : fromEmail;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: fromDisplay, to: [toEmail], subject, html }),
    });
    if (!res.ok) console.warn('Resend subscription email failed:', await res.text());
  } catch (e) {
    console.warn('Resend subscription email error:', e);
  }
}

type CancelCandidate = { uniqId: string; recuringDueDates: string[] };

function getConfigErrorResponse(e: unknown): { status: number; error: string } | null {
  const msg = e instanceof Error ? e.message : '';
  if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return {
      status: 500,
      error: 'חסר SUPABASE_SERVICE_ROLE_KEY ב-.env.local. הוסף את מפתח service_role מ-Supabase והפעל מחדש npm run start',
    };
  }
  return null;
}

function formatRecuringDueDate(input: unknown): string | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRecuringDueDatesFromOrder(order: any): string[] {
  const dates: string[] = [];
  const add = (value: unknown) => {
    const formatted = formatRecuringDueDate(value);
    if (formatted && !dates.includes(formatted)) dates.push(formatted);
  };

  const response = order?.takbull_response;
  if (response && typeof response === 'object') {
    add(response.recuringDueDate);
    add(response.RecuringDueDate);
  }

  add(order?.created_at);
  add(order?.completed_at);
  return dates;
}

function addCancelCandidate(candidates: CancelCandidate[], order: any) {
  const uniqId = typeof order?.uniq_id === 'string' ? order.uniq_id.trim() : String(order?.uniq_id || '').trim();
  if (!uniqId) return;

  const recuringDueDates = getRecuringDueDatesFromOrder(order);
  const existing = candidates.find((c) => c.uniqId === uniqId);
  if (existing) {
    for (const date of recuringDueDates) {
      if (!existing.recuringDueDates.includes(date)) existing.recuringDueDates.push(date);
    }
    return;
  }

  candidates.push({ uniqId, recuringDueDates });
}

function isTakbullCancelSuccess(payload: any): boolean {
  const code =
    payload?.InternalCode ??
    payload?.internalCode ??
    payload?.responseCode ??
    payload?.statusCode;
  if (typeof code === 'number') return code === 0;
  if (typeof code === 'string') return code === '0' || code.toLowerCase() === 'success';
  if (typeof payload?.Status === 'number') return payload.Status === 1;
  if (typeof payload?.Status === 'string') return payload.Status.toLowerCase() === 'approved' || payload.Status.toLowerCase() === 'success';
  return payload?.ok === true || payload?.success === true;
}

function buildCancelSubscriptionUrl(uniqId: string, recuringDueDate?: string | null, includeQueryAuth = false): string {
  const params = new URLSearchParams({ uniqId });
  if (recuringDueDate) params.set('RecuringDueDate', recuringDueDate);
  if (includeQueryAuth) {
    params.set('API_Key', takbullApiKey);
    params.set('API_Secret', takbullApiSecret);
  }
  return `https://api.takbull.co.il/api/ExtranalAPI/CancelSubscription?${params.toString()}`;
}

async function callTakbullCancelSubscription(
  uniqId: string,
  recuringDueDates: string[],
): Promise<{ ok: boolean; details?: string }> {
  if (!takbullApiKey || !takbullApiSecret) {
    return { ok: false, details: 'Missing TAKBULL_API_KEY/TAKBULL_API_SECRET' };
  }

  const headers = {
    Accept: 'application/json',
    API_Key: takbullApiKey,
    API_Secret: takbullApiSecret,
  };

  const dueDatesToTry = recuringDueDates.length > 0 ? recuringDueDates : [null];
  let lastDetails: string | undefined;

  for (const recuringDueDate of dueDatesToTry) {
    for (const includeQueryAuth of [false, true]) {
      try {
        const url = buildCancelSubscriptionUrl(uniqId, recuringDueDate, includeQueryAuth);
        const response = await fetch(url, {
          method: 'GET',
          headers: includeQueryAuth ? { Accept: 'application/json' } : headers,
        });
        const raw = await response.text();
        let parsed: any = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
        if (response.ok && isTakbullCancelSuccess(parsed)) return { ok: true };

        const providerMsg =
          parsed?.internalDescription ||
          parsed?.InternalDescription ||
          parsed?.message ||
          raw?.slice(0, 200);
        lastDetails = `CancelSubscription rejected: ${providerMsg}`;
        console.warn('Takbull CancelSubscription GET failed', {
          uniqId,
          recuringDueDate,
          includeQueryAuth,
          status: response.status,
          body: raw?.slice(0, 500),
        });
      } catch (e) {
        console.warn('Takbull CancelSubscription GET error', { uniqId, recuringDueDate, includeQueryAuth, e });
        lastDetails = 'Network error while calling Takbull CancelSubscription API';
      }
    }
  }

  return { ok: false, details: lastDetails || 'Takbull CancelSubscription failed' };
}

﻿// --- Viral share API (bundled; imported by subscription.ts) ---
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.shareAction) {
    return handleShareApi(req, res);
  }

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = typeof req.body?.action === 'string' ? req.body.action : null;

  if (req.method === 'GET') {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'לא מאומת' });
      const admin = getSupabaseAdmin();
      let sub: any = null;
      const modernResult = await admin
        .from('subscriptions')
        .select('id, status, subscription_status, auto_renew, current_period_start, current_period_end, plan, start_date, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (modernResult.error && !isMissingColumnError(modernResult.error)) {
        console.error('Subscription status error:', modernResult.error);
        return res.status(500).json({ error: 'שגיאה בקבלת סטטוס מנוי' });
      }

      if (modernResult.error && isMissingColumnError(modernResult.error)) {
        // Backward compatibility for DBs that did not run the newer subscription migration yet.
        const legacyResult = await admin
          .from('subscriptions')
          .select('id, status, plan, start_date, end_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (legacyResult.error) {
          console.error('Subscription status legacy error:', legacyResult.error);
          return res.status(500).json({ error: 'שגיאה בקבלת סטטוס מנוי' });
        }
        sub = legacyResult.data;
      } else {
        sub = modernResult.data;
      }

      const subscription_status = (sub as any)?.subscription_status ?? (sub?.status === 'cancelled' ? 'canceled' : sub?.status === 'active' ? 'active' : 'expired');
      const auto_renew = (sub as any)?.auto_renew ?? (sub?.status === 'active');
      const current_period_end = (sub as any)?.current_period_end ?? sub?.end_date ?? null;
      return res.status(200).json({
        subscription_status,
        auto_renew: !!auto_renew,
        current_period_end: current_period_end || null,
        plan: (sub as any)?.plan ?? null,
      });
    } catch (e) {
      console.error('Subscription status:', e);
      const configErr = getConfigErrorResponse(e);
      if (configErr) return res.status(configErr.status).json({ error: configErr.error });
      return res.status(500).json({ error: 'שגיאת שרת' });
    }
  }

  if (req.method === 'POST' && action === 'downgrade-expired') {
    const auth = req.headers.authorization;
    const secret = auth?.startsWith('Bearer ') ? auth.slice(7) : (req.body?.secret ?? req.query?.secret);
    if (CRON_SECRET && secret !== CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const admin = getSupabaseAdmin();
      const now = new Date().toISOString();
      const { data: subs, error: fetchErr } = await admin
        .from('subscriptions')
        .select('id, user_id, plan, subscription_status, current_period_end, end_date, usage_quota_used, usage_quota_total')
        .neq('plan', 'free')
        .in('subscription_status', ['active', 'paused']);
      if (fetchErr) {
        console.error('downgrade-expired fetch error:', fetchErr);
        return res.status(500).json({ error: 'Database error' });
      }
      const toExpire: { id: string; user_id: string }[] = [];
      for (const s of subs || []) {
        const row = s as any;
        const periodEnd = row.current_period_end || row.end_date;
        const quotaOk = row.usage_quota_total == null || row.usage_quota_total <= 0 || (row.usage_quota_used || 0) < row.usage_quota_total;
        const periodOk = !periodEnd || new Date(periodEnd) > new Date();
        if (!quotaOk || !periodOk) toExpire.push({ id: row.id, user_id: row.user_id });
      }
      for (const { id, user_id } of toExpire) {
        await admin.from('subscriptions').update({
          plan: 'free',
          subscription_status: 'expired',
          status: 'expired',
          auto_renew: false,
          expired_at: now,
          updated_at: now,
        } as any).eq('id', id);
        await admin.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          updated_at: now,
        }).eq('user_id', user_id);
        await logEvent(admin, user_id, 'expire', { subscription_id: id });
      }
      return res.status(200).json({ ok: true, downgraded: toExpire.length });
    } catch (e) {
      console.error('downgrade-expired:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST' && action === 'cancel') {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'לא מאומת' });
      const admin = getSupabaseAdmin();

      let sub: any = null;
      const modernSubResult = await admin
        .from('subscriptions')
        .select('id, status, subscription_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (modernSubResult.error && !isMissingColumnError(modernSubResult.error)) {
        console.error('Cancel fetch subscription error:', modernSubResult.error);
        return res.status(500).json({ error: 'שגיאה באיתור המנוי' });
      }

      if (modernSubResult.error && isMissingColumnError(modernSubResult.error)) {
        const legacySubResult = await admin
          .from('subscriptions')
          .select('id, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (legacySubResult.error) {
          console.error('Cancel fetch legacy subscription error:', legacySubResult.error);
          return res.status(500).json({ error: 'שגיאה באיתור המנוי' });
        }
        sub = legacySubResult.data;
      } else {
        sub = modernSubResult.data;
      }

      if (!sub) return res.status(400).json({ error: 'לא נמצא מנוי פעיל' });

      const subAny = sub as any;
      const effectiveStatus = subAny.subscription_status ?? (subAny.status === 'cancelled' ? 'canceled' : subAny.status);
      if (effectiveStatus === 'canceled') return res.status(200).json({ ok: true, message: 'המנוי כבר בוטל' });

      // Build cancel candidates from original initiate-order uniqId + RecuringDueDate (purchase date).
      const cancelCandidates: CancelCandidate[] = [];
      const orderSelect = 'uniq_id, created_at, completed_at, takbull_response';

      try {
        const { data: linkedOrder } = await admin
          .from('takbull_orders')
          .select(orderSelect)
          .eq('subscription_id', sub.id)
          .not('uniq_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (linkedOrder) addCancelCandidate(cancelCandidates, linkedOrder);
      } catch (e) {
        console.warn('Error fetching linked order uniqId:', e);
      }

      try {
        const { data: paidOrders } = await admin
          .from('takbull_orders')
          .select(orderSelect)
          .eq('user_id', user.id)
          .eq('payment_status', 'paid')
          .eq('order_status', 'completed')
          .not('uniq_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(3);
        (paidOrders || []).forEach((order) => addCancelCandidate(cancelCandidates, order));
      } catch (e) {
        console.warn('Error fetching paid/completed order uniqIds:', e);
      }

      try {
        const { data: latestOrders } = await admin
          .from('takbull_orders')
          .select(orderSelect)
          .eq('user_id', user.id)
          .not('uniq_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);
        (latestOrders || []).forEach((order) => addCancelCandidate(cancelCandidates, order));
      } catch (e) {
        console.warn('Error fetching recent order uniqIds:', e);
      }

      if (cancelCandidates.length === 0) {
        return res.status(500).json({ error: 'לא נמצא מזהה חיוב מול Takbull, לא ניתן לבצע ביטול מסונכרן כרגע' });
      }

      let takbullCanceled = false;
      let takbullResult: { ok: boolean; details?: string } = { ok: false };
      let usedUniqId: string | null = null;
      let usedRecuringDueDate: string | null = null;
      for (const candidate of cancelCandidates) {
        const result = await callTakbullCancelSubscription(candidate.uniqId, candidate.recuringDueDates);
        if (result.ok) {
          takbullCanceled = true;
          takbullResult = result;
          usedUniqId = candidate.uniqId;
          usedRecuringDueDate = candidate.recuringDueDates[0] || null;
          break;
        }
        takbullResult = result;
      }

      if (!takbullCanceled) {
        return res.status(502).json({ error: `ביטול המנוי מול Takbull נכשל. לא בוצע שינוי מקומי כדי למנוע חוסר סנכרון.${takbullResult.details ? ` (${takbullResult.details})` : ''}` });
      }

      const now = new Date().toISOString();
      // IMPORTANT: Do NOT disable access immediately. We only turn off auto_renew and
      // record canceled_at. The subscription remains active until the end of the
      // current billing period, and the nightly cron (downgrade-expired) handles
      // moving the user to the free tier when the period ends.
      const cancelUpdate = {
        auto_renew: false,
        subscription_status: 'canceled',
        status: 'cancelled',
        canceled_at: now,
        updated_at: now,
      } as any;
      const cancelResult = await admin.from('subscriptions').update(cancelUpdate).eq('id', sub.id);
      if (cancelResult.error && isMissingColumnError(cancelResult.error)) {
        // Legacy schema fallback: keep old fields only.
        const legacyCancelResult = await admin
          .from('subscriptions')
          .update({
            updated_at: now,
          } as any)
          .eq('id', sub.id);
        if (legacyCancelResult.error) {
          console.error('Legacy cancel update error:', legacyCancelResult.error);
          return res.status(500).json({ error: 'שגיאה בעדכון מצב המנוי' });
        }
      } else if (cancelResult.error) {
        console.error('Cancel update error:', cancelResult.error);
        return res.status(500).json({ error: 'שגיאה בעדכון מצב המנוי' });
      }
      await logEvent(admin, user.id, 'cancel', {
        subscription_id: sub.id,
        uniqId: usedUniqId,
        recuringDueDate: usedRecuringDueDate,
      });
      // Keep profile.subscription_status as-is (typically 'active') so the user
      // continues to have access until the period end.
      await admin.from('profiles').update({ updated_at: now }).eq('user_id', user.id);
      const { email: emailCancel, lang: langCancel } = await getEmailAndLangForUser(admin, user.id);
      if (emailCancel) await sendSubscriptionActionEmail(emailCancel, 'cancel', langCancel);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Subscription action error:', e);
      const configErr = getConfigErrorResponse(e);
      if (configErr) return res.status(configErr.status).json({ error: configErr.error });
      return res.status(500).json({ error: 'שגיאת שרת' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
