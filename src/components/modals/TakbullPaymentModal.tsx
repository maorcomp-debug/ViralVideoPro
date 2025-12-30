import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ModalOverlay, ModalContent, ModalHeader, ModalTitle, ModalCloseBtn } from '../../styles/modal';

interface TakbullPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  orderReference: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const IframeContainer = styled.div`
  width: 100%;
  height: 600px;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
  border-radius: 8px;
  margin: 20px 0;
`;

const TakbullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #D4A043;
  font-size: 1.2rem;
  text-align: center;
`;

const Spinner = styled.div`
  border: 4px solid rgba(212, 160, 67, 0.2);
  border-top: 4px solid #D4A043;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const TakbullPaymentModal: React.FC<TakbullPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentUrl,
  orderReference,
  onSuccess,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for messages from iframe to adjust height
    const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
    const eventer = window[eventMethod as keyof Window] as any;
    const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

    const handleMessage = (e: MessageEvent) => {
      // Verify message is from Takbull domain
      if (!e.origin.includes('takbull.co.il')) {
        return;
      }

      const height = parseInt(e.data, 10);
      if (!isNaN(height)) {
        setIframeHeight(height + 50); // Add padding
        setIsLoading(false);
      } else {
        console.log('Takbull message:', e.data);
      }
    };

    eventer(messageEvent, handleMessage, false);

    return () => {
      const removeMethod = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
      const remover = window[removeMethod as keyof Window] as any;
      const removeEvent = removeMethod === 'detachEvent' ? 'onmessage' : 'message';
      remover(removeEvent, handleMessage, false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIframeHeight(600);
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <ModalHeader>
          <ModalTitle>תשלום מאובטח</ModalTitle>
          <ModalCloseBtn onClick={onClose}>×</ModalCloseBtn>
        </ModalHeader>
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
            מספר הזמנה: <strong style={{ color: '#D4A043' }}>{orderReference}</strong>
          </p>
          {isLoading && (
            <LoadingSpinner>
              <Spinner />
              טוען את דף התשלום...
            </LoadingSpinner>
          )}
          <IframeContainer>
            <TakbullIframe
              ref={iframeRef}
              id="takbull_iframe"
              src={paymentUrl}
              style={{ height: `${iframeHeight}px` }}
              onLoad={() => setIsLoading(false)}
              title="Takbull Payment"
            />
          </IframeContainer>
          <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '15px' }}>
            התשלום מתבצע דרך Takbull - מערכת תשלומים מאובטחת
          </p>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};

