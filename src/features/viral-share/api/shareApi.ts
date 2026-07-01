import { supabase } from '../../../lib/supabase';
import { getShareLocale, getShareStrings } from '../i18n';
import type { CreatorTypeKey, SharePreviewData } from '../types';

export interface CreateShareLinkInput {
  payload: SharePreviewData;
  includeCreatorName: boolean;
  creatorName?: string;
  creatorType: CreatorTypeKey;
  trackId?: string;
}

export async function createShareLink(
  input: CreateShareLinkInput
): Promise<{ url: string; token: string }> {
  const s = getShareStrings();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error(s.authRequired);
  }

  const res = await fetch('/api/subscription?shareAction=create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      viralScore: input.payload.viralScore,
      metrics: input.payload.metrics,
      aiInsight: input.payload.insight,
      includeCreatorName: input.includeCreatorName,
      creatorName: input.includeCreatorName ? input.creatorName : undefined,
      creatorType: input.creatorType,
      trackId: input.trackId,
      language: getShareLocale(),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || s.linkCreateError);
  }
  return { url: json.url, token: json.token };
}

export async function deactivateShareLink(token: string): Promise<void> {
  const s = getShareStrings();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error(s.authRequiredDeactivate);
  }

  const res = await fetch(
    `/api/subscription?shareAction=deactivate&token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || s.deactivateError);
  }
}

export async function fetchPublicShare(token: string) {
  const s = getShareStrings();
  const res = await fetch(
    `/api/subscription?shareAction=public&token=${encodeURIComponent(token)}`
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error || s.unavailableShare);
  }
  return json as {
    viralScore: number;
    metrics: string[];
    aiInsight: string;
    creatorName: string | null;
    creatorType: string | null;
    language: string;
  };
}
