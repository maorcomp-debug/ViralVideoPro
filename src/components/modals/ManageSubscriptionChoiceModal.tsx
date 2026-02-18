import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { fadeIn } from '../../styles/globalStyles';

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${(p) => (p.$isOpen ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

const Box = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h3`
  color: #D4A043;
  margin: 0 0 20px 0;
  font-size: 1.25rem;
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChoiceButton = styled.button<{ $primary?: boolean }>`
  width: 100%;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  ${(p) =>
    p.$primary
      ? `
    background: linear-gradient(135deg, #D4A043 0%, #F5C842 100%);
    color: #000;
  `
      : `
    background: rgba(212, 160, 67, 0.15);
    color: #D4A043;
    border: 1px solid #D4A043;
  `}
  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }
`;

const BackButton = styled.button`
  margin-top: 16px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    color: #ccc;
  }
`;

export interface ManageSubscriptionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackages: () => void;
  onSelectBilling: () => void;
}

export const ManageSubscriptionChoiceModal: React.FC<ManageSubscriptionChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectPackages,
  onSelectBilling,
}) => {
  const { t } = useTranslation();
  const handlePackages = () => {
    onClose();
    onSelectPackages();
  };
  const handleBilling = () => {
    onClose();
    onSelectBilling();
  };
  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Title>{t('manageSubscription.title')}</Title>
        <Buttons>
          <ChoiceButton $primary onClick={handlePackages}>
            {t('manageSubscription.packagesUpgrade')}
          </ChoiceButton>
          <ChoiceButton onClick={handleBilling}>
            {t('manageSubscription.billingManage')}
          </ChoiceButton>
        </Buttons>
        <BackButton type="button" onClick={onClose}>
          {t('manageSubscription.back')}
        </BackButton>
      </Box>
    </Overlay>
  );
};
