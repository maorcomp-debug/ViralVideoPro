import type { VercelRequest } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  isCreatorTypeKey,
  resolveCreatorTypeLabel,
  SHARE_PUBLIC_COPY,
  sharePublicLocale,
} from '../lib/shareCreatorTypes';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const APP_BASE_URL =
  (process.env.VITE_APP_URL || process.env.APP_URL || 'https://viraly.co.il').replace(/\/$/, '');

export interface PublicShareRecord {
  viral_score: number;
  metrics: string[];
  ai_insight: string;
  creator_name: string | null;
  creator_type: string | null;
  language: string;
  is_active: boolean;
  expires_at: string | null;
}

export interface CreateShareBody {
  viralScore: number;
  metrics: [string, string, string];
  aiInsight: string;
  includeCreatorName: boolean;
  creatorName?: string;
  creatorType?: string;
  trackId?: string;
  language?: string;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function getUserFromRequest(req: VercelRequest): Promise<{ id: string } | null> {
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

export function generatePublicToken(): string {
  return randomBytes(24).toString('base64url');
}

function truncate(text: string, max: number): string {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function sanitizeCreateBody(raw: unknown): CreateShareBody | null {
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

export function isShareAvailable(row: {
  is_active: boolean;
  expires_at: string | null;
}): boolean {
  if (!row.is_active) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}

export function toPublicPayload(row: PublicShareRecord) {
  return {
    viralScore: row.viral_score,
    metrics: row.metrics.slice(0, 3),
    aiInsight: row.ai_insight,
    creatorName: row.creator_name,
    creatorType: row.creator_type,
    language: row.language,
  };
}

export async function fetchShareByToken(
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
export function resolveSharePublicUrl(): string {
  return APP_BASE_URL;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderShareHtmlPage(
  token: string,
  row: PublicShareRecord | null,
  unavailable: boolean
): string {
  const base = APP_BASE_URL;
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
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
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
    <p>${escapeHtml(copy.unavailable)}</p>
    <p><a href="${base}">${escapeHtml(copy.backHome)}</a></p>
  </div>
</body>
</html>`;
  }

  const locale = sharePublicLocale(row.language);
  const copy = SHARE_PUBLIC_COPY[locale];
  const payload = toPublicPayload(row);
  const title = copy.titleSuffix(payload.viralScore);
  const desc = escapeHtml(payload.aiInsight);
  const nameBlock = payload.creatorName
    ? `<div class="name">${escapeHtml(payload.creatorName)}</div>`
    : '';
  const creatorTypeLabel = resolveCreatorTypeLabel(payload.creatorType, locale);
  const typeBlock = creatorTypeLabel
    ? `<div class="type">${escapeHtml(creatorTypeLabel)}</div>`
    : '';
  const metricsHtml = payload.metrics
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join('');
  const listAlign = locale === 'en' ? 'left' : 'right';
  const insightBorder = locale === 'en' ? 'border-left' : 'border-right';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${copy.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${cardImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${copy.ogLocale}" />
  <meta property="og:site_name" content="VIRALY" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
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
    <div class="score-label">${escapeHtml(copy.viralScoreLabel)}</div>
    <ul>${metricsHtml}</ul>
    <div class="insight">"${desc}"</div>
    <a class="cta" href="${base}">${escapeHtml(copy.cta)}</a>
  </div>
</body>
</html>`;
}
