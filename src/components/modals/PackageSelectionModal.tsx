import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { fadeIn } from '../../styles/globalStyles';
import { SUBSCRIPTION_PLANS, TEST_ACCOUNT_EMAIL } from '../../constants';
import type { SubscriptionTier } from '../../types';

// --- Package Selection Modal Styled Components ---
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 20000;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 20px;
  padding: 40px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(212, 160, 67, 0.4);
  animation: ${fadeIn} 0.4s ease;
  position: relative;

  @media (max-width: 768px) {
    padding: 30px 20px;
    border-radius: 15px;
    width: 98%;
    max-height: 95vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: transparent;
  border: none;
  color: #D4A043;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    background: rgba(212, 160, 67, 0.2);
    transform: rotate(90deg);
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    color: #D4A043;
    font-size: 2rem;
    margin: 0 0 10px 0;
    font-family: 'Frank Ruhl Libre', serif;

    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
  
  p {
    color: #ccc;
    font-size: 1rem;
    margin: 0;
    line-height: 1.6;

    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
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

  @media (max-width: 768px) {
    padding: 20px 15px;
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

const PackageTitle = styled.h3`
  color: #D4A043;
  font-size: 1.5rem;
  margin: 0 0 10px 0;
  font-family: 'Frank Ruhl Libre', serif;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
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
    word-wrap: break-word;

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

    @media (max-width: 768px) {
      font-size: 0.85rem;
      margin-bottom: 6px;
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

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tier: SubscriptionTier) => void;
  userEmail?: string;
  currentTier?: SubscriptionTier;
}

export const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  userEmail,
  currentTier = 'free'
}) => {
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const isTestAccount = userEmail?.trim().toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();

  const handlePackageSelect = async (tier: SubscriptionTier, e?: React.MouseEvent) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (loading) {
      console.warn('⚠️ PackageSelectionModal: Already processing, ignoring duplicate call');
      return;
    }
    
    // Don't allow selecting current tier
    if (tier === currentTier) {
      return;
    }
    
    setLoading(tier);
    
    // For paid tiers, don't update directly - let parent handle payment
    const isPaidTier = tier !== 'free';
    if (isPaidTier) {
      // Just call onSelect - parent will handle payment through handleSelectPlan
      // Don't close modal here - let parent handle it after payment starts
      try {
        await onSelect(tier);
      } catch (error) {
        console.error('❌ Error in onSelect:', error);
        setLoading(null);
      }
      return;
    }
    
    // Only for FREE tier - update directly
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('שגיאה: משתמש לא מחובר');
        setLoading(null);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating subscription tier:', updateError);
        alert('שגיאה בעדכון החבילה. נסה שוב.');
        setLoading(null);
        return;
      }

      onSelect(tier);
      onClose();
    } catch (err: any) {
      console.error('Error saving package selection:', err);
      alert('שגיאה בשמירת הבחירה. נסה שוב.');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  const plans = [
    { tier: 'free' as SubscriptionTier, name: 'ניסיון', subtitle: 'חינם' },
    { tier: 'creator' as SubscriptionTier, name: 'יוצרים', subtitle: '₪49', recommended: true },
    { tier: 'pro' as SubscriptionTier, name: 'יוצרים באקסטרים', subtitle: '₪99' },
  ];

  const getFeatureText = (tier: SubscriptionTier, feature: string): string => {
    const plan = SUBSCRIPTION_PLANS[tier];
    switch (feature) {
      case 'analyses':
        if (plan.limits.maxAnalysesPerPeriod === -1) return 'ללא הגבלה';
        if (tier === 'free') return 'ניתוח טעימה';
        return `${plan.limits.maxAnalysesPerPeriod} ניתוח/חודש`;
      case 'minutes':
        if (tier === 'free') return ''; // Hide minutes for free tier
        return `${plan.limits.maxVideoMinutesPerPeriod} דק'/חודש`;
      case 'videoLength':
        const seconds = plan.limits.maxVideoSeconds;
        const mb = plan.limits.maxFileBytes / (1024 * 1024);
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60);
          return `עד ${minutes} דק' או ${mb}MB`;
        }
        return `עד ${seconds} שניות או ${mb}MB`;
      case 'experts':
        return tier === 'free' ? '3 מומחים' : 'כל המומחים (8)';
      case 'tracks':
        if (tier === 'free') return 'תחום/מסלול אחד';
        if (tier === 'creator') return 'תחום/מסלול אחד';
        return 'כל התחומים (4)';
      case 'pdfExport':
        return plan.limits.features.pdfExport ? '✓' : '✗';
      case 'advancedAnalysis':
        return plan.limits.features.advancedAnalysis ? '✓' : '✗';
      case 'videoComparison':
        return plan.limits.features.comparison ? '✓' : '✗';
      default:
        return '';
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <ModalHeader>
          <h2>חבילות והצעות</h2>
          <p>בחר את החבילה המתאימה לך ביותר</p>
        </ModalHeader>

        <PackagesGrid>
          {plans.map((plan) => {
            const planData = SUBSCRIPTION_PLANS[plan.tier];
            const isCurrentTier = plan.tier === currentTier;
            return (
              <PackageCard key={plan.tier} $isRecommended={plan.recommended}>
                {plan.recommended && <RecommendedBadge>מומלץ</RecommendedBadge>}
                {isCurrentTier && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#D4A043',
                    color: '#000',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    חבילה פעילה
                  </div>
                )}
                <PackageTitle>{plan.name}</PackageTitle>
                <PackageSubtitle>{plan.subtitle}</PackageSubtitle>
                <PackageFeatures>
                  <li>{getFeatureText(plan.tier, 'analyses')}</li>
                  {getFeatureText(plan.tier, 'minutes') && <li>{getFeatureText(plan.tier, 'minutes')}</li>}
                  <li>{getFeatureText(plan.tier, 'videoLength')}</li>
                  <li>{getFeatureText(plan.tier, 'experts')}</li>
                  <li>{getFeatureText(plan.tier, 'tracks')}</li>
                  <li className={planData.limits.features.pdfExport ? '' : 'unavailable'}>
                    {planData.limits.features.pdfExport ? 'יצוא PDF' : 'יצוא PDF'}
                  </li>
                  <li className={planData.limits.features.advancedAnalysis ? '' : 'unavailable'}>
                    {planData.limits.features.advancedAnalysis ? 'ניתוח מתקדם' : 'ניתוח מתקדם'}
                  </li>
                  <li className={planData.limits.features.comparison ? '' : 'unavailable'}>
                    {planData.limits.features.comparison ? 'השוואת סרטונים' : 'השוואת סרטונים'}
                  </li>
                </PackageFeatures>
                {!isCurrentTier && plan.tier !== 'free' && currentTier && (
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
                    ✨ עם השדרוג – נפתחת לך מכסה חדשה בהתאם לחבילה
                  </div>
                )}
                <PackageButton
                  onClick={(e) => handlePackageSelect(plan.tier, e)}
                  disabled={loading !== null || isCurrentTier}
                >
                  {loading === plan.tier ? 'מעבד...' : isCurrentTier ? 'חבילה פעילה' : 'הרשמה לחבילה זו'}
                </PackageButton>
              </PackageCard>
            );
          })}
        </PackagesGrid>

        <ComparisonTable>
          <TableHeader>
            <TableHeaderCell>תכונה</TableHeaderCell>
            <TableHeaderCell>ניסיון</TableHeaderCell>
            <TableHeaderCell>יוצרים</TableHeaderCell>
            <TableHeaderCell>יוצרים באקסטרים</TableHeaderCell>
          </TableHeader>
          <TableRow>
            <TableLabel>ניתוחים חודשיים</TableLabel>
            <TableCell>{getFeatureText('free', 'analyses')}</TableCell>
            <TableCell>{getFeatureText('creator', 'analyses')}</TableCell>
            <TableCell>{getFeatureText('pro', 'analyses')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>דקות חודשיות</TableLabel>
            <TableCell>-</TableCell>
            <TableCell>{getFeatureText('creator', 'minutes')}</TableCell>
            <TableCell>{getFeatureText('pro', 'minutes')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>אורך סרטון</TableLabel>
            <TableCell>{getFeatureText('free', 'videoLength')}</TableCell>
            <TableCell>{getFeatureText('creator', 'videoLength')}</TableCell>
            <TableCell>{getFeatureText('pro', 'videoLength')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>מספר מומחים</TableLabel>
            <TableCell>{getFeatureText('free', 'experts')}</TableCell>
            <TableCell>{getFeatureText('creator', 'experts')}</TableCell>
            <TableCell>{getFeatureText('pro', 'experts')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>מספר תחומים</TableLabel>
            <TableCell>{getFeatureText('free', 'tracks')}</TableCell>
            <TableCell>{getFeatureText('creator', 'tracks')}</TableCell>
            <TableCell>{getFeatureText('pro', 'tracks')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>יצוא PDF</TableLabel>
            <TableCell>{getFeatureText('free', 'pdfExport')}</TableCell>
            <TableCell>{getFeatureText('creator', 'pdfExport')}</TableCell>
            <TableCell>{getFeatureText('pro', 'pdfExport')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>ניתוח מתקדם</TableLabel>
            <TableCell>{getFeatureText('free', 'advancedAnalysis')}</TableCell>
            <TableCell>{getFeatureText('creator', 'advancedAnalysis')}</TableCell>
            <TableCell>{getFeatureText('pro', 'advancedAnalysis')}</TableCell>
          </TableRow>
          <TableRow>
            <TableLabel>השוואת סרטונים</TableLabel>
            <TableCell>{getFeatureText('free', 'videoComparison')}</TableCell>
            <TableCell>{getFeatureText('creator', 'videoComparison')}</TableCell>
            <TableCell>{getFeatureText('pro', 'videoComparison')}</TableCell>
          </TableRow>
        </ComparisonTable>
      </ModalContent>
    </ModalOverlay>
  );
};
