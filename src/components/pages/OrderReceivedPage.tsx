import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  direction: rtl;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get parameters from URL
        const orderReference = searchParams.get('order_reference') || 
          searchParams.get('ordernumber') || 
          searchParams.get('transactionInternalNumber');
        const statusCode = parseInt(searchParams.get('statusCode') || '0', 10);
        const uniqId = searchParams.get('uniqId');
        const token = searchParams.get('token');
        const last4Digits = searchParams.get('Last4Digits');
        const numberPayments = searchParams.get('numberpayments');
        const tokenExpirationMonth = searchParams.get('TokenExpirationMonth');
        const tokenExpirationYear = searchParams.get('TokenExpirationYear');
        const orderNumber = searchParams.get('ordernumber');

        if (!orderReference) {
          setStatus('error');
          setError('מספר הזמנה לא נמצא');
          return;
        }

        // Check if payment was successful (statusCode 0 = success)
        const isSuccess = statusCode === 0;

        if (!isSuccess) {
          setStatus('error');
          setMessage('התשלום נכשל');
          setError(`קוד שגיאה: ${statusCode}`);
          return;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setStatus('error');
          setError('לא ניתן לזהות את המשתמש. אנא התחבר מחדש.');
          return;
        }

        // Call the callback API endpoint to process the payment
        // Build query string from all search params
        const queryString = Array.from(searchParams.entries())
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        
        try {
          const response = await fetch(`/api/takbull/callback?${queryString}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to process payment');
          }

          const result = await response.json();
          
          if (result.ok && result.success) {
            setStatus('success');
            setMessage('תשלומך התקבל בהצלחה! המנוי שלך עודכן.');
            
            // Redirect to home with upgrade parameter to show UpgradeBenefitsModal
            const oldTier = result.oldTier || 'free';
            const newTier = result.newTier || order.subscription_tier;
            
            // Reload user data after a short delay
            setTimeout(() => {
              window.location.href = `/?upgrade=success&from=${oldTier}&to=${newTier}`;
            }, 2000);
          } else {
            setStatus('error');
            setMessage('התשלום נכשל');
            setError(result.message || 'שגיאה בעיבוד התשלום');
          }

        } catch (fetchError: any) {
          console.error('Error calling callback:', fetchError);
          
          // Even if callback fails, if statusCode is 0, payment was successful
          // The IPN will handle the subscription update
          if (statusCode === 0) {
            setStatus('success');
            setMessage('תשלומך התקבל בהצלחה! המנוי שלך יעודכן תוך מספר דקות.');
            
            setTimeout(() => {
              window.location.href = '/';
            }, 5000);
          } else {
            setStatus('error');
            setError(fetchError.message || 'שגיאה בעיבוד התשלום');
          }
        }

      } catch (error: any) {
        console.error('Error processing payment:', error);
        setStatus('error');
        setError(error.message || 'שגיאה בעיבוד התשלום');
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <PageContainer>
      <ContentCard>
        {status === 'loading' && (
          <>
            <StatusIcon success={true}>⏳</StatusIcon>
            <Title>מעבד את התשלום...</Title>
            <LoadingMessage>אנא המתן, אנו מעבדים את התשלום שלך</LoadingMessage>
          </>
        )}

        {status === 'success' && (
          <>
            <StatusIcon success={true}>✅</StatusIcon>
            <Title>תשלום התקבל בהצלחה!</Title>
            <Message>{message}</Message>
            <Button onClick={() => navigate('/')}>
              חזרה לדף הבית
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <StatusIcon success={false}>❌</StatusIcon>
            <Title>שגיאה בעיבוד התשלום</Title>
            <Message>{message || 'אירעה שגיאה בעיבוד התשלום'}</Message>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button onClick={() => navigate('/')}>
              חזרה לדף הבית
            </Button>
          </>
        )}
      </ContentCard>
    </PageContainer>
  );
};

