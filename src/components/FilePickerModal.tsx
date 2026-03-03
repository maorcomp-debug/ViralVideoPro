import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { fadeIn } from '../styles/globalStyles';

const Overlay = styled.div<{ $show: boolean }>`
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

const Box = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 16px;
  padding: 24px;
  max-width: 340px;
  width: 100%;
  animation: ${fadeIn} 0.25s ease;
`;

const OptionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 10px;
  background: rgba(212, 160, 67, 0.15);
  border: 1px solid rgba(212, 160, 67, 0.4);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, border-color 0.2s;
  &:last-of-type {
    margin-bottom: 0;
  }
  &:hover {
    background: rgba(212, 160, 67, 0.25);
    border-color: rgba(212, 160, 67, 0.6);
  }
`;

const CancelBtn = styled.button`
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 10px;
  color: #999;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    color: #fff;
    border-color: #777;
  }
`;

const IconSpan = styled.span`
  font-size: 1.3rem;
  opacity: 0.9;
`;

interface FilePickerModalProps {
  show: boolean;
  onClose: () => void;
  onPhotoLibrary: () => void;
  onTakePhoto: () => void;
  onChooseFile: () => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  show,
  onClose,
  onPhotoLibrary,
  onTakePhoto,
  onChooseFile,
}) => {
  const { t } = useTranslation();

  const handleOption = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Overlay $show={show} onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <OptionBtn type="button" onClick={() => handleOption(onPhotoLibrary)}>
          <IconSpan>🖼️</IconSpan>
          {t('analysis.filePickerPhotoLibrary')}
        </OptionBtn>
        <OptionBtn type="button" onClick={() => handleOption(onTakePhoto)}>
          <IconSpan>📷</IconSpan>
          {t('analysis.filePickerTakePhoto')}
        </OptionBtn>
        <OptionBtn type="button" onClick={() => handleOption(onChooseFile)}>
          <IconSpan>📁</IconSpan>
          {t('analysis.filePickerChooseFile')}
        </OptionBtn>
        <CancelBtn type="button" onClick={onClose}>
          {t('analysis.filePickerCancel')}
        </CancelBtn>
      </Box>
    </Overlay>
  );
};
