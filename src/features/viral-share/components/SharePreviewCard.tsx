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
  showHeading?: boolean;
  /** decorative = preview only (no navigation); link = clickable CTA */
  ctaMode?: 'decorative' | 'link';
  ctaHref?: string;
  ctaTarget?: '_blank' | '_self';
  /** Public share pages use stored row language, not app UI language. */
  locale?: ShareLocale;
}

export const SharePreviewCard: React.FC<SharePreviewCardProps> = ({
  data,
  creatorName,
  creatorType,
  showIdentity,
  showHeading = true,
  ctaMode = 'decorative',
  ctaHref = SHARE_CTA_URL,
  ctaTarget = '_self',
  locale,
}) => {
  const s = getShareStrings(locale);
  const creatorTypeLabel = getCreatorTypeLabel(creatorType, locale);

  return (
    <>
      {showHeading && <SectionHeading>{s.previewTitle}</SectionHeading>}
      <PreviewCard>
        <PreviewLogo src="/Logo.png" alt="VIRALY" decoding="async" />
        {showIdentity && creatorName?.trim() && (
          <PreviewCreatorName>{creatorName.trim()}</PreviewCreatorName>
        )}
        {showIdentity && (
          <PreviewCreatorType>{creatorTypeLabel}</PreviewCreatorType>
        )}
        <PreviewScore>{data.viralScore}%</PreviewScore>
        <PreviewScoreLabel>{s.viralScoreLabel}</PreviewScoreLabel>
        <PreviewScoreRule aria-hidden />
        <SectionHeading style={{ fontSize: '0.85rem', marginBottom: 10 }}>
          {s.metricsTitle}
        </SectionHeading>
        <PreviewMetrics>
          {data.metrics.map((m, i) => (
            <PreviewMetricItem key={i}>{m}</PreviewMetricItem>
          ))}
        </PreviewMetrics>
        <SectionHeading style={{ fontSize: '0.8rem', marginBottom: 8 }}>
          {s.insightTitle}
        </SectionHeading>
        <PreviewInsight>"{data.insight}"</PreviewInsight>
        {ctaMode === 'link' ? (
          <PreviewCta
            href={ctaHref}
            target={ctaTarget}
            rel={ctaTarget === '_blank' ? 'noopener noreferrer' : undefined}
          >
            {s.cta}
          </PreviewCta>
        ) : (
          <PreviewCta as="span" $decorative aria-hidden>
            {s.cta}
          </PreviewCta>
        )}
      </PreviewCard>
    </>
  );
};
