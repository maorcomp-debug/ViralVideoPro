import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fadeIn } from '../../styles/globalStyles';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { supabase } from '../../lib/supabase';
import type { UserSubscription, SubscriptionTier } from '../../types';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${(p) => (p.$isOpen ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
  overflow-y: auto;
  animation: ${fadeIn} 0.2s ease;
`;

const Box = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 16px;
  padding: 28px;
  max-width: 480px;
  width: 100%;
  text-align: right;
  direction: rtl;
  margin: auto;
`;

const Title = styled.h2`
  color: #D4A043;
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  text-align: center;
`;

const Row = styled.p<{ $highlight?: boolean }>`
  margin: 8px 0;
  color: ${(p) => (p.$highlight ? '#D4A043' : '#ccc')};
  font-size: 1rem;
  & strong {
    color: #D4A043;
    margin-left: 6px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
`;

const PrimaryBtn = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #D4A043 0%, #F5C842 100%);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    opacity: 0.95;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid #D4A043;
  border-radius: 10px;
  color: #D4A043;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: rgba(212, 160, 67, 0.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  left: 12px;
  background: transparent;
  border: none;
  color: #D4A043;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  &:hover {
    opacity: 0.8;
  }
`;

const Message = styled.div<{ $success?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  text-align: center;
  ${(p) =>
    p.$success
      ? 'background: rgba(0,200,0,0.15); color: #8f8;'
      : 'background: rgba(200,0,0,0.15); color: #f88;'}
`;

type SubscriptionStatusDisplay = 'active' | 'paused' | 'canceled' | 'expired';

const STATUS_LABELS: Record<SubscriptionStatusDisplay, string> = {
  active: 'פעיל',
  paused: 'מושהה',
  canceled: 'בוטל',
  expired: 'הסתיים',
};

function getTierDisplayName(tier: SubscriptionTier): string {
  if (tier === 'coach-pro') return 'יוצרים באקסטרים גרסת PRO';
  return SUBSCRIPTION_PLANS[tier]?.name ?? tier;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  subscription: UserSubscription | null;
  profile: { subscription_tier?: string; subscription_status?: string; subscription_end_date?: string; subscription_start_date?: string } | null;
  usage: { analysesUsed: number; minutesUsed: number; periodEnd: Date } | null;
  onRefresh?: () => void;
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  subscription,
  profile,
  usage,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; body: string; confirmLabel: string; onConfirm: () => void } | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    subscription_status?: SubscriptionStatusDisplay;
    auto_renew?: boolean;
    current_period_end?: string;
  } | null>(null);

  const tier = (subscription?.tier ?? profile?.subscription_tier ?? 'free') as SubscriptionTier;
  const isFree = tier === 'free';
  const statusFromProfile = profile?.subscription_status;
  const status: SubscriptionStatusDisplay =
    (apiStatus?.subscription_status as SubscriptionStatusDisplay) ??
    (statusFromProfile === 'paused'
      ? 'paused'
      : statusFromProfile === 'canceled' || statusFromProfile === 'cancelled'
        ? 'canceled'
        : statusFromProfile === 'expired'
          ? 'expired'
          : subscription?.isActive !== false && statusFromProfile === 'active'
            ? 'active'
            : 'expired');

  const periodEnd = subscription?.endDate ?? (profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null);
  const planLimits = !isFree ? SUBSCRIPTION_PLANS[tier]?.limits : null;
  const maxAnalyses = planLimits?.maxAnalysesPerPeriod ?? 0;
  const maxMinutes = planLimits?.maxVideoMinutesPerPeriod ?? 0;
  const isCoachTier = tier === 'coach' || tier === 'coach-pro';
  const autoRenew = apiStatus?.auto_renew ?? true;

  useEffect(() => {
    if (!isOpen) return;
    setMessage(null);
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    getAuthHeaders()
      .then((headers) => fetch(`${base}/api/subscription`, { credentials: 'include', headers }))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.subscription_status === 'string') setApiStatus(data);
      })
      .catch(() => {});
  }, [isOpen]);

  const showCancel = !isFree && (status === 'active' || status === 'paused');
  const showUpgrade = isFree || status === 'expired';

  const runAction = async (action: 'cancel') => {
    setLoading(action);
    setMessage(null);
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${base}/api/subscription`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ text: data.error || 'אירעה שגיאה. נסה שוב.', success: false });
        return;
      }
      const periodEndStr = periodEnd ? formatDate(periodEnd) : '';
      setMessage({
        text: `המנוי בוטל בהצלחה. תוכל להשתמש עד ${periodEndStr} או עד סיום המכסה. הביטול מסונכרן עם Takbull – לא יתבצע חיוב נוסף.`,
        success: true,
      });
      setApiStatus((prev) => ({
        ...prev,
        subscription_status: 'canceled',
        auto_renew: false,
      }));
      onRefresh?.();
    } catch (e) {
      setMessage({ text: 'שגיאת רשת. נסה שוב.', success: false });
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = () => {
    const periodEndStr = periodEnd ? formatDate(periodEnd) : 'סיום המכסה';
    setConfirmDialog({
      title: 'לבטל את המנוי?',
      body: `הביטול ייכנס לתוקף מיידית ב-Takbull – לא יתבצע חיוב נוסף. תוכל להמשיך להשתמש בחבילה עד ${periodEndStr} או עד סיום המכסה, המוקדם מביניהם.`,
      confirmLabel: 'כן, בטל מנוי',
      onConfirm: () => {
        setConfirmDialog(null);
        runAction('cancel');
      },
    });
  };

  const handleUpgrade = () => {
    onClose();
    onUpgrade();
  };

  if (!isOpen) return null;

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            padding: 20,
          }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
              border: '2px solid #D4A043',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              direction: 'rtl',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#D4A043', margin: '0 0 12px 0' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#ccc', margin: '0 0 20px 0', lineHeight: 1.6 }}>{confirmDialog.body}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <SecondaryBtn type="button" onClick={() => setConfirmDialog(null)}>חזור</SecondaryBtn>
              <PrimaryBtn type="button" onClick={confirmDialog.onConfirm}>{confirmDialog.confirmLabel}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
      <Box onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <CloseBtn type="button" onClick={onClose} aria-label="סגור">
          ×
        </CloseBtn>
        <Title>מנוי וחיוב</Title>

        <Row><strong>שם החבילה:</strong> {getTierDisplayName(tier)}</Row>
        <Row><strong>סטטוס:</strong> {STATUS_LABELS[status]}</Row>
        {periodEnd && (
          <Row><strong>תאריך סיום תקופה:</strong> {formatDate(periodEnd)}</Row>
        )}
        {!isFree && (maxAnalyses > 0 || maxMinutes > 0) && (
          <Row>
            <strong>מכסה:</strong>{' '}
            {isCoachTier
              ? `דקות: ${usage?.minutesUsed ?? 0} מתוך ${maxMinutes}`
              : `ניתוחים: ${usage?.analysesUsed ?? 0} מתוך ${maxAnalyses}`}
            {!isCoachTier && maxMinutes > 0 && ` | דקות: ${usage?.minutesUsed ?? 0} מתוך ${maxMinutes}`}
          </Row>
        )}
        {!isFree && (
          <Row><strong>חידוש אוטומטי:</strong> {autoRenew ? 'פעיל' : 'כבוי'}</Row>
        )}

        {message && (
          <Message $success={message.success}>{message.text}</Message>
        )}

        <ButtonGroup>
          {showCancel && (
            <SecondaryBtn onClick={handleCancel} disabled={!!loading}>
              {loading === 'cancel' ? 'מעבד...' : 'בטל מנוי'}
            </SecondaryBtn>
          )}
          {showUpgrade && (
            <PrimaryBtn onClick={handleUpgrade}>שדרג מנוי</PrimaryBtn>
          )}
        </ButtonGroup>
      </Box>
    </Overlay>
  );
}
