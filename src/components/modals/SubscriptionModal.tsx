import React, { useState } from 'react';
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
    grid-template-columns: 1fr;
    gap: 20px;
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
`;

const PlanFeature = styled.li<{ $disabled?: boolean }>`
  color: ${props => props.$disabled ? '#555' : '#ccc'};
  font-size: 0.95rem;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: '${props => props.$disabled ? '✗' : '✓'}';
    color: ${props => props.$disabled ? '#666' : '#D4A043'};
    font-weight: 700;
    font-size: 1.2rem;
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
  const [selectedPeriods, setSelectedPeriods] = useState<Record<SubscriptionTier, BillingPeriod>>({
    free: 'monthly',
    creator: 'monthly',
    pro: 'monthly',
    coach: 'monthly',
    'coach-pro': 'monthly',
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  if (!isOpen) return null;

  const handlePeriodChange = (tier: SubscriptionTier, period: BillingPeriod) => {
    setSelectedPeriods(prev => ({ ...prev, [tier]: period }));
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    console.log('🎯 SubscriptionModal: handleSelectPlan called', { tier, period: selectedPeriods[tier] });
    // Call parent's onSelectPlan - this should handle payment initiation
    await onSelectPlan(tier, selectedPeriods[tier]);
  };


  const faqItems = [
    {
      question: 'האם אני יכול לבטל את המנוי בכל עת?',
      answer: 'כן, אתה יכול לבטל את המנוי בכל עת. המנוי יישאר פעיל עד סוף תקופת החיוב הנוכחית.',
    },
    {
      question: 'מה קורה אם אני עובר את מכסת הניתוחים?',
      answer: 'כשתגיע למכסה, תוכל לשדרג לחבילה גבוהה יותר או להמתין לחידוש החודשי. אנחנו לא מחייבים אוטומטית.',
    },
    {
      question: 'האם יש התחייבות לתקופה מסוימת?',
      answer: 'לא, כל החבילות הן חודשיות ללא התחייבות. אתה משלם רק על מה שאתה משתמש.',
    },
    {
      question: 'איך עובד ניתוח הווידאו?',
      answer: 'פשוט מעלים את הסרטון או התמונה, מוסיפים הקשר אם רוצים, וה-AI שלנו מנתח את התוכן עם 8 מומחים וירטואליים: במאי, מלהק, תסריטאי, מאמן משחק, צלם, עורך סאונד, סטייליסט ומפיק.',
    },
    {
      question: 'האם אפשר לקבל החזר כספי?',
      answer: 'כן, יש לנו מדיניות החזר של 7 ימים. אם אתה לא מרוצה, פנה אלינו ונחזיר לך את הכסף.',
    },
  ];

  return (
    <SubscriptionModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <SubscriptionModalContent>
        <CloseModalButton onClick={onClose}>×</CloseModalButton>
        <SubscriptionModalHeader>
          <h2 style={{ fontSize: '3rem', marginBottom: '15px' }}>בחר את החבילה שלך</h2>
          <p style={{ fontSize: '1.2rem', color: '#D4A043' }}>
            שדרג את יכולות יצירת התוכן שלך עם ניתוחים מקצועיים ברמה הוליוודית
          </p>
        </SubscriptionModalHeader>

        <PricingPlansGrid>
          {(currentSubscription?.tier === 'coach'
            ? [SUBSCRIPTION_PLANS['coach-pro']] // Only show PRO upgrade for coach users
            : currentSubscription?.tier === 'coach-pro'
            ? [] // No upgrades available for coach-pro (it's the highest tier)
            : activeTrack === 'coach'
            ? [SUBSCRIPTION_PLANS.coach, SUBSCRIPTION_PLANS['coach-pro']] // Show both coach plans for coach track users without coach subscription
            : Object.values(SUBSCRIPTION_PLANS).filter(p => p.id !== 'coach-pro' && p.id !== 'coach')
          ).map(plan => {
            const isCurrentPlan = currentSubscription?.tier === plan.id;
            const isUpgrade = !currentSubscription || 
              (currentSubscription.tier === 'free' && plan.id !== 'free') ||
              (currentSubscription.tier === 'creator' && plan.id === 'pro') ||
              (currentSubscription.tier === 'creator' && (plan.id === 'coach' || plan.id === 'coach-pro')) ||
              (currentSubscription.tier === 'pro' && (plan.id === 'coach' || plan.id === 'coach-pro')) ||
              (currentSubscription.tier === 'coach' && plan.id === 'coach-pro');
            
            const selectedPeriod = selectedPeriods[plan.id];
            const price = selectedPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            // For coach and coach-pro tiers, hide analyses limit (don't show "unlimited")
            const analysesLimit = (plan.id === 'coach' || plan.id === 'coach-pro')
              ? null // Don't show analyses limit for coach tiers
              : plan.limits.maxAnalysesPerPeriod === -1 
              ? 'ללא הגבלה' 
              : plan.limits.maxAnalysesPerPeriod === 2
              ? `${plan.limits.maxAnalysesPerPeriod} ניתוחים בסך הכל`
              : selectedPeriod === 'yearly'
              ? `${plan.limits.maxAnalysesPerPeriod * 12} ניתוחים בשנה`
              : `${plan.limits.maxAnalysesPerPeriod} ניתוחים בחודש`;
            
            const maxSeconds = plan.limits.maxVideoSeconds;
            const maxMB = plan.limits.maxFileBytes / (1024 * 1024);
            const durationText = maxSeconds >= 60 
              ? `${Math.floor(maxSeconds / 60)} דקות`
              : `${maxSeconds} שניות`;
            
            // Monthly video minutes limit
            const videoMinutesLimit = plan.limits.maxVideoMinutesPerPeriod > 0
              ? `${plan.limits.maxVideoMinutesPerPeriod} דקות בחודש`
              : null;
            
            // Max trainees (for coach tiers)
            const maxTraineesText = plan.limits.maxTrainees !== undefined
              ? plan.limits.maxTrainees === -1
                ? 'ללא הגבלה'
                : `עד ${plan.limits.maxTrainees} מתאמנים`
              : null;

            return (
              <PricingPlanCard 
                key={plan.id}
                $popular={plan.popular}
                $isFree={plan.id === 'free'}
                onClick={(e) => {
                  // Prevent card click from interfering with button click
                  e.stopPropagation();
                }}
              >
                <PlanHeader>
                  <PlanName>
                    {plan.name}
                  </PlanName>
                  {plan.id === 'coach-pro' && plan.description && plan.badge ? (
                    <div style={{ 
                      marginTop: '8px',
                      marginBottom: '20px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <PlanDescription style={{ margin: 0, display: 'inline' }}>
                        {plan.description}
                      </PlanDescription>
                      <PlanBadge $color="#FF8C00" style={{ 
                        position: 'static',
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        verticalAlign: 'middle'
                      }}>
                        {plan.badge}
                      </PlanBadge>
                    </div>
                  ) : plan.description ? (
                    <PlanDescription>{plan.description}</PlanDescription>
                  ) : plan.badge && plan.id !== 'coach-pro' ? (
                    <div style={{ 
                      marginTop: '8px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <PlanBadge $color={(plan.id === 'coach') ? '#D4A043' : undefined}>
                        {plan.badge}
                      </PlanBadge>
                    </div>
                  ) : null}
                </PlanHeader>

                {plan.id !== 'free' && (
                  <BillingToggle style={{ marginBottom: '20px', width: '100%' }}>
                    <BillingToggleButton 
                      $active={selectedPeriods[plan.id] === 'monthly'}
                      onClick={() => handlePeriodChange(plan.id, 'monthly')}
                    >
                      חודשי
                    </BillingToggleButton>
                    <BillingToggleButton 
                      $active={selectedPeriods[plan.id] === 'yearly'}
                      onClick={() => handlePeriodChange(plan.id, 'yearly')}
                    >
                      שנתי
                      <span style={{ fontSize: '0.8rem', marginRight: '5px', color: '#D4A043' }}>
                        (חיסכון 17%)
                      </span>
                    </BillingToggleButton>
                  </BillingToggle>
                )}

                <PlanPrice>
                  {plan.id === 'free' ? (
                    <PriceAmount>₪0</PriceAmount>
                  ) : (
                    <>
                      <PriceAmount>
                        ₪{price}
                        <span className="currency">{selectedPeriod === 'yearly' ? '/שנה' : '/חודש'}</span>
                      </PriceAmount>
                      {selectedPeriod === 'yearly' && (
                        <PricePeriod>
                          ₪{Math.round(price / 12)}/חודש (חיסכון 17%)
                        </PricePeriod>
                      )}
                    </>
                  )}
                </PlanPrice>

                <PlanLimits>
                  {analysesLimit && (
                    <LimitText>
                      <strong>{analysesLimit}</strong>
                    </LimitText>
                  )}
                  <LimitText>
                    עד <strong>{durationText}</strong> או <strong>{maxMB}MB</strong>
                  </LimitText>
                  {videoMinutesLimit && (
                    <LimitText>
                      <strong>{videoMinutesLimit}</strong>
                    </LimitText>
                  )}
                  {maxTraineesText && (
                    <LimitText>
                      <strong>{maxTraineesText}</strong>
                    </LimitText>
                  )}
                </PlanLimits>

                <PlanFeatures>
                  <PlanFeature $disabled={!plan.limits.features.saveHistory}>
                    שמירת היסטוריה
                  </PlanFeature>
                  <PlanFeature $disabled={!plan.limits.features.improvementTracking}>
                    מעקב שיפור
                  </PlanFeature>
                  <PlanFeature $disabled={!plan.limits.features.comparison}>
                    השוואה בין סרטונים
                  </PlanFeature>
                  <PlanFeature $disabled={!plan.limits.features.advancedAnalysis}>
                    ניתוח מתקדם
                  </PlanFeature>
                  <PlanFeature $disabled={!plan.limits.features.pdfExport}>
                    יצוא PDF
                  </PlanFeature>
                  {(plan.id === 'coach' || plan.id === 'coach-pro') && (
                    <>
                      <PlanFeature $disabled={!plan.limits.features.traineeManagement}>
                        ניהול מתאמנים
                      </PlanFeature>
                      <PlanFeature $disabled={!plan.limits.features.coachDashboard}>
                        דשבורד מאמן
                      </PlanFeature>
                    </>
                  )}
                  {plan.id === 'creator' ? (
                    <PlanFeature $disabled={false}>
                      אפשרות לבחירת תחום ניתוח נוסף
                    </PlanFeature>
                  ) : (
                    <PlanFeature $disabled={!plan.limits.features.customExperts}>
                      בחירת מומחים מותאמת
                    </PlanFeature>
                  )}
                </PlanFeatures>

                <SubscribeButton
                  $popular={plan.popular}
                  $isFree={plan.id === 'free'}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isCurrentPlan) {
                      console.log('🔔 SubscribeButton clicked for plan:', plan.id);
                      await handleSelectPlan(plan.id);
                    }
                  }}
                  disabled={isCurrentPlan}
                  type="button"
                >
                  {isCurrentPlan 
                    ? 'החבילה הנוכחית שלך'
                    : plan.id === 'free'
                    ? 'התחל חינם'
                    : isUpgrade
                    ? 'שדרג עכשיו'
                    : 'בחר חבילה'}
                </SubscribeButton>
              </PricingPlanCard>
            );
          })}
        </PricingPlansGrid>

        {/* 7-Day Refund Policy */}
        <div style={{ 
          background: 'rgba(212, 160, 67, 0.1)', 
          padding: '30px', 
          borderRadius: '15px', 
          marginTop: '40px',
          textAlign: 'center',
          border: '1px solid rgba(212, 160, 67, 0.3)'
        }}>
          <h3 style={{ color: '#D4A043', fontSize: '2rem', margin: '0 0 15px 0', fontFamily: "'Frank Ruhl Libre', serif" }}>
            אחריות 7 ימים - החזר מלא
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0, lineHeight: '1.6' }}>
              לא מרוצה? אנחנו מחזירים לך את הכסף בלי שאלות
            </p>
            <p style={{ color: '#D4A043', fontSize: '1.3rem', margin: 0, lineHeight: '1.6', fontWeight: 700 }}>
              אנחנו בטוחים שתאהב את השירות
            </p>
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
            שאלות נפוצות
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {faqItems.map((faq, index) => (
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
                    {faq.question}
                  </h4>
                </div>
                {expandedFaq === index && (
                  <p style={{ 
                    color: '#ccc', 
                    margin: '15px 0 0 35px', 
                    lineHeight: '1.6',
                    textAlign: 'right'
                  }}>
                    {faq.answer}
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
            שאלות נוספות או צורך בביטול?
          </h3>
          {!showContactForm ? (
            <>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                יש לך שאלות? שלח לנו הודעה ונחזור אליך בהקדם
              </p>
              <SubscribeButton 
                onClick={() => setShowContactForm(true)}
                $popular={false}
                $isFree={false}
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                שלח הודעה
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

