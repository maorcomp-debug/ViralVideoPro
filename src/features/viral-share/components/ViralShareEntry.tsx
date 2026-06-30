import React from 'react';
import { VIRAL_SHARE_ENABLED } from '../constants';
import { useViralShareFlow } from '../hooks/useViralShareFlow';
import { ShareButtonRow } from '../styles/viralShareStyles';
import { ViralShareButton } from './ViralShareButton';
import { ViralShareModal } from './ViralShareModal';
import type { AnalysisResult } from '../../../types';
import type { ViralShareEntryProps } from '../types';

const EMPTY_RESULT: AnalysisResult = {
  expertAnalysis: [],
  hook: '',
  committee: { summary: '', finalTips: [] },
};

export const ViralShareEntry: React.FC<ViralShareEntryProps> = ({
  score,
  trackId,
  result,
  suggestedCreatorName,
  blocked = false,
  layout = 'standalone',
}) => {
  const flow = useViralShareFlow(score, trackId, result ?? EMPTY_RESULT);

  if (!VIRAL_SHARE_ENABLED || blocked || !result) {
    return null;
  }

  return (
    <>
      <ShareButtonRow $inline={layout === 'inline'}>
        <ViralShareButton onClick={flow.open} />
      </ShareButtonRow>
      <ViralShareModal
        isOpen={flow.isOpen}
        step={flow.step}
        consentAccepted={flow.consentAccepted}
        onConsentChange={flow.setConsentAccepted}
        includeCreatorName={flow.includeCreatorName}
        onIncludeCreatorNameChange={flow.setIncludeCreatorName}
        creatorType={flow.creatorType}
        onCreatorTypeChange={flow.setCreatorType}
        payload={flow.payload}
        suggestedCreatorName={suggestedCreatorName}
        trackId={trackId}
        onClose={flow.close}
        onNext={flow.goNext}
        onBack={flow.goBack}
      />
    </>
  );
};
