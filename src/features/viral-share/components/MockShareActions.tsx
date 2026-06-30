import React from 'react';
import { MockShareBtn, MockShareRow, SectionHeading } from '../styles/viralShareStyles';
import { getShareStrings } from '../i18n';
import { showAlert } from '../../../lib/alertStore';

export const MockShareActions: React.FC = () => {
  const s = getShareStrings();

  const handleMock = () => {
    showAlert(s.mockSuccess);
  };

  return (
    <>
      <SectionHeading>{s.shareSectionTitle}</SectionHeading>
      <MockShareRow>
        <MockShareBtn type="button" onClick={handleMock}>
          {s.mockWhatsApp}
        </MockShareBtn>
        <MockShareBtn type="button" onClick={handleMock}>
          {s.mockCopy}
        </MockShareBtn>
        <MockShareBtn type="button" onClick={handleMock}>
          {s.mockNative}
        </MockShareBtn>
      </MockShareRow>
    </>
  );
};
