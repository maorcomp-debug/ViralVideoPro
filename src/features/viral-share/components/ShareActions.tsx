import React, { useEffect, useState } from 'react';

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

import { looksLikeEmail } from '../../../../lib/creatorDisplayName';

import { renderShareCardImage } from '../utils/renderShareCardImage';

import { openFeedShare, openQuickShare, type SocialSharePlatform } from '../utils/shareSocial';

import {
  canShareStoryImage,
  openStoryPlatformShare,
  type StoryPlatform,
} from '../utils/storySharePlatforms';

interface ShareActionsProps {
  payload: SharePreviewData;
  includeCreatorName: boolean;
  creatorDisplayName: string;
  creatorType: CreatorTypeKey;
  trackId: TrackId;
}

function shareCreatorNameForApi(include: boolean, raw?: string): string | undefined {
  if (!include) return undefined;
  const trimmed = raw?.trim();
  if (!trimmed || looksLikeEmail(trimmed)) return undefined;
  return trimmed;
}

type SocialLabelKey = 'mockWhatsApp' | 'mockTelegram' | 'mockFacebook' | 'mockInstagram' | 'mockThreads';

const SOCIAL_PLATFORMS: { id: SocialSharePlatform; labelKey: SocialLabelKey }[] = [
  { id: 'whatsapp', labelKey: 'mockWhatsApp' },
  { id: 'telegram', labelKey: 'mockTelegram' },
  { id: 'facebook', labelKey: 'mockFacebook' },
  { id: 'instagram', labelKey: 'mockInstagram' },
  { id: 'threads', labelKey: 'mockThreads' },
];

const STORY_PLATFORMS: { id: StoryPlatform; labelKey: 'storyInstagram' | 'storyFacebook' | 'storyWhatsApp' }[] = [
  { id: 'instagram', labelKey: 'storyInstagram' },
  { id: 'facebook', labelKey: 'storyFacebook' },
  { id: 'whatsapp', labelKey: 'storyWhatsApp' },
];

export const ShareActions: React.FC<ShareActionsProps> = ({
  payload,
  includeCreatorName,
  creatorDisplayName,
  creatorType,
  trackId,
}) => {
  const s = getShareStrings();
  const rtl = isShareRtl();
  const creatorNameForShare = shareCreatorNameForApi(includeCreatorName, creatorDisplayName);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [cardImage, setCardImage] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
          creatorName: creatorNameForShare,
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
  }, [payload, includeCreatorName, creatorNameForShare, creatorType, trackId, s.linkCreateError, attempt]);

  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = await renderShareCardImage({
          viralScore: payload.viralScore,
          metrics: payload.metrics,
          insight: payload.insight,
          creatorName: creatorNameForShare,
          creatorTypeLabel: getCreatorTypeLabel(creatorType),
          showCreatorName: includeCreatorName && !!creatorNameForShare,
          showCreatorType: true,
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
    creatorNameForShare,
    creatorType,
    includeCreatorName,
    s,
    rtl,
  ]);

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

  const handleFeedShare = async (platform: SocialSharePlatform) => {
    if (!shareUrl) return;
    await openFeedShare(platform, shareUrl, shareMessage);
  };

  const handleStoryPlatform = async (platform: StoryPlatform) => {
    if (!cardImage) {
      showAlert(s.storyShareUnsupported);
      return;
    }
    const result = await openStoryPlatformShare(platform, cardImage);
    if (result === 'unsupported') {
      showAlert(s.storyShareUnsupported);
    }
  };

  const handleQuickShare = async () => {
    if (!shareUrl) return;
    const result = await openQuickShare({
      shareUrl,
      message: shareMessage,
      title: s.shareNativeTitle,
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

  const storyReady = canShareStoryImage(cardImage);

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
            onClick={() => handleFeedShare(id)}
            disabled={!shareUrl}
          >
            {s[labelKey]}
          </MockShareBtn>
        ))}
      </MockShareRow>
      <SectionHeading style={{ fontSize: '0.9rem', marginTop: 8 }}>
        {s.storySectionTitle}
      </SectionHeading>
      <MockShareRow>
        {STORY_PLATFORMS.map(({ id, labelKey }) => (
          <MockShareBtn
            key={id}
            type="button"
            onClick={() => handleStoryPlatform(id)}
            disabled={!cardImage}
            style={storyReady ? { fontWeight: 700 } : undefined}
          >
            {s[labelKey]}
          </MockShareBtn>
        ))}
      </MockShareRow>
      {storyReady && (
        <SectionHeading style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: -4 }}>
          {s.storyShareHint}
        </SectionHeading>
      )}
      <MockShareRow>
        <MockShareBtn type="button" onClick={handleCopy} disabled={!shareUrl}>
          {s.mockCopy}
        </MockShareBtn>
        <MockShareBtn type="button" onClick={handleQuickShare} disabled={!shareUrl}>
          {s.mockNative}
        </MockShareBtn>
      </MockShareRow>
    </>
  );
};
