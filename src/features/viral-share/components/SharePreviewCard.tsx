import React from 'react';
import { SHARE_CTA_URL } from '../constants';
import {
  PreviewCard,
  PreviewCreatorName,
  PreviewCreatorType,
  PreviewCta,
  PreviewInsight,
  PreviewLogo,
  PreviewMetricItem,
  PreviewMetrics,
  PreviewScore,
  PreviewScoreLabel,
  PreviewScoreRule,
  SectionHeading,
} from '../styles/viralShareStyles';
import { getCreatorTypeLabel, getShareStrings, type ShareLocale } from '../i18n';
import type { SharePreviewData, CreatorTypeKey } from '../types';

export interface SharePreviewCardProps {
  data: SharePreviewData;
  creatorName?: string;
  creatorType: CreatorTypeKey;
  showIdentity: boolean;
  /** Creator type title (שחקן, יוצר תוכן…) — always shown on share cards. */
  showCreatorType?: boolean;
  showHeading?: boolean;
  /** decorative = preview only (no navigation); link = clickable CTA */
  ctaMode?: 'decorative' | 'link';
  ctaHref?: string;
  ctaTarget?: '_blank' | '_self';
  /** Public share pages use stored row language, not app UI language. */
  locale?: ShareLocale;
  /** story = full-size card for story image capture */
  variant?: 'modal' | 'story';
  logoSrc?: string;
}

export const SharePreviewCard: React.FC<SharePreviewCardProps> = ({
  data,
  creatorName,
  creatorType,
  showIdentity,
  showCreatorType = true,
  showHeading = true,
  ctaMode = 'decorative',
  ctaHref = SHARE_CTA_URL,
  ctaTarget = '_self',
  locale,
  variant = 'modal',
  logoSrc = '/Logo.png',
}) => {
  const s = getShareStrings(locale);
  const creatorTypeLabel = getCreatorTypeLabel(creatorType, locale);
  const story = variant === 'story';

  return (
    <>
      {showHeading && <SectionHeading>{s.previewTitle}</SectionHeading>}
      <PreviewCard $story={story}>
        <PreviewLogo
          src={logoSrc}
          alt="VIRALY"
          decoding="async"
          $story={story}
        />
        {showIdentity && creatorName?.trim() && (
          <PreviewCreatorName $story={story}>{creatorName.trim()}</PreviewCreatorName>
        )}
        {showCreatorType && (
          <PreviewCreatorType $story={story}>{creatorTypeLabel}</PreviewCreatorType>
        )}
        <PreviewScore $story={story}>{data.viralScore}%</PreviewScore>
        <PreviewScoreLabel $story={story}>{s.viralScoreLabel}</PreviewScoreLabel>
        <PreviewScoreRule $story={story} aria-hidden />
        <SectionHeading
          style={{
            fontSize: story ? '1.87rem' : '0.85rem',
            marginBottom: story ? 22 : 10,
          }}
        >
          {s.metricsTitle}
        </SectionHeading>
        <PreviewMetrics $story={story}>
          {data.metrics.map((m, i) => (
            <PreviewMetricItem key={i} $story={story}>
              {m}
            </PreviewMetricItem>
          ))}
        </PreviewMetrics>
        <SectionHeading
          style={{
            fontSize: story ? '1.76rem' : '0.8rem',
            marginBottom: story ? 18 : 8,
          }}
        >
          {s.insightTitle}
        </SectionHeading>
        <PreviewInsight $story={story}>"{data.insight}"</PreviewInsight>
        {ctaMode === 'link' ? (
          <PreviewCta
            href={ctaHref}
            target={ctaTarget}
            rel={ctaTarget === '_blank' ? 'noopener noreferrer' : undefined}
            $story={story}
          >
            {s.cta}
          </PreviewCta>
        ) : (
          <PreviewCta as="span" $decorative $story={story} aria-hidden>
            {s.cta}
          </PreviewCta>
        )}
      </PreviewCard>
    </>
  );
};
