import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { SubscriptionTier, BillingPeriod, TrackId, UserSubscription } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { fadeIn } from '../../styles/globalStyles';
import { ContactForm } from './ContactForm';

// --- Subscription Modal Styled Components ---
const SubscriptionModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
`;

const SubscriptionModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 20px;
  padding: 40px;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(212, 160, 67, 0.3);
  animation: ${fadeIn} 0.3s ease;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 15px;
  }
`;

const SubscriptionModalHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    color: #D4A043;
    font-size: 2.5rem;
    margin: 0 0 10px 0;
    font-family: 'Frank Ruhl Libre', serif;
  }
  
  p {
    color: #ccc;
    font-size: 1.1rem;
    margin: 0;
  }
`;

const PricingPlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 100%;
  }
`;

const PricingPlanCard = styled.div<{ $popular?: boolean; $isFree?: boolean }>`
  background: ${props => props.$popular 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.15) 0%, rgba(212, 160, 67, 0.05) 100%)'
    : 'rgba(20, 20, 20, 0.8)'};
  border: 2px solid ${props => props.$popular ? '#D4A043' : props.$isFree ? '#666' : '#333'};
  border-radius: 15px;
  padding: 30px 25px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    border-color: ${props => props.$popular ? '#F5C842' : '#D4A043'};
    box-shadow: 0 10px 30px rgba(212, 160, 67, 0.2);
  }

  ${props => props.$popular && `
    &::before {
      content: '${props.$popular ? 'הפופולרי' : ''}';
      position: absolute;
      top: -12px;
      right: 20px;
      background: #D4A043;
      color: #000;
      padding: 4px 15px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
    }
  `}

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 25px;
`;

const PlanName = styled.h3`
  color: #D4A043;
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-family: 'Frank Ruhl Libre', serif;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const PlanBadge = styled.span<{ $color?: string }>`
  display: inline-block;
  background: ${props => props.$color || '#D4A043'};
  color: #000;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 10px;
`;

const PlanDescription = styled.p`
  color: #aaa;
  font-size: 0.95rem;
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 25px;
`;

const PriceAmount = styled.div`
  color: #fff;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 5px;
  
  .currency {
    font-size: 1.2rem;
    margin-left: 5px;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    
    .currency {
      font-size: 1rem;
    }
  }
`;

const PricePeriod = styled.div`
  color: #888;
  font-size: 0.9rem;
`;

const BillingToggle = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  width: fit-content;
  margin: 0 auto 30px;
`;

const BillingToggleButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? '#D4A043' : 'transparent'};
  color: ${props => props.$active ? '#000' : '#888'};
  border: none;
  padding: 8px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.$active ? '#F5C842' : 'rgba(212, 160, 67, 0.1)'};
    color: ${props => props.$active ? '#000' : '#D4A043'};
  }
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 25px 0;

  @media (max-width: 768px) {
    margin: 0 0 15px 0;
  }
`;

const PlanFeature = styled.li<{ $disabled?: boolean }>`
  color: ${props => props.$disabled ? '#555' : '#ccc'};
  font-size: 0.95rem;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  word-wrap: break-word;
  
  &::before {
    content: '${props => props.$disabled ? '✗' : '✓'}';
    color: ${props => props.$disabled ? '#666' : '#D4A043'};
    font-weight: 700;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 6px 0;
  }
`;

const PlanLimits = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
`;

const LimitText = styled.div`
  color: #aaa;
  font-size: 0.85rem;
  margin: 5px 0;
  
  strong {
    color: #D4A043;
  }
`;

const SubscribeButton = styled.button<{ $popular?: boolean; $isFree?: boolean }>`
  width: 100%;
  background: ${props => props.$isFree 
    ? 'rgba(255, 255, 255, 0.1)'
    : props.$popular
    ? 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)'
    : '#D4A043'};
  color: ${props => props.$isFree ? '#aaa' : '#000'};
  border: none;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(212, 160, 67, 0.4);
    background: ${props => props.$isFree 
      ? 'rgba(255, 255, 255, 0.15)'
      : 'linear-gradient(135deg, #F5C842 0%, #D4A043 100%)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseModalButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #444;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(212, 160, 67, 0.2);
    border-color: #D4A043;
  }
`;

const PackagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PackageCard = styled.div<{ $isRecommended?: boolean }>`
  background: ${props => props.$isRecommended 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.15) 0%, rgba(212, 160, 67, 0.05) 100%)' 
    : 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)'};
  border: 2px solid ${props => props.$isRecommended ? '#D4A043' : 'rgba(212, 160, 67, 0.3)'};
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  position: relative;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(212, 160, 67, 0.3);
    border-color: #D4A043;
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: #D4A043;
  color: #000;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: #D4A043;
  color: #000;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const PremiumBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 20px;
  background: linear-gradient(135deg, #FF8C00 0%, #FFA500 100%);
  color: #000;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(255, 140, 0, 0.4);
`;

const PackageTitle = styled.h3`
  color: #D4A043;
  font-size: 1.5rem;
  margin: 0 0 10px 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

const PackageSubtitle = styled.div`
  color: #D4A043;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
`;

const PackageFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 25px 0;
  text-align: right;
  
  li {
    color: #ccc;
    font-size: 0.9rem;
    margin-bottom: 8px;
    padding-right: 20px;
    position: relative;

    &::before {
      content: '✓';
      position: absolute;
      right: 0;
      color: #D4A043;
      font-weight: bold;
    }

    &.unavailable {
      opacity: 0.5;
      
      &::before {
        content: '✗';
        color: #666;
      }
    }
  }
`;

const PackageButton = styled.button`
  width: 100%;
  background: #D4A043;
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #F5C842;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(212, 160, 67, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ComparisonTable = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid #333;
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  margin-top: 30px;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    margin: 20px -20px 0 -20px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(3, 1fr);
  background: rgba(212, 160, 67, 0.1);
  border-bottom: 2px solid #D4A043;
  padding: 15px;
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 150px repeat(3, 1fr);
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 75px repeat(3, minmax(75px, 1fr));
    padding: 8px 6px;
    gap: 2px;
    font-size: 0.7rem;
  }
`;

const TableHeaderCell = styled.div`
  color: #D4A043;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    line-height: 1.2;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(3, 1fr);
  padding: 15px;
  border-bottom: 1px solid #222;
  gap: 10px;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(212, 160, 67, 0.05);
  }

  @media (max-width: 900px) {
    grid-template-columns: 150px repeat(3, 1fr);
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 75px repeat(3, minmax(75px, 1fr));
    padding: 5px 6px;
    gap: 2px;
    font-size: 0.7rem;
  }
`;

const TableLabel = styled.div`
  color: #aaa;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: right;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    line-height: 1.2;
  }
`;

const TableCell = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const TIER_ORDER: Record<SubscriptionTier, number> = {
  'free': 0,
  'creator': 1,
  'pro': 2,
  'coach': 3,
  'coach-pro': 4,
};

