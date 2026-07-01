import React, { useRef } from 'react';
import {
  ShareModalBody,
  ShareModalClose,
  ShareModalFooter,
  ShareModalHeader,
  ShareModalOverlay,
  ShareModalPanel,
  ShareModalSubtitle,
  ShareModalTitle,
  SharePrimaryBtn,
  ShareSecondaryBtn,
} from '../styles/viralShareStyles';
import { getShareStrings, isShareRtl } from '../i18n';
import { ShareConsentSection } from './ShareConsentSection';
import { CreatorIdentitySection } from './CreatorTypePicker';
import { SharePreviewCard } from './SharePreviewCard';
import { ShareActions } from './ShareActions';
import { resolveShareCtaUrl } from '../utils/resolveShareCtaUrl';
import type { CreatorTypeKey, SharePreviewData, ViralShareStep } from '../types';
import type { TrackId } from '../../../types';

interface ViralShareModalProps {
  isOpen: boolean;
  step: ViralShareStep;
  consentAccepted: boolean;
  onConsentChange: (v: boolean) => void;
  includeCreatorName: boolean;
  onIncludeCreatorNameChange: (v: boolean) => void;
  creatorDisplayName: string;
  onCreatorDisplayNameChange: (v: string) => void;
  creatorType: CreatorTypeKey;
  onCreatorTypeChange: (v: CreatorTypeKey) => void;
  payload: SharePreviewData;
  suggestedCreatorName?: string;
  trackId: TrackId;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const ViralShareModal: React.FC<ViralShareModalProps> = ({
  isOpen,
  step,
  consentAccepted,
  onConsentChange,
  includeCreatorName,
  onIncludeCreatorNameChange,
  creatorDisplayName,
  onCreatorDisplayNameChange,
  creatorType,
  onCreatorTypeChange,
  payload,
  suggestedCreatorName,
  trackId,
  onClose,
  onNext,
  onBack,
}) => {
  const s = getShareStrings();
  const rtl = isShareRtl();
  const previewCardRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <ShareModalOverlay
      $isOpen={isOpen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viral-share-title"
      onClick={handleOverlayClick}
    >
      <ShareModalPanel dir={rtl ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
        <ShareModalClose type="button" onClick={onClose} aria-label={s.close}>
          ×
        </ShareModalClose>
        <ShareModalHeader>
          <ShareModalTitle id="viral-share-title">{s.modalTitle}</ShareModalTitle>
          <ShareModalSubtitle>{s.modalSubtitle}</ShareModalSubtitle>
        </ShareModalHeader>

        <ShareModalBody>
          {step === 'consent' && (
            <ShareConsentSection accepted={consentAccepted} onChange={onConsentChange} />
          )}

          {step === 'identity' && (
            <CreatorIdentitySection
              includeName={includeCreatorName}
              onIncludeNameChange={onIncludeCreatorNameChange}
              creatorDisplayName={creatorDisplayName}
              onCreatorDisplayNameChange={onCreatorDisplayNameChange}
              suggestedCreatorName={suggestedCreatorName}
              creatorType={creatorType}
              onCreatorTypeChange={onCreatorTypeChange}
            />
          )}

          {(step === 'preview' || step === 'share') && (
            <SharePreviewCard
              ref={previewCardRef}
              data={payload}
              creatorName={creatorDisplayName}
              creatorType={creatorType}
              showIdentity={includeCreatorName}
              showCreatorType
              showHeading={step === 'preview'}
              ctaMode="link"
              ctaHref={resolveShareCtaUrl()}
              ctaTarget="_blank"
            />
          )}

          {step === 'share' && (
            <ShareActions
              previewCardRef={previewCardRef}
              payload={payload}
              includeCreatorName={includeCreatorName}
              creatorDisplayName={creatorDisplayName}
              creatorType={creatorType}
              trackId={trackId}
            />
          )}
        </ShareModalBody>

        <ShareModalFooter>
          {step !== 'consent' && (
            <ShareSecondaryBtn type="button" onClick={onBack}>
              {s.back}
            </ShareSecondaryBtn>
          )}
          {step === 'consent' && (
            <SharePrimaryBtn type="button" disabled={!consentAccepted} onClick={onNext}>
              {s.continue}
            </SharePrimaryBtn>
          )}
          {step === 'identity' && (
            <SharePrimaryBtn type="button" onClick={onNext}>
              {s.continue}
            </SharePrimaryBtn>
          )}
          {step === 'preview' && (
            <SharePrimaryBtn type="button" onClick={onNext}>
              {s.shareSectionTitle}
            </SharePrimaryBtn>
          )}
          {step === 'share' && (
            <SharePrimaryBtn type="button" onClick={onClose}>
              {s.close}
            </SharePrimaryBtn>
          )}
        </ShareModalFooter>
      </ShareModalPanel>
    </ShareModalOverlay>
  );
};
