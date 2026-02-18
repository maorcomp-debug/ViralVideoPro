import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div<{ $isRtl?: boolean }>`
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
  direction: ${p => p.$isRtl ? 'rtl' : 'ltr'};
  text-align: center;
  box-sizing: border-box;
  animation: ${fadeIn} 0.35s ease-out;
  @media (max-width: 480px) {
    padding: max(20px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  }
`;

const Card = styled.div`
  max-width: 420px;
  width: 100%;
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(212, 160, 67, 0.35);
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  @media (max-width: 480px) {
    padding: 28px 20px;
  }
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  border: 3px solid rgba(212, 160, 67, 0.25);
  border-top-color: #D4A043;
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    margin-bottom: 20px;
  }
`;

const Title = styled.h1`
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const Message = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 8px;
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const Ref = styled.p`
  font-size: 0.9rem;
  color: rgba(212, 160, 67, 0.9);
  margin: 0;
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 24px;
  color: #D4A043;
  font-size: 0.95rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const PaymentRedirectPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [failed, setFailed] = useState(false);
  const url = searchParams.get('url');
  const ref = searchParams.get('ref') || '';
  const isRtl = (i18n.language || i18n.resolvedLanguage || 'en').startsWith('he');

  useEffect(() => {
    if (!url) {
      setFailed(true);
      return;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      setFailed(true);
      return;
    }
    const t = setTimeout(() => {
      window.location.href = decoded;
    }, 1200);
    return () => clearTimeout(t);
  }, [url]);

  if (failed) {
    return (
      <Page $isRtl={isRtl}>
        <Card>
          <Title>{t('paymentRedirect.errorTitle')}</Title>
          <Message>{t('paymentRedirect.linkUnavailable')}</Message>
          <BackLink to="/settings">{t('paymentRedirect.backSettings')}</BackLink>
        </Card>
      </Page>
    );
  }

  return (
    <Page $isRtl={isRtl}>
      <Card>
        <Spinner aria-hidden />
        <Title>{t('paymentRedirect.redirecting')}</Title>
        <Message>{t('paymentRedirect.opening')}</Message>
        {ref && <Ref>{t('paymentRedirect.orderRef', { ref })}</Ref>}
      </Card>
    </Page>
  );
};
