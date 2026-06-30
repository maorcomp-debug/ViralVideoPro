import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPublicShare } from '../features/viral-share/api/shareApi';
import { SharePreviewCard } from '../features/viral-share/components/SharePreviewCard';
import {
  PublicPageWrap,
  PublicUnavailable,
  SharePrimaryBtn,
} from '../features/viral-share/styles/viralShareStyles';
import {
  getShareStrings,
  isShareRtl,
  normalizeCreatorTypeKey,
  type ShareLocale,
} from '../features/viral-share/i18n';
import { resolveShareCtaUrl } from '../features/viral-share/utils/resolveShareCtaUrl';
import type { SharePreviewData, CreatorTypeKey } from '../features/viral-share/types';

export const SharePublicPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [shareLocale, setShareLocale] = useState<ShareLocale>('he');
  const [data, setData] = useState<SharePreviewData | null>(null);
  const [creatorName, setCreatorName] = useState<string | undefined>();
  const [creatorType, setCreatorType] = useState<CreatorTypeKey | undefined>();
  const [showIdentity, setShowIdentity] = useState(false);

  const s = getShareStrings(shareLocale);
  const rtl = isShareRtl(shareLocale);

  useEffect(() => {
    if (!token) {
      setUnavailable(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchPublicShare(token);
        if (cancelled) return;
        const locale: ShareLocale = row.language === 'en' ? 'en' : 'he';
        const strings = getShareStrings(locale);
        const typeKey =
          normalizeCreatorTypeKey(row.creatorType) ?? 'content_creator';
        setShareLocale(locale);
        setData({
          viralScore: row.viralScore,
          metrics: [
            row.metrics[0] || strings.metricFallbacks[0],
            row.metrics[1] || strings.metricFallbacks[1],
            row.metrics[2] || strings.metricFallbacks[2],
          ],
          insight: row.aiInsight,
          creatorType: typeKey,
        });
        setShowIdentity(!!row.creatorName);
        setCreatorName(row.creatorName || undefined);
        setCreatorType(typeKey);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <PublicPageWrap dir="rtl">
        <PublicUnavailable>{getShareStrings().creatingLink}</PublicUnavailable>
      </PublicPageWrap>
    );
  }

  if (unavailable || !data) {
    return (
      <PublicPageWrap dir={rtl ? 'rtl' : 'ltr'}>
        <div style={{ textAlign: 'center' }}>
          <PublicUnavailable>{s.publicUnavailable}</PublicUnavailable>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <SharePrimaryBtn as="span" style={{ display: 'inline-block', marginTop: 20 }}>
              {s.publicBackHome}
            </SharePrimaryBtn>
          </Link>
        </div>
      </PublicPageWrap>
    );
  }

  return (
    <PublicPageWrap dir={rtl ? 'rtl' : 'ltr'}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <SharePreviewCard
          data={data}
          creatorName={creatorName}
          creatorType={creatorType || data.creatorType}
          showIdentity={showIdentity}
          showHeading={false}
          ctaMode="link"
          ctaHref={resolveShareCtaUrl()}
          ctaTarget="_blank"
          locale={shareLocale}
        />
      </div>
    </PublicPageWrap>
  );
};
