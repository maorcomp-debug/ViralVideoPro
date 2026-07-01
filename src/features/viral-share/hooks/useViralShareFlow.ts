import { useCallback, useMemo, useState } from 'react';
import type { AnalysisResult, TrackId } from '../../../types';
import { mapTrackToCreatorType } from '../constants';
import { buildSharePayload } from '../utils/buildSharePayload';
import type { CreatorTypeKey, SharePreviewData, ViralShareStep } from '../types';

function lightHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    /* optional */
  }
}

export function useViralShareFlow(
  score: number,
  trackId: TrackId,
  result: AnalysisResult,
  suggestedCreatorName?: string
) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ViralShareStep>('consent');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [includeCreatorName, setIncludeCreatorName] = useState(true);
  const [creatorDisplayName, setCreatorDisplayName] = useState('');
  const [creatorType, setCreatorType] = useState<CreatorTypeKey>(() =>
    mapTrackToCreatorType(trackId)
  );

  const payload: SharePreviewData = useMemo(
    () => buildSharePayload(score, trackId, result),
    [score, trackId, result]
  );

  const open = useCallback(() => {
    setStep('consent');
    setConsentAccepted(false);
    setIncludeCreatorName(true);
    setCreatorDisplayName(suggestedCreatorName?.trim() || '');
    setCreatorType(mapTrackToCreatorType(trackId));
    setIsOpen(true);
    lightHaptic();
  }, [trackId, suggestedCreatorName]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 'consent') return 'identity';
      if (s === 'identity') return 'preview';
      if (s === 'preview') return 'share';
      return s;
    });
    lightHaptic();
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => {
      if (s === 'share') return 'preview';
      if (s === 'preview') return 'identity';
      if (s === 'identity') return 'consent';
      return s;
    });
  }, []);

  return {
    isOpen,
    step,
    consentAccepted,
    setConsentAccepted,
    includeCreatorName,
    setIncludeCreatorName,
    creatorDisplayName,
    setCreatorDisplayName,
    creatorType,
    setCreatorType,
    payload,
    open,
    close,
    goNext,
    goBack,
  };
};
