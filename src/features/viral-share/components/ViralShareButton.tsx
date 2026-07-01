import React from 'react';
import {
  ShareActionButton,
  ShareButtonSubtitle,
  ShareButtonText,
  ShareButtonTitle,
  ShareCrownSvg,
  ShareHexagon,
  ShareHexIconWrap,
  ShareSparkle,
} from '../styles/viralShareStyles';
import { getShareStrings } from '../i18n';

interface ViralShareButtonProps {
  onClick: () => void;
}

export const ViralShareButton: React.FC<ViralShareButtonProps> = ({ onClick }) => {
  const s = getShareStrings();

  return (
    <ShareActionButton type="button" onClick={onClick} aria-label={s.buttonAria} data-viral-share-button>
      <ShareButtonText>
        <ShareButtonTitle>{s.buttonPrimary}</ShareButtonTitle>
        <ShareButtonSubtitle>{s.buttonSubtitle}</ShareButtonSubtitle>
      </ShareButtonText>
      <ShareHexIconWrap aria-hidden>
        <ShareSparkle $top="2px" $left="2px" $size="5px">
          ✦
        </ShareSparkle>
        <ShareSparkle $top="5px" $left="26px" $size="4px">
          ✦
        </ShareSparkle>
        <ShareSparkle $top="24px" $left="4px" $size="4px">
          ✦
        </ShareSparkle>
        <ShareHexagon />
        <ShareCrownSvg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18h16v2H4v-2zm1.5-9 2.8 4.5L12 6.5l3.7 6.5 2.8-4.5L19 18H5l.5-9z" />
        </ShareCrownSvg>
      </ShareHexIconWrap>
    </ShareActionButton>
  );
};
