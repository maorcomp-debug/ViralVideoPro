import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { SharePreviewCard } from './SharePreviewCard';
import { isShareRtl, type ShareLocale } from '../i18n';
import { MODAL_PREVIEW_CARD_WIDTH } from '../utils/captureStoryImage';
import type { CreatorTypeKey, SharePreviewData } from '../types';

/** Off-screen clone of the modal preview card for capture fallback. */
const CaptureRoot = styled.div`
  position: fixed;
  top: 0;
  left: -8000px;
  width: ${MODAL_PREVIEW_CARD_WIDTH}px;
  pointer-events: none;
  opacity: 0;
  z-index: -1;

  * {
    animation: none !important;
    transition: none !important;
  }
`;

export interface ShareStoryCaptureProps {
  payload: SharePreviewData;
  creatorName?: string;
  creatorType: CreatorTypeKey;
  showCreatorName: boolean;
  logoSrc: string;
  locale?: ShareLocale;
}

export const ShareStoryCapture = forwardRef<HTMLDivElement, ShareStoryCaptureProps>(
  function ShareStoryCapture(
    { payload, creatorName, creatorType, showCreatorName, logoSrc, locale },
    ref
  ) {
    const rtl = locale ? locale === 'he' : isShareRtl();

    return (
      <CaptureRoot ref={ref} dir={rtl ? 'rtl' : 'ltr'} aria-hidden>
        <SharePreviewCard
          data={payload}
          creatorName={showCreatorName ? creatorName : undefined}
          creatorType={creatorType}
          showIdentity={showCreatorName && !!creatorName?.trim()}
          showCreatorType
          showHeading={false}
          ctaMode="decorative"
          locale={locale}
          variant="modal"
          logoSrc={logoSrc}
        />
      </CaptureRoot>
    );
  }
);
