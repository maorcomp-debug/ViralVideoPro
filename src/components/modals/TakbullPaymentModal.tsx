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

export const TakbullPaymentModal: React.FC<TakbullPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentUrl,
  orderReference,
  onSuccess,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Listen for messages from payment iframe (for payment completion)
    const handleMessage = (e: MessageEvent) => {
      // Check if message is from Takbull payment page
      if (!e.origin.includes('takbull.co.il') && !e.origin.includes('yaadpay')) {
        return;
      }
      
      // If payment success message received
      if (e.data === 'payment_success' || e.data?.status === 'success') {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onClose, onSuccess]);

  // Handle iframe height adjustment
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (e: MessageEvent) => {
      if (!e.origin.includes('takbull.co.il') && !e.origin.includes('yaadpay')) {
        return;
      }
      
      // Check for height adjustment message
      const height = parseInt(e.data, 10);
      if (!isNaN(height) && height > 0) {
        setIframeHeight(Math.max(height + 100, 800));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  if (!isOpen) return null;

  // Always use iframe (integrated payment experience)
  return (
    <ModalOverlay onClick={(e) => {
      // Don't close on overlay click - user needs to complete payment
      e.stopPropagation();
    }}>
      <ModalContent 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '900px', maxHeight: '95vh', width: '95%' }}
      >
        <ModalHeader>
          <ModalTitle>תשלום מאובטח</ModalTitle>
          <ModalCloseBtn onClick={onClose}>×</ModalCloseBtn>
        </ModalHeader>
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
            מספר הזמנה: <strong style={{ color: '#D4A043' }}>{orderReference}</strong>
          </p>
          <div style={{ 
            width: '100%', 
            height: `${iframeHeight}px`, 
            minHeight: '600px',
            position: 'relative',
            background: '#0a0a0a',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(212, 160, 67, 0.3)'
          }}>
            <iframe
              ref={iframeRef}
              src={paymentUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white'
              }}
              title="Takbull Payment"
              allow="payment *"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              onLoad={() => {
                // Reset height on load, will adjust based on messages
                setIframeHeight(800);
              }}
            />
          </div>
          <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '15px' }}>
            התשלום מתבצע דרך Takbull - מערכת תשלומים מאובטחת
          </p>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};
