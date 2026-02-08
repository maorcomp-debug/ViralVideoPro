import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ModalOverlay, ModalHeader, ModalTitle, ModalCloseBtn } from '../../styles/modal';

/** Modal מלא מסך לתשלום TAKBUK – מתאים למחשב ולטלפון */
const FullScreenModalContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  background: #0a0a0a;
  border: 1px solid #D4A043;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(212, 160, 67, 0.2);
  @media (min-width: 769px) {
    max-width: 95vw;
    max-height: 95vh;
    width: 95vw;
    height: 95vh;
  }
  @media (max-width: 768px) {
    max-width: 100vw;
    max-height: 100vh;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
`;

const IframeWrapper = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  background: #0a0a0a;
  border-top: 1px solid rgba(212, 160, 67, 0.2);
  direction: ltr;
  text-align: left;
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
  onClose,
  paymentUrl,
  orderReference,
  onSuccess,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin.includes('viraly.co.il') || e.origin === window.location.origin) {
        if (e.data?.type === 'payment_success') {
          onSuccess?.();
          onClose();
        }
        return;
      }
      if (e.origin.includes('takbull.co.il') || e.origin.includes('yaadpay')) {
        if (e.data === 'payment_success' || e.data?.status === 'success') {
          onSuccess?.();
          onClose();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  // Desktop: load via LTR redirect (payment-frame) to help cursor in "שם בעל הכרטיס". Mobile: direct URL to avoid blank page.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const iframeSrc =
    !isMobile && paymentUrl
      ? `${window.location.origin}/payment-frame.html?url=${encodeURIComponent(paymentUrl)}`
      : paymentUrl;

  return (
    <ModalOverlay
      onClick={(e) => e.stopPropagation()}
      style={{ padding: 0, alignItems: 'stretch', justifyContent: 'center' }}
    >
      <FullScreenModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader style={{ flexShrink: 0, padding: '12px 16px' }}>
          <ModalTitle style={{ marginBottom: 0, fontSize: '1.1rem' }}>
            תשלום מאובטח · הזמנה {orderReference}
          </ModalTitle>
          <ModalCloseBtn onClick={onClose}>×</ModalCloseBtn>
        </ModalHeader>
        <IframeWrapper dir="ltr">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            dir="ltr"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff',
            }}
            title="Takbull Payment"
            allow="payment *"
          />
        </IframeWrapper>
      </FullScreenModalContent>
    </ModalOverlay>
  );
};
