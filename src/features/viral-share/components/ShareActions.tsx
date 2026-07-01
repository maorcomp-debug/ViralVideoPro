import React, { useEffect, useRef, useState } from 'react';

import {
  MockShareBtn,
  MockShareRow,
  SectionHeading,
  ShareLinkBox,
  ShareLinkText,
} from '../styles/viralShareStyles';

import { getCreatorTypeLabel, getShareStrings, isShareRtl } from '../i18n';

import { createShareLink } from '../api/shareApi';

import { showAlert } from '../../../lib/alertStore';

import type { CreatorTypeKey, SharePreviewData } from '../types';

import type { TrackId } from '../../../types';

import { renderShareCardImage } from '../utils/renderShareCardImage';

import {
  openSocialShare,
  openStoryCapableShare,
  supportsStoryShare,
  type SocialSharePlatform,
} from '../utils/shareSocial';

interface ShareActionsProps {
  payload: SharePreviewData;
  includeCreatorName: boolean;
  suggestedCreatorName?: string;
  creatorType: CreatorTypeKey;
  trackId: TrackId;
}

type SocialLabelKey = 'mockWhatsApp' | 'mockTelegram' | 'mockFacebook' | 'mockInstagram' | 'mockThreads';

const SOCIAL_PLATFORMS: { id: SocialSharePlatform; labelKey: SocialLabelKey }[] = [
  { id: 'whatsapp', labelKey: 'mockWhatsApp' },
  { id: 'telegram', labelKey: 'mockTelegram' },
  { id: 'facebook', labelKey: 'mockFacebook' },
  { id: 'instagram', labelKey: 'mockInstagram' },
  { id: 'threads', labelKey: 'mockThreads' },
];

export const ShareActions: React.FC<ShareActionsProps> = ({
  payload,
  includeCreatorName,
  suggestedCreatorName,
  creatorType,
  trackId,
}) => {
  const s = getShareStrings();
  const rtl = isShareRtl();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [cardImage, setCardImage] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const autoStoryOpened = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setCardImage(null);
        const { url } = await createShareLink({
          payload,
          includeCreatorName,
          creatorName: suggestedCreatorName,
          creatorType,
          trackId,
        });
        if (!cancelled) setShareUrl(url);
      } catch (e) {
        if (!cancelled) {
          setShareUrl(null);
          setError(e instanceof Error ? e.message : s.linkCreateError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload, includeCreatorName, suggestedCreatorName, creatorType, trackId, s.linkCreateError, attempt]);

  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = await renderShareCardImage({
          viralScore: payload.viralScore,
          metrics: payload.metrics,
          insight: payload.insight,
          creatorName: suggestedCreatorName,
          creatorTypeLabel: getCreatorTypeLabel(creatorType),
          showIdentity: includeCreatorName,
          strings: s,
          rtl,
        });
        if (!cancelled) setCardImage(blob);
      } catch {
        if (!cancelled) setCardImage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    shareUrl,
    payload,
    suggestedCreatorName,
    creatorType,
    includeCreatorName,
    s,
    rtl,
  ]);

  useEffect(() => {
    if (!shareUrl || !cardImage || autoStoryOpened.current) return;
    if (!supportsStoryShare(cardImage)) return;

    autoStoryOpened.current = true;
    void openStoryCapableShare({
      shareUrl,
      message: s.shareWhatsAppText,
      title: s.shareNativeTitle,
      imageBlob: cardImage,
    });
  }, [shareUrl, cardImage, s.shareWhatsAppText, s.shareNativeTitle]);

  const shareMessage = s.shareWhatsAppText;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAlert(s.linkCopied);
    } catch {
      showAlert(shareUrl);
    }
  };

  const handleSocial = async (platform: SocialSharePlatform) => {
    if (!shareUrl) return;
    await openSocialShare(platform, shareUrl, shareMessage, {
      imageBlob: cardImage,
      title: s.shareNativeTitle,
    });
  };

  const handleStoryShare = async () => {
    if (!shareUrl) return;
    const result = await openStoryCapableShare({
      shareUrl,
      message: shareMessage,
      title: s.shareNativeTitle,
      imageBlob: cardImage,
    });
    if (result === 'unsupported') {
      handleCopy();
    }
  };

  if (loading) {
    return <SectionHeading>{s.creatingLink}</SectionHeading>;
  }

  if (error) {
    return (
      <>
        <SectionHeading style={{ color: '#ff8a80' }}>{error}</SectionHeading>
        <MockShareRow>
          <MockShareBtn type="button" onClick={() => setAttempt((n) => n + 1)}>
            {s.linkRetry}
          </MockShareBtn>
        </MockShareRow>
      </>
    );
  }

  const storyReady = supportsStoryShare(cardImage);

  return (
    <>
      <SectionHeading>{s.shareSectionTitle}</SectionHeading>
      {storyReady && (
        <SectionHeading style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: -4 }}>
          {s.storyShareHint}
        </SectionHeading>
      )}
      {shareUrl && (
        <ShareLinkBox>
          <ShareLinkText dir="ltr">{shareUrl}</ShareLinkText>
        </ShareLinkBox>
      )}
      <MockShareRow>
        <MockShareBtn
          type="button"
          onClick={handleStoryShare}
          disabled={!shareUrl}
          style={storyReady ? { fontWeight: 700 } : undefined}
        >
          {s.mockStoryShare}
        </MockShareBtn>
      </MockShareRow>
      <MockShareRow>
        {SOCIAL_PLATFORMS.map(({ id, labelKey }) => (
          <MockShareBtn
            key={id}
            type="button"
            onClick={() => handleSocial(id)}
            disabled={!shareUrl}
          >
            {s[labelKey]}
          </MockShareBtn>
        ))}
      </MockShareRow>
      <MockShareRow>
        <MockShareBtn type="button" onClick={handleCopy} disabled={!shareUrl}>
          {s.mockCopy}
        </MockShareBtn>
        <MockShareBtn type="button" onClick={handleStoryShare} disabled={!shareUrl}>
          {s.mockNative}
        </MockShareBtn>
      </MockShareRow>
    </>
  );
};
