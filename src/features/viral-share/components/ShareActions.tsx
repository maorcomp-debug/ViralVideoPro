import React, { useEffect, useState } from 'react';

import {
  MockShareBtn,
  MockShareRow,
  SectionHeading,
  ShareLinkBox,
  ShareLinkText,
} from '../styles/viralShareStyles';

import { getShareStrings } from '../i18n';

import { createShareLink } from '../api/shareApi';

import { showAlert } from '../../../lib/alertStore';

import type { CreatorTypeKey, SharePreviewData } from '../types';

import type { TrackId } from '../../../types';

import { openInstagramShare, openSocialShare, type SocialSharePlatform } from '../utils/shareSocial';

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

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
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
    if (platform === 'instagram') {
      await openInstagramShare(shareUrl, shareMessage);
      return;
    }
    openSocialShare(platform, shareUrl, shareMessage);
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: s.shareNativeTitle,
          text: shareMessage,
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
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

  return (
    <>
      <SectionHeading>{s.shareSectionTitle}</SectionHeading>
      {shareUrl && (
        <ShareLinkBox>
          <ShareLinkText dir="ltr">{shareUrl}</ShareLinkText>
        </ShareLinkBox>
      )}
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
        <MockShareBtn type="button" onClick={handleNativeShare} disabled={!shareUrl}>
          {s.mockNative}
        </MockShareBtn>
      </MockShareRow>
    </>
  );
};