/** שדרוג אפשרי רק לחבילה גבוהה מהנוכחית; חבילה נוכחית או נמוכה יותר – לא לחיץ */
function canUpgradeTo(planTier: SubscriptionTier, currentTier: SubscriptionTier | undefined): boolean {
  if (!currentTier || currentTier === 'free') return planTier !== 'free';
  return TIER_ORDER[planTier] > TIER_ORDER[currentTier];
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: UserSubscription | null;
  onSelectPlan: (tier: SubscriptionTier, period: BillingPeriod) => void;
  activeTrack?: TrackId;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onSelectPlan,
  activeTrack,
}) => {
  const { t } = useTranslation();
  // All hooks must be called before any conditional returns
  const [selectedPeriods, setSelectedPeriods] = useState<Record<SubscriptionTier, BillingPeriod>>({
    free: 'monthly',
    creator: 'monthly',
    pro: 'monthly',
    coach: 'monthly',
    'coach-pro': 'monthly',
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null);

  // Reset processing when modal closes so it never stays stuck
  useEffect(() => {
    if (!isOpen) setProcessingTier(null);
  }, [isOpen]);

  // Safety: if processing takes too long (e.g. network hang), reset so user can retry
  useEffect(() => {
    if (!processingTier) return;
    const t = setTimeout(() => setProcessingTier(null), 15000);
    return () => clearTimeout(t);
  }, [processingTier]);

  // Conditional return after all hooks
  if (!isOpen) return null;

  const handlePeriodChange = (tier: SubscriptionTier, period: BillingPeriod) => {
    setSelectedPeriods(prev => ({ ...prev, [tier]: period }));
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (processingTier) {
      console.warn('⚠️ SubscriptionModal: Already processing, ignoring duplicate call');
      return;
    }
    
    console.log('🎯 SubscriptionModal: handleSelectPlan called', { tier, period: selectedPeriods[tier] });
    setProcessingTier(tier);
    
    try {
      await onSelectPlan(tier, selectedPeriods[tier]);
    } catch (error) {
      console.error('❌ Error in SubscriptionModal handleSelectPlan:', error);
      throw error;
    } finally {
      setTimeout(() => setProcessingTier(null), 400);
    }
  };

  const getFeatureText = (tier: SubscriptionTier, feature: string): string => {
    const plan = SUBSCRIPTION_PLANS[tier];
    const tf = (key: string, opts?: object) => t(key, opts);
    switch (feature) {
      case 'analyses':
        if (tier === 'coach' || tier === 'coach-pro') return '';
        if (plan.limits.maxAnalysesPerPeriod === -1) return tf('subscription.features.unlimited');
        if (tier === 'free') return tf('subscription.features.trialAnalysis');
        return tf('subscription.features.analysesPerMonth', { count: plan.limits.maxAnalysesPerPeriod });
      case 'minutes':
        if (tier === 'free' || tier === 'coach' || tier === 'coach-pro') return '';
        return tf('subscription.features.minutesPerMonth', { count: plan.limits.maxVideoMinutesPerPeriod });
      case 'coachMinutes':
        if (tier === 'coach') return tf('subscription.features.coachMinutes200');
        if (tier === 'coach-pro') return tf('subscription.features.coachMinutes300');
        return '';
      case 'analysesUnlimited':
        if ((tier === 'coach' || tier === 'coach-pro') && plan.limits.maxAnalysesPerPeriod === -1) return tf('subscription.features.unlimitedAnalyses');
        return '';
      case 'videoLength':
        const seconds = plan.limits.maxVideoSeconds;
        const mb = Math.round(plan.limits.maxFileBytes / (1024 * 1024));
        if (seconds >= 60) return tf('subscription.features.videoLength', { minutes: Math.floor(seconds / 60), mb });
        return tf('subscription.features.videoLengthSeconds', { seconds, mb });
      case 'experts':
        return tier === 'free' ? tf('subscription.features.experts3') : tf('subscription.features.expertsAll');
      case 'tracks':
        if (tier === 'free') return tf('subscription.features.tracks1');
        if (tier === 'creator') return tf('subscription.features.tracks2');
        return tf('subscription.features.tracksAll');
      case 'trainees':
        if (tier === 'coach' || tier === 'coach-pro') {
          if (plan.limits.maxTrainees === -1) return tf('subscription.features.unlimited');
          return tf('subscription.features.traineesUpTo', { count: plan.limits.maxTrainees });
        }
        return '';
      case 'pdfExport':
        return plan.limits.features.pdfExport ? '✓' : '✗';
      case 'advancedAnalysis':
        return plan.limits.features.advancedAnalysis ? '✓' : '✗';
      case 'videoComparison':
        return plan.limits.features.comparison ? '✓' : '✗';
      case 'traineeManagement':
        return (tier === 'coach' || tier === 'coach-pro') && plan.limits.features.traineeManagement ? '✓' : '✗';
      case 'coachDashboard':
        return (tier === 'coach' || tier === 'coach-pro') && plan.limits.features.coachDashboard ? '✓' : '✗';
      default:
        return '';
    }
  };

  return (
    <SubscriptionModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <SubscriptionModalContent>
        <CloseModalButton onClick={onClose}>×</CloseModalButton>
        <SubscriptionModalHeader>
          <h2 style={{ fontSize: '3rem', marginBottom: '15px' }}>{t('coachPackages.title')}</h2>
          <p style={{ fontSize: '1.2rem', color: '#D4A043' }}>
            {t('coachPackages.subtitle')}
          </p>
        </SubscriptionModalHeader>

        {/* Show regular plans (free, creator, pro) in PackageSelectionModal format */}
        {!(currentSubscription?.tier === 'coach' || currentSubscription?.tier === 'coach-pro' || activeTrack === 'coach') && (
          <>
            <PackagesGrid>
              {[
                { tier: 'free' as SubscriptionTier, subtitleKey: 'billingPlan.freeSubtitle' },
                { tier: 'creator' as SubscriptionTier, subtitleKey: 'billingPlan.creatorSubtitle', recommended: true },
                { tier: 'pro' as SubscriptionTier, subtitleKey: 'billingPlan.proSubtitle' },
              ].map((plan) => {
                const planData = SUBSCRIPTION_PLANS[plan.tier];
                const isCurrentTier = plan.tier === currentSubscription?.tier;
                const currentTier = currentSubscription?.tier;
                // Never allow "upgrade" to free or to a lower tier (שדרוג אחורה)
                const allowUpgrade = plan.tier === 'free' ? false : canUpgradeTo(plan.tier, currentTier);
                return (
                  <PackageCard key={plan.tier} $isRecommended={plan.recommended}>
                    {plan.recommended && <RecommendedBadge>{t('billing.recommended')}</RecommendedBadge>}
                    {isCurrentTier && <ActiveBadge>{t('billing.activePlan')}</ActiveBadge>}
                    <PackageTitle>{t(`plan.${plan.tier}`)}</PackageTitle>
                    <PackageSubtitle>{t((plan as any).subtitleKey || 'billingPlan.freeSubtitle')}</PackageSubtitle>
                    <PackageFeatures>
                      <li>{getFeatureText(plan.tier, 'analyses')}</li>
                      {getFeatureText(plan.tier, 'minutes') && <li>{getFeatureText(plan.tier, 'minutes')}</li>}
                      <li>{getFeatureText(plan.tier, 'videoLength')}</li>
                      <li>{getFeatureText(plan.tier, 'experts')}</li>
                      <li>{getFeatureText(plan.tier, 'tracks')}</li>
                      <li className={planData.limits.features.pdfExport ? '' : 'unavailable'}>
                        {t('billingPlan.pdfExport')}
                      </li>
                      <li className={planData.limits.features.advancedAnalysis ? '' : 'unavailable'}>
                        {t('billingPlan.advancedAnalysis')}
                      </li>
                      <li className={planData.limits.features.comparison ? '' : 'unavailable'}>
                        {t('billingPlan.videoComparison')}
                      </li>
                    </PackageFeatures>
                    {allowUpgrade && !isCurrentTier && plan.tier !== 'free' && currentSubscription && (
                      <div style={{
                        padding: '8px 12px',
                        margin: '10px 0',
                        background: 'rgba(212, 160, 67, 0.1)',
                        border: '1px solid rgba(212, 160, 67, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#D4A043',
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}>
                        ✨ {t('billing.upgradeNote')}
                      </div>
                    )}
                    <PackageButton
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (allowUpgrade && !processingTier) {
                          await handleSelectPlan(plan.tier);
                        }
                      }}
                      disabled={!allowUpgrade || processingTier !== null}
                    >
                      {processingTier === plan.tier ? t('subscriptionModal.processing') : isCurrentTier ? t('subscriptionModal.activePlan') : !allowUpgrade ? t('subscriptionModal.unavailable') : plan.tier === 'free' ? t('subscriptionModal.startFree') : t('subscriptionModal.upgradeNow')}
                    </PackageButton>
                  </PackageCard>
                );
              })}
            </PackagesGrid>

            <ComparisonTable>
              <TableHeader>
                <TableHeaderCell>{t('comparisonFeature')}</TableHeaderCell>
                <TableHeaderCell>{t('plan.free')}</TableHeaderCell>
                <TableHeaderCell>{t('plan.creator')}</TableHeaderCell>
                <TableHeaderCell>{t('plan.pro')}</TableHeaderCell>
              </TableHeader>
              <TableRow>
                <TableLabel>{t('comparisonMonthlyAnalyses')}</TableLabel>
                <TableCell>{getFeatureText('free', 'analyses')}</TableCell>
                <TableCell>{getFeatureText('creator', 'analyses')}</TableCell>
                <TableCell>{getFeatureText('pro', 'analyses')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('comparisonMinutes')}</TableLabel>
                <TableCell>-</TableCell>
                <TableCell>{getFeatureText('creator', 'minutes')}</TableCell>
                <TableCell>{getFeatureText('pro', 'minutes')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('comparisonVideoLength')}</TableLabel>
                <TableCell>{getFeatureText('free', 'videoLength')}</TableCell>
                <TableCell>{getFeatureText('creator', 'videoLength')}</TableCell>
                <TableCell>{getFeatureText('pro', 'videoLength')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('comparisonExperts')}</TableLabel>
                <TableCell>{getFeatureText('free', 'experts')}</TableCell>
                <TableCell>{getFeatureText('creator', 'experts')}</TableCell>
                <TableCell>{getFeatureText('pro', 'experts')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('comparisonTracks')}</TableLabel>
                <TableCell>{getFeatureText('free', 'tracks')}</TableCell>
                <TableCell>{getFeatureText('creator', 'tracks')}</TableCell>
                <TableCell>{getFeatureText('pro', 'tracks')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('billingPlan.pdfExport')}</TableLabel>
                <TableCell>{getFeatureText('free', 'pdfExport')}</TableCell>
                <TableCell>{getFeatureText('creator', 'pdfExport')}</TableCell>
                <TableCell>{getFeatureText('pro', 'pdfExport')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('billingPlan.advancedAnalysis')}</TableLabel>
                <TableCell>{getFeatureText('free', 'advancedAnalysis')}</TableCell>
                <TableCell>{getFeatureText('creator', 'advancedAnalysis')}</TableCell>
                <TableCell>{getFeatureText('pro', 'advancedAnalysis')}</TableCell>
              </TableRow>
              <TableRow>
                <TableLabel>{t('billingPlan.videoComparison')}</TableLabel>
                <TableCell>{getFeatureText('free', 'videoComparison')}</TableCell>
                <TableCell>{getFeatureText('creator', 'videoComparison')}</TableCell>
                <TableCell>{getFeatureText('pro', 'videoComparison')}</TableCell>
              </TableRow>
            </ComparisonTable>
          </>
        )}

        {/* Show coach plans in PackageSelectionModal format */}
        {(currentSubscription?.tier === 'coach' || currentSubscription?.tier === 'coach-pro' || activeTrack === 'coach') && (
          <>
            <PackagesGrid>
              {(currentSubscription?.tier === 'coach'
                ? [{ tier: 'coach-pro' as SubscriptionTier, subtitleKey: 'coachPackages.price299', recommended: true }]
                : currentSubscription?.tier === 'coach-pro'
                ? []
                : activeTrack === 'coach'
                ? [
                    { tier: 'coach' as SubscriptionTier, subtitleKey: 'coachPackages.price199' },
                    { tier: 'coach-pro' as SubscriptionTier, subtitleKey: 'coachPackages.price299', recommended: true }
                  ]
                : []
              ).map((plan) => {
                const planData = SUBSCRIPTION_PLANS[plan.tier];
                const isCurrentTier = plan.tier === currentSubscription?.tier;
                const currentTier = currentSubscription?.tier;
                const allowUpgrade = canUpgradeTo(plan.tier, currentTier);
                return (
                  <PackageCard key={plan.tier} $isRecommended={plan.recommended}>
                    {plan.recommended && <RecommendedBadge>{t('billing.recommended')}</RecommendedBadge>}
                    {plan.tier === 'coach-pro' && <PremiumBadge>{t('plan.proVersion')}</PremiumBadge>}
                    {isCurrentTier && <ActiveBadge>{t('billing.activePlan')}</ActiveBadge>}
                    <PackageTitle>{t(`plan.${plan.tier}`)}</PackageTitle>
                    <PackageSubtitle>{(plan as any).subtitleKey ? t((plan as any).subtitleKey) : (plan as any).subtitle}</PackageSubtitle>
                    <PackageFeatures>
                      {getFeatureText(plan.tier, 'analysesUnlimited') && <li>{getFeatureText(plan.tier, 'analysesUnlimited')}</li>}
                      {getFeatureText(plan.tier, 'coachMinutes') && <li>{getFeatureText(plan.tier, 'coachMinutes')}</li>}
                      {getFeatureText(plan.tier, 'videoLength') && <li>{getFeatureText(plan.tier, 'videoLength')}</li>}
                      {getFeatureText(plan.tier, 'experts') && <li>{getFeatureText(plan.tier, 'experts')}</li>}
                      {getFeatureText(plan.tier, 'tracks') && <li>{getFeatureText(plan.tier, 'tracks')}</li>}
                      {getFeatureText(plan.tier, 'trainees') && <li>{getFeatureText(plan.tier, 'trainees')}</li>}
                      <li className={planData.limits.features.pdfExport ? '' : 'unavailable'}>
                        {t('billingPlan.pdfExport')}
                      </li>
                      <li className={planData.limits.features.advancedAnalysis ? '' : 'unavailable'}>
                        {t('billingPlan.advancedAnalysis')}
                      </li>
                      <li className={planData.limits.features.comparison ? '' : 'unavailable'}>
                        {t('billingPlan.videoComparison')}
                      </li>
                      {(plan.tier === 'coach' || plan.tier === 'coach-pro') && (
                        <>
                          <li className={planData.limits.features.traineeManagement ? '' : 'unavailable'}>
                            {t('coachTrack.traineeManagement')}
                          </li>
                          <li className={planData.limits.features.coachDashboard ? '' : 'unavailable'}>
                            {t('coachTrack.coachDashboard')}
                          </li>
                        </>
                      )}
                    </PackageFeatures>
                    {allowUpgrade && !isCurrentTier && currentSubscription && (
                      <div style={{
                        padding: '8px 12px',
                        margin: '10px 0',
                        background: 'rgba(212, 160, 67, 0.1)',
                        border: '1px solid rgba(212, 160, 67, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#D4A043',
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}>
                        ✨ {t('billing.upgradeNote')}
                      </div>
                    )}
                    <PackageButton
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (allowUpgrade && !processingTier) {
                          await handleSelectPlan(plan.tier);
                        }
                      }}
                      disabled={!allowUpgrade || processingTier !== null}
                    >
                      {processingTier === plan.tier ? t('subscriptionModal.processing') : isCurrentTier ? t('subscriptionModal.activePlan') : !allowUpgrade ? t('subscriptionModal.unavailable') : t('subscriptionModal.upgradeNow')}
                    </PackageButton>
                  </PackageCard>
                );
              })}
            </PackagesGrid>

            {/* Comparison Table for Coach Plans */}
            {activeTrack === 'coach' && (currentSubscription?.tier !== 'coach' && currentSubscription?.tier !== 'coach-pro') && (
              <ComparisonTable>
                <TableHeader>
                  <TableHeaderCell>{t('comparisonFeature')}</TableHeaderCell>
                  <TableHeaderCell>{t('plan.coach')}</TableHeaderCell>
                  <TableHeaderCell>{t('plan.coachPro')}</TableHeaderCell>
                </TableHeader>
                <TableRow>
                  <TableLabel>{t('comparisonMonthlyAnalyses')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'analysesUnlimited')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'analysesUnlimited')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('comparisonMinutes')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'coachMinutes')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'coachMinutes')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('comparisonVideoLength')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'videoLength')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'videoLength')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('comparisonExperts')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'experts')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'experts')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('comparisonTrainees')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'trainees')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'trainees')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('billingPlan.pdfExport')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'pdfExport')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'pdfExport')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('billingPlan.advancedAnalysis')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'advancedAnalysis')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'advancedAnalysis')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('billingPlan.videoComparison')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'videoComparison')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'videoComparison')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('coachTrack.traineeManagement')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'traineeManagement')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'traineeManagement')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableLabel>{t('coachTrack.coachDashboard')}</TableLabel>
                  <TableCell>{getFeatureText('coach', 'coachDashboard')}</TableCell>
                  <TableCell>{getFeatureText('coach-pro', 'coachDashboard')}</TableCell>
                </TableRow>
              </ComparisonTable>
            )}
          </>
        )}

        {/* No-commitment CTA */}
        <div style={{ 
          background: 'rgba(212, 160, 67, 0.1)', 
          padding: '30px', 
          borderRadius: '15px', 
          marginTop: '40px',
          textAlign: 'center',
          border: '1px solid rgba(212, 160, 67, 0.3)'
        }}>
          <h3 style={{ color: '#D4A043', fontSize: '2rem', margin: '0 0 15px 0', fontFamily: "'Frank Ruhl Libre', serif" }}>
            {t('subscription.noCommitmentTitle')}
          </h3>
          <div style={{ color: '#D4A043', fontSize: '1.3rem', lineHeight: '1.6', fontWeight: 700 }}>
            <p style={{ margin: '0 0 6px 0' }}>{t('subscription.noCommitmentLine1')}</p>
            <p style={{ margin: 0 }}>{t('subscription.noCommitmentLine2')}</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ marginTop: '50px' }}>
          <h3 style={{ 
            color: '#D4A043', 
            fontSize: '2rem', 
            margin: '0 0 30px 0', 
            textAlign: 'center',
            fontFamily: "'Frank Ruhl Libre', serif" 
          }}>
            {t('subscription.faqTitle')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <div 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 160, 67, 0.2)',
                  borderRadius: '10px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ 
                    color: '#D4A043', 
                    fontSize: '1.2rem',
                    transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}>
                    ▼
                  </span>
                  <h4 style={{ 
                    color: '#fff', 
                    margin: 0, 
                    fontSize: '1.1rem',
                    flex: 1,
                    textAlign: 'right'
                  }}>
                    {t(`subscription.faq${index}q`)}
                  </h4>
                </div>
                {expandedFaq === index && (
                  <p style={{ 
                    color: '#ccc', 
                    margin: '15px 0 0 35px', 
                    lineHeight: '1.6',
                    textAlign: 'right'
                  }}>
                    {t(`subscription.faq${index}a`)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
          <h3 style={{ 
            color: '#D4A043', 
            fontSize: '1.8rem', 
            margin: '0 0 20px 0',
            fontFamily: "'Frank Ruhl Libre', serif"
          }}>
            {t('subscription.contactTitle')}
          </h3>
          {!showContactForm ? (
            <>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                {t('subscription.contactDesc')}
              </p>
              <SubscribeButton 
                onClick={() => setShowContactForm(true)}
                $popular={false}
                $isFree={false}
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                {t('subscription.sendMessage')}
              </SubscribeButton>
            </>
          ) : (
            <ContactForm 
              onClose={() => setShowContactForm(false)}
              sourceUrl={`${window.location.origin}/subscription`}
            />
          )}
        </div>
      </SubscriptionModalContent>
    </SubscriptionModalOverlay>
  );
};

