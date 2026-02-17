import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ModalOverlay, ModalHeader, ModalTitle } from '../../styles/modal';

/** תשלום באותו חלון – ניווט ישיר לדף התשלום (בלי iframe כי X-Frame-Options חוסם) */
const FullScreenModalContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 420px;
  width: 90vw;
  background: #0a0a0a;
  border: 1px solid #D4A043;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(212, 160, 67, 0.2);
  padding: 24px;
`;

const Message = styled.p`
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

interface TakbullPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  orderReference: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const TakbullPaymentModal: React.FC<TakbullPaymentModalProps> = ({
  isOpen,
  paymentUrl,
  orderReference,
}) => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!isOpen || !paymentUrl) return;
    const t = setTimeout(() => {
      window.location.href = paymentUrl;
    }, 800);
    return () => clearTimeout(t);
  }, [isOpen, paymentUrl]);

  if (!isOpen) return null;

  return (
    <ModalOverlay
      onClick={(e) => e.stopPropagation()}
      style={{ padding: 0, alignItems: 'center', justifyContent: 'center' }}
    >
      <FullScreenModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader style={{ flexShrink: 0, padding: '0 0 16px 0' }}>
          <ModalTitle style={{ marginBottom: 0, fontSize: '1.1rem' }}>
            {t('billing.securePayment')} {orderReference}
          </ModalTitle>
        </ModalHeader>
        <Message>{t('billing.redirecting')}</Message>
      </FullScreenModalContent>
    </ModalOverlay>
  );
};
