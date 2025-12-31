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
  const paymentWindowRef = useRef<Window | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  useEffect(() => {
    if (!isOpen) {
      setUseIframe(false);
      return;
    }

    // Try to open payment page in new window (allows dropdowns to work properly)
    const width = 800;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const paymentWindow = window.open(
      paymentUrl,
      'TakbullPayment',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!paymentWindow) {
      // Popup blocked - use iframe instead
      console.warn('Popup blocked, using iframe fallback');
      setUseIframe(true);
      return;
    }

    paymentWindowRef.current = paymentWindow;

    // Check if payment window is closed
    checkIntervalRef.current = window.setInterval(() => {
      if (paymentWindow.closed) {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        paymentWindowRef.current = null;
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    }, 1000);

    // Listen for messages from payment window
    const handleMessage = (e: MessageEvent) => {
      if (!e.origin.includes('takbull.co.il') && !e.origin.includes('yaadpay')) {
        return;
      }
      if (e.data === 'payment_success' || e.data?.status === 'success') {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        if (paymentWindowRef.current) {
          paymentWindowRef.current.close();
          paymentWindowRef.current = null;
        }
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('message', handleMessage);
      if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
        paymentWindowRef.current.close();
      }
    };
  }, [isOpen, paymentUrl, onClose, onSuccess, onError]);

  // Handle iframe height adjustment (fallback mode)
  useEffect(() => {
    if (!useIframe || !isOpen) return;

    const handleMessage = (e: MessageEvent) => {
      if (!e.origin.includes('takbull.co.il') && !e.origin.includes('yaadpay')) {
        return;
      }
      const height = parseInt(e.data, 10);
      if (!isNaN(height) && height > 0) {
        setIframeHeight(Math.max(height + 100, 800));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [useIframe, isOpen]);

  if (!isOpen) return null;

  // If using iframe (popup blocked)
  if (useIframe) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '900px', maxHeight: '95vh' }}
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
              position: 'relative',
              background: '#0a0a0a',
              borderRadius: '8px',
              overflow: 'hidden'
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
                allow="payment"
                onLoad={() => setIframeHeight(800)}
              />
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '15px' }}>
              התשלום מתבצע דרך Takbull - מערכת תשלומים מאובטחת
            </p>
            <p style={{ color: '#666', fontSize: '0.75rem', textAlign: 'center', marginTop: '10px' }}>
              💡 טיפ: לפתיחה בחלון חדש (מומלץ), אפשר חלונות קופצים בדפדפן
            </p>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  // Using popup window (preferred method)
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '500px' }}
      >
        <ModalHeader>
          <ModalTitle>תשלום מאובטח</ModalTitle>
          <ModalCloseBtn onClick={onClose}>×</ModalCloseBtn>
        </ModalHeader>
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <Spinner />
          </div>
          <p style={{ color: '#ccc', marginBottom: '15px', fontSize: '1.1rem' }}>
            פתיחת דף התשלום...
          </p>
          <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.95rem' }}>
            מספר הזמנה: <strong style={{ color: '#D4A043' }}>{orderReference}</strong>
          </p>
          <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '20px' }}>
            דף התשלום נפתח בחלון חדש. אם החלון לא נפתח, אנא בדוק את הגדרות חוסם החלונות הקופצים בדפדפן שלך.
          </p>
          <button
            onClick={() => {
              if (paymentWindowRef.current) {
                paymentWindowRef.current.focus();
              } else {
                window.open(paymentUrl, '_blank');
              }
            }}
            style={{
              background: '#D4A043',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            פתח דף תשלום בחלון חדש
          </button>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '20px' }}>
            התשלום מתבצע דרך Takbull - מערכת תשלומים מאובטחת
          </p>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};

