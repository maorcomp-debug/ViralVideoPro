import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { SharePreviewCard } from './SharePreviewCard';
import { getShareStrings, isShareRtl, type ShareLocale } from '../i18n';
import { SHARE_CTA_URL } from '../constants';
import { STORY_H, STORY_W } from '../utils/captureStoryImage';
import type { CreatorTypeKey, SharePreviewData } from '../types';

const CARD_STORY_W = STORY_W - 112;

const CaptureRoot = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${STORY_W}px;
  height: ${STORY_H}px;
  background: #050505;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  z-index: 2147483646;

  * {
    animation: none !important;
    transition: none !important;
  }
`;

const CardStage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${CARD_STORY_W}px;
  transform: translate(-50%, -52%);
`;

const SiteFooter = styled.div`
  position: absolute;
  bottom: 72px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Assistant', sans-serif;
  color: #e6be74;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const SiteHint = styled.div`
  margin-top: 8px;
  font-size: 20px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
`;

export interface ShareStoryCaptureProps {
  payload: SharePreviewData;
  creatorName?: string;
  creatorType: CreatorTypeKey;
  showCreatorName: boolean;
  locale?: ShareLocale;
}

export const ShareStoryCapture = forwardRef<HTMLDivElement, ShareStoryCaptureProps>(
  function ShareStoryCapture(
    { payload, creatorName, creatorType, showCreatorName, locale },
    ref
  ) {
    const rtl = locale ? locale === 'he' : isShareRtl();
    const s = getShareStrings(locale);
    const siteLabel = SHARE_CTA_URL.replace(/^https?:\/\//, '');
    const logoSrc = `${window.location.origin}/Logo.png`;

    return (
      <CaptureRoot ref={ref} dir={rtl ? 'rtl' : 'ltr'} aria-hidden>
        <CardStage>
          <SharePreviewCard
            data={payload}
            creatorName={showCreatorName ? creatorName : undefined}
            creatorType={creatorType}
            showIdentity={showCreatorName && !!creatorName?.trim()}
            showCreatorType
            showHeading={false}
            ctaMode="decorative"
            locale={locale}
            variant="story"
            logoSrc={logoSrc}
          />
        </CardStage>
        <SiteFooter>
          {siteLabel}
          <SiteHint>{s.storyTapLinkHint}</SiteHint>
        </SiteFooter>
      </CaptureRoot>
    );
  }
);
