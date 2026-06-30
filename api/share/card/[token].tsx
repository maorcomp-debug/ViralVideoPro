import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';
import {
  resolveCreatorTypeLabel,
  SHARE_PUBLIC_COPY,
  sharePublicLocale,
} from '../../../src/features/viral-share/i18n/creatorTypeLabels';

export const config = { runtime: 'edge' };

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://fonts.gstatic.com/s/assistant/v19/2sDcZGJYnIjSi6H75xkzamW5Kb3VaUeZRFtX.ttf'
  );
  if (!res.ok) throw new Error('Font load failed');
  return res.arrayBuffer();
}

function isAvailable(row: { is_active: boolean; expires_at: string | null }) {
  if (!row.is_active) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const token = decodeURIComponent(url.pathname.split('/').pop() || '');

  if (!token || token.length > 64 || !supabaseUrl || !serviceKey) {
    return new Response('Not found', { status: 404 });
  }

  let fontData: ArrayBuffer;
  try {
    fontData = await loadFont();
  } catch {
    return new Response('Font error', { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin
    .from('share_reports')
    .select('viral_score, ai_insight, creator_name, creator_type, language, is_active, expires_at')
    .eq('public_token', token)
    .maybeSingle();

  if (!data || !isAvailable(data)) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #050505, #1a1208)',
            fontFamily: 'Assistant',
            color: '#D4A043',
            fontSize: 36,
          }}
        >
          VIRALY
        </div>
      ),
      { width: 1200, height: 630, fonts: [{ name: 'Assistant', data: fontData, weight: 400 }] }
    );
  }

  const insight =
    data.ai_insight.length > 90 ? `${data.ai_insight.slice(0, 89)}…` : data.ai_insight;
  const locale = sharePublicLocale(data.language);
  const copy = SHARE_PUBLIC_COPY[locale];
  const creatorTypeLabel = resolveCreatorTypeLabel(data.creator_type, locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1a1208 0%, #050505 45%, #0a0a0a 100%)',
          fontFamily: 'Assistant',
          padding: 48,
          direction: copy.dir,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '2px solid rgba(212,160,67,0.45)',
            borderRadius: 32,
            padding: '40px 56px',
            background: 'linear-gradient(145deg, rgba(212,160,67,0.14), rgba(10,10,10,0.92))',
            boxShadow: '0 0 60px rgba(212,160,67,0.25)',
            maxWidth: 1000,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 28, color: '#D4A043', marginBottom: 8, fontWeight: 700 }}>
            VIRALY
          </div>
          {data.creator_name ? (
            <div style={{ fontSize: 32, color: '#fff', fontWeight: 700, marginBottom: 4 }}>
              {data.creator_name}
            </div>
          ) : null}
          {creatorTypeLabel ? (
            <div style={{ fontSize: 22, color: '#e6be74', marginBottom: 16 }}>{creatorTypeLabel}</div>
          ) : null}
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
              textShadow: '0 0 40px rgba(212,160,67,0.5)',
            }}
          >
            {data.viral_score}%
          </div>
          <div style={{ fontSize: 24, color: '#D4A043', letterSpacing: 2, marginTop: 8 }}>
            {copy.viralScoreLabel}
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#f0f0f0',
              marginTop: 24,
              textAlign: 'center',
              lineHeight: 1.4,
              fontStyle: 'italic',
              maxWidth: 900,
            }}
          >
            &ldquo;{insight}&rdquo;
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 22,
              fontWeight: 700,
              color: '#1a1008',
              background: 'linear-gradient(135deg, #b8862e, #e6be74)',
              padding: '12px 32px',
              borderRadius: 40,
            }}
          >
            {copy.cta}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Assistant', data: fontData, weight: 400 }],
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
