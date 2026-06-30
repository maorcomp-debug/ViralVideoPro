import React from 'react';
import { ConsentBox, ConsentLabel, ConsentText } from '../styles/viralShareStyles';
import { getShareStrings } from '../i18n';

interface ShareConsentSectionProps {
  accepted: boolean;
  onChange: (value: boolean) => void;
}

export const ShareConsentSection: React.FC<ShareConsentSectionProps> = ({
  accepted,
  onChange,
}) => {
  const s = getShareStrings();

  return (
    <ConsentBox>
      <ConsentText>{s.consentText}</ConsentText>
      <ConsentLabel>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{s.consentCheckbox}</span>
      </ConsentLabel>
    </ConsentBox>
  );
};
