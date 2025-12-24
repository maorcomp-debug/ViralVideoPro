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
  max-width: 700px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(212, 160, 67, 0.4);
  animation: ${fadeIn} 0.4s ease;
  position: relative;

  @media (max-width: 768px) {
    padding: 30px 20px;
    border-radius: 15px;
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #D4A043;
    font-size: 2rem;
    margin: 0 0 15px 0;
    font-family: 'Frank Ruhl Libre', serif;
  }
  
  p {
    color: #ccc;
    font-size: 1rem;
    margin: 0;
    line-height: 1.6;
  }
`;

const PackageSelect = styled.select`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
  direction: rtl;
  cursor: pointer;
  margin-bottom: 20px;

  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const InfoMessage = styled.div`
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 25px;
  text-align: center;
  color: #D4A043;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: #D4A043;
  color: #000;
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
    background: #F5C842;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tier: SubscriptionTier) => void;
  userEmail?: string;
}

export const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  userEmail
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(false);

  const isTestAccount = userEmail?.trim().toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // For test accounts or regular users, update subscription_tier
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ subscription_tier: selectedTier })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating subscription tier:', updateError);
          alert('שגיאה בעדכון החבילה. נסה שוב.');
          setLoading(false);
          return;
        }
      }

      onSelect(selectedTier);
      onClose();
    } catch (err: any) {
      console.error('Error saving package selection:', err);
      alert('שגיאה בשמירת הבחירה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      // Don't close on overlay click - user must select a package
      e.stopPropagation();
    }}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>בחר חבילה</h2>
          <p>
            {isTestAccount 
              ? 'בחר חבילה לבדיקה. תוכל ליצור מספר חשבונות עם חבילות שונות.'
              : 'בחר את החבילה המתאימה לך. תוכל לשדרג מאוחר יותר.'}
          </p>
        </ModalHeader>

        <PackageSelect
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
        >
          <option value="free">🎁 חבילת ניסיון (חינם)</option>
          <option value="creator">⭐ חבילת יוצרים</option>
          <option value="pro">💎 חבילת יוצרים באקסטרים</option>
          <option value="coach">🏆 חבילת מאמנים, סוכנויות ובתי ספר למשחק</option>
        </PackageSelect>

        <InfoMessage>
          {selectedTier === 'free' && 'חבילת ניסיון כוללת 2 ניתוחים בחודש, עד דקה או 10MB, ותחום ניתוח אחד.'}
          {selectedTier === 'creator' && 'חבילת יוצרים כוללת 10 ניתוחים בחודש, עד 3 דקות או 15MB, ושני תחומי ניתוח.'}
          {selectedTier === 'pro' && 'חבילת יוצרים באקסטרים כוללת 30 ניתוחים בחודש, עד 5 דקות או 40MB, וכל תחומי הניתוח.'}
          {selectedTier === 'coach' && 'חבילת מאמנים כוללת ניתוחים ללא הגבלה, עד 5 דקות או 40MB, כל תחומי הניתוח, ופיצ\'רים למאמנים.'}
        </InfoMessage>

        <SubmitButton
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'שומר...' : 'המשך לבחירת תחום ניתוח'}
        </SubmitButton>
      </ModalContent>
    </ModalOverlay>
  );
};

