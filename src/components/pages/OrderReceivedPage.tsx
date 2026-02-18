import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const PageContainer = styled.div<{ $isRtl?: boolean }>`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  direction: ${p => p.$isRtl ? 'rtl' : 'ltr'};
`;

const ContentCard = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border: 2px solid rgba(212, 160, 67, 0.3);
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #D4A043;
  margin-bottom: 20px;
  font-weight: 700;
`;

const Message = styled.p`
  font-size: 1.2rem;
  color: #e0e0e0;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const StatusIcon = styled.div<{ success: boolean }>`
  font-size: 4rem;
  margin-bottom: 20px;
  ${props => props.success ? 'color: #4CAF50;' : 'color: #f44336;'}
`;

const Button = styled.button`
  background: linear-gradient(135deg, #D4A043 0%, #bf953f 100%);
  color: #000;
  border: none;
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 20px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 160, 67, 0.4);
  }
`;

const LoadingMessage = styled.div`
  color: #D4A043;
  font-size: 1.1rem;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  color: #f44336;
  font-size: 1rem;
  margin-top: 20px;
  padding: 15px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
`;

export const OrderReceivedPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRetryError, setIsRetryError] = useState(false);
  const isRtl = (i18n.language || i18n.resolvedLanguage || 'en').startsWith('he');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get parameters from URL
        const orderReference = searchParams.get('order_reference') || 
          searchParams.get('ordernumber') || 
          searchParams.get('transactionInternalNumber');
        // Do NOT default statusCode to 0 – only treat as success when provider explicitly sends statusCode=0
        const statusCodeParam = searchParams.get('statusCode');
        const statusCode = (statusCodeParam !== null && statusCodeParam !== '') ? parseInt(statusCodeParam, 10) : NaN;
        const uniqId = searchParams.get('uniqId');
        const token = searchParams.get('token');
        const last4Digits = searchParams.get('Last4Digits');
        const numberPayments = searchParams.get('numberpayments');
        const tokenExpirationMonth = searchParams.get('TokenExpirationMonth');
        const tokenExpirationYear = searchParams.get('TokenExpirationYear');
        const orderNumber = searchParams.get('ordernumber');

        if (!orderReference) {
          setStatus('error');
          setError(t('orderReceived.orderNotFound'));
          return;
        }

        // Only treat as success when provider explicitly sends statusCode=0 (never when missing)
        const isSuccess = statusCode === 0;

        if (!isSuccess) {
          setStatus('error');
          setMessage(t('orderReceived.paymentFailed'));
          setError(Number.isNaN(statusCode) ? t('orderReceived.noConfirmation') : t('orderReceived.errorCode', { code: statusCode }));
          return;
        }

        // Timeout: if callback doesn't respond in 15s, redirect without telling parent "payment_success".
        // We must NOT send payment_success unless the callback actually confirmed payment.
        const maxWaitTimeout = setTimeout(() => {
          console.warn('⚠️ Callback did not respond in 15s – redirecting without payment_success');
          setStatus('success');
          setMessage(t('orderReceived.successPending'));
          if (window.parent && window.parent !== window) {
            setTimeout(() => {
              try {
                window.parent.location.replace(`/?_t=${Date.now()}`);
              } catch (e) {
                console.log('Cannot redirect parent');
              }
            }, 500);
          } else if (window.opener && !window.opener.closed) {
            setTimeout(() => {
              window.opener.location.replace(`/?_t=${Date.now()}`);
              window.close();
            }, 1000);
          } else {
            setTimeout(() => window.location.replace(`/?_t=${Date.now()}`), 1000);
          }
        }, 15000);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          clearTimeout(maxWaitTimeout);
          setStatus('error');
          setError(t('orderReceived.userNotIdentified'));
          return;
        }

        // Call the callback API endpoint to process the payment
        // Build query string from all search params
        const queryString = Array.from(searchParams.entries())
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        
        try {
          console.log('📞 Calling callback API with params:', queryString);
          
          // Add timeout to fetch request (10 seconds - shorter than maxWaitTimeout)
          const controller = new AbortController();
          const fetchTimeoutId = setTimeout(() => controller.abort(), 10000);
          
          let response;
          try {
            response = await fetch(`/api/takbull/callback?${queryString}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            });
            clearTimeout(fetchTimeoutId);
          } catch (fetchError: any) {
            clearTimeout(fetchTimeoutId);
            if (fetchError.name === 'AbortError') {
              console.error('❌ Callback API timeout after 10 seconds');
              clearTimeout(maxWaitTimeout);
              setStatus('error');
              setError(t('orderReceived.connectionTimeout'));
              return;
            }
            throw fetchError;
          }

          console.log('📥 Callback API response status:', response.status, response.statusText);

          // Get response text first to see what we got
          const responseText = await response.text();
          console.log('📥 Callback API response body:', responseText);

          if (!response.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { error: responseText || 'Unknown error' };
            }
            console.error('❌ Callback API error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });
            throw new Error(errorData.error || `Failed to process payment: ${response.status} ${response.statusText}`);
          }

          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('❌ Failed to parse callback response:', parseError);
            throw new Error(t('orderReceived.invalidResponse'));
          }
          console.log('✅ Callback API result:', result);
          
          // Clear the maxWaitTimeout since API responded
          clearTimeout(maxWaitTimeout);
          
          if (result.needsRetry) {
            clearTimeout(maxWaitTimeout);
            setStatus('error');
            setMessage(t('orderReceived.errorTitle'));
            setError(result.message || t('orderReceived.subscriptionUnchanged'));
            setIsRetryError(true);
            return;
          }
          if (result.ok && result.success) {
            setStatus('success');
            setMessage(t('orderReceived.successMessage'));
            
            // Redirect to home with upgrade parameter to show UpgradeBenefitsModal
            const oldTier = result.oldTier || 'free';
            const newTier = result.newTier || 'creator';
            
            // Send message to parent window if in iframe, otherwise redirect
            if (window.parent && window.parent !== window) {
              // We're in an iframe - send message to parent window
              console.log('📤 Sending payment success message to parent window', { oldTier, newTier });
              window.parent.postMessage({
                type: 'payment_success',
                oldTier,
                newTier,
              }, '*');
              
              // Also try to redirect parent (may work with allow-top-navigation)
              setTimeout(() => {
                try {
                  const timestamp = Date.now();
                  window.parent.location.replace(`/?upgrade=success&from=${oldTier}&to=${newTier}&_t=${timestamp}`);
                } catch (e) {
                  // CORS/Sandbox - parent window will handle via postMessage
                  console.log('Cannot redirect parent directly, using postMessage only');
                }
              }, 500);
            } else if (window.opener && !window.opener.closed) {
              // We're in a popup - close it and redirect the main window
              setTimeout(() => {
                const timestamp = new Date().getTime();
                window.opener.location.replace(`/?upgrade=success&from=${oldTier}&to=${newTier}&_t=${timestamp}`);
                window.close();
              }, 1500);
            } else {
              // We're in the main window - redirect normally
              setTimeout(() => {
                const timestamp = new Date().getTime();
                window.location.replace(`/?upgrade=success&from=${oldTier}&to=${newTier}&_t=${timestamp}`);
              }, 1500);
            }
          } else {
            if (statusCode === 0) {
              setStatus('success');
              setMessage(t('orderReceived.successPending'));
              setTimeout(() => {
                const timestamp = new Date().getTime();
                window.location.replace(`/?_t=${timestamp}`);
              }, 2000);
            } else {
              setStatus('error');
              setMessage(t('orderReceived.paymentFailed'));
              setError(result.message || t('orderReceived.errorGenericMessage'));
            }
          }

        } catch (fetchError: any) {
          console.error('Error calling callback:', fetchError);
          
          // Clear maxWaitTimeout since we're handling the error
          clearTimeout(maxWaitTimeout);
          
          // Even if callback fails, if statusCode is 0, payment was successful
          // The IPN will handle the subscription update
          if (statusCode === 0) {
            setStatus('success');
            setMessage(t('orderReceived.successPending'));
            
            // If we're in a popup window (opener exists), close popup and redirect opener
            // Otherwise, redirect current window
            if (window.opener && !window.opener.closed) {
              setTimeout(() => {
                const timestamp = new Date().getTime();
                window.opener.location.replace(`/?_t=${timestamp}`);
                window.close();
              }, 1000);
            } else {
              setTimeout(() => {
                const timestamp = new Date().getTime();
                window.location.replace(`/?_t=${timestamp}`);
              }, 1000);
            }
          } else {
            setStatus('error');
            setError(fetchError.message || t('orderReceived.errorGenericMessage'));
          }
        }

      } catch (error: any) {
        console.error('Error processing payment:', error);
        // Make sure to clear any timeouts
        // Note: maxWaitTimeout is not accessible here, but it will timeout on its own if statusCode === 0
        setStatus('error');
        setError(error.message || t('orderReceived.errorGenericMessage'));
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <PageContainer $isRtl={isRtl}>
      <ContentCard>
        {status === 'loading' && (
          <>
            <StatusIcon success={true}>⏳</StatusIcon>
            <Title>{t('orderReceived.processing')}</Title>
            <LoadingMessage>{t('orderReceived.pleaseWait')}</LoadingMessage>
          </>
        )}

        {status === 'success' && (
          <>
            <StatusIcon success={true}>✅</StatusIcon>
            <Title>{t('orderReceived.successTitle')}</Title>
            <Message>{message}</Message>
            <Button onClick={() => navigate('/')}>
              {t('orderReceived.backHome')}
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <StatusIcon success={false}>❌</StatusIcon>
            <Title>{isRetryError ? t('orderReceived.errorTitle') : t('orderReceived.errorGenericTitle')}</Title>
            <Message>{message || t('orderReceived.errorGenericMessage')}</Message>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button onClick={() => navigate('/')}>
              {isRetryError ? t('orderReceived.errorRetry') : t('orderReceived.backHome')}
            </Button>
          </>
        )}
      </ContentCard>
    </PageContainer>
  );
};

