import React, { useState } from 'react';
import styled from 'styled-components';
import { fadeIn } from '../../styles/globalStyles';
import { SUBSCRIPTION_PLANS } from '../../constants';
import type { SubscriptionTier, TrackId } from '../../types';

// Track Icons
const TheaterMasksIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
    <path d="M2 10.5C2 5.8 5.8 2 10.5 2h3C18.2 2 22 5.8 22 10.5v1c0 4.7-3.8 8.5-8.5 8.5h-3C5.8 20 2 16.2 2 11.5v-1z" />
    <path d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12 16c-2.5 0-4-2-4-2s1.5-2 4-2 4 2 4 2-1.5 2-4 2z" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const PhoneStarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
    <path d="M14.5 9.5l-2.5-1.5-2.5 1.5 1-3-2.5-1.5h3l1.5-3 1.5 3h3l-2.5 1.5 1 3z" style={{ fill: 'currentColor', stroke: 'none' }} opacity="0.5"/>
  </svg>
);

const MicrophoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const TRACKS = [
  { 
    id: 'actors' as TrackId, 
    label: 'שחקנים ואודישנים',
    icon: TheaterMasksIcon
  },
  { 
    id: 'musicians' as TrackId, 
    label: 'זמרים ומוזיקאים',
    icon: MusicNoteIcon
  },
  { 
    id: 'creators' as TrackId, 
    label: 'יוצרי תוכן וכוכבי רשת',
    icon: PhoneStarIcon
  },
  { 
    id: 'influencers' as TrackId, 
    label: 'משפיענים ומותגים',
    icon: MicrophoneIcon
  },
];

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
  max-width: 800px;
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
    font-size: 2.5rem;
    margin: 0 0 15px 0;
    font-family: 'Frank Ruhl Libre', serif;
  }
  
  p {
    color: #ccc;
    font-size: 1.1rem;
    margin: 0;
    line-height: 1.6;
  }
`;

const BenefitsList = styled.div`
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  color: #fff;
  font-size: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .icon {
    color: #D4A043;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .text {
    flex: 1;
    line-height: 1.6;
  }
`;

const TracksSection = styled.div`
  margin-top: 30px;
`;

const TracksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const TrackCard = styled.div<{ $selected: boolean; $included?: boolean; $disabled?: boolean }>`
  background: ${props => {
    if (props.$included) return 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))';
    if (props.$selected) return 'linear-gradient(135deg, rgba(212, 160, 67, 0.2), rgba(212, 160, 67, 0.1))';
    return 'rgba(26, 26, 26, 0.8)';
  }};
  border: 2px solid ${props => {
    if (props.$included) return '#4CAF50';
    if (props.$selected) return '#D4A043';
    return 'rgba(212, 160, 67, 0.3)';
  }};
  border-radius: 12px;
  padding: 20px;
  cursor: ${props => props.$disabled || props.$included ? 'default' : 'pointer'};
  transition: all 0.3s;
  text-align: center;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  position: relative;

  &:hover {
    ${props => !props.$disabled && !props.$included && `
      transform: translateY(-3px);
      box-shadow: 0 5px 20px rgba(212, 160, 67, 0.3);
      border-color: #D4A043;
    `}
  }

  ${props => props.$selected && `
    box-shadow: 0 0 15px rgba(212, 160, 67, 0.4);
  `}
  
  ${props => props.$included && `
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
  `}
`;

const IncludedBadge = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: #4CAF50;
  color: #000;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TrackIcon = styled.div`
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #D4A043;
`;

const TrackName = styled.div`
  color: #D4A043;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  flex: 1;
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

const SecondaryButton = styled.button`
  flex: 1;
  background: transparent;
  color: #D4A043;
  border: 2px solid #D4A043;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(212, 160, 67, 0.1);
  }
`;

interface UpgradeBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldTier: SubscriptionTier;
  newTier: SubscriptionTier;
  onSelectTrack?: (trackId: TrackId, shouldCloseModal?: boolean) => void | Promise<void>;
  currentTracks?: TrackId[];
}

export const UpgradeBenefitsModal: React.FC<UpgradeBenefitsModalProps> = ({
  isOpen,
  onClose,
  oldTier,
  newTier,
  onSelectTrack,
  currentTracks = []
}) => {
  if (!isOpen) return null;

  const oldPlan = SUBSCRIPTION_PLANS[oldTier];
  const newPlan = SUBSCRIPTION_PLANS[newTier];
  
  // Determine what benefits are new
  const benefits: string[] = [];
  
  // Special handling for coach -> coach-pro upgrade
  const isCoachToCoachPro = oldTier === 'coach' && newTier === 'coach-pro';
  
  if (isCoachToCoachPro) {
    // For coach-pro upgrade, show specific benefits (simple format)
    benefits.push('👥 יותר מתאמנים');
    benefits.push('⏱️ יותר דקות ניתוח');
  } else {
    // Standard benefits logic for other upgrades
    // Check if tracks increased
    const oldMaxTracks = oldTier === 'free' ? 1 : oldTier === 'creator' ? 2 : 4;
    const newMaxTracks = newTier === 'free' ? 1 : newTier === 'creator' ? 2 : 4;
    
    if (newMaxTracks > oldMaxTracks) {
      benefits.push(`🎯 יותר תחומי ניתוח: מ-${oldMaxTracks} ל-${newMaxTracks} תחומים`);
    }
    
    // Check if analyses increased
    const oldAnalyses = oldPlan.limits.maxAnalysesPerPeriod;
    const newAnalyses = newPlan.limits.maxAnalysesPerPeriod;
    if (newAnalyses > oldAnalyses && oldAnalyses !== -1) {
      benefits.push(`📊 יותר ניתוחים: מ-${oldAnalyses} ל-${newAnalyses === -1 ? 'ללא הגבלה' : newAnalyses} ניתוחים`);
    }
    
    // Check if video duration increased
    const oldDuration = oldPlan.limits.maxVideoSeconds;
    const newDuration = newPlan.limits.maxVideoSeconds;
    if (newDuration > oldDuration) {
      const oldMin = Math.floor(oldDuration / 60);
      const newMin = Math.floor(newDuration / 60);
      benefits.push(`⏱️ סרטונים ארוכים יותר: מ-${oldMin} דקות ל-${newMin} דקות`);
    }
    
    // Check if file size increased
    const oldMB = oldPlan.limits.maxFileBytes / (1024 * 1024);
    const newMB = newPlan.limits.maxFileBytes / (1024 * 1024);
    if (newMB > oldMB) {
      benefits.push(`💾 קבצים גדולים יותר: מ-${oldMB}MB ל-${newMB}MB`);
    }
    
    // Check new features
    if (!oldPlan.limits.features.saveHistory && newPlan.limits.features.saveHistory) {
      benefits.push('💾 שמירת היסטוריית ניתוחים');
    }
    if (!oldPlan.limits.features.improvementTracking && newPlan.limits.features.improvementTracking) {
      benefits.push('📈 מעקב שיפור לאורך זמן');
    }
    if (!oldPlan.limits.features.comparison && newPlan.limits.features.comparison) {
      benefits.push('🔄 השוואה בין סרטונים');
    }
    if (!oldPlan.limits.features.advancedAnalysis && newPlan.limits.features.advancedAnalysis) {
      benefits.push('🔬 ניתוח מתקדם ומפורט יותר');
    }
    if (!oldPlan.limits.features.pdfExport && newPlan.limits.features.pdfExport) {
      benefits.push('📄 יצוא ניתוחים ל-PDF');
    }
    if (!oldPlan.limits.features.traineeManagement && newPlan.limits.features.traineeManagement) {
      benefits.push('👥 ניהול מתאמנים');
    }
    if (!oldPlan.limits.features.coachDashboard && newPlan.limits.features.coachDashboard) {
      benefits.push('📊 דשבורד מאמן מתקדם');
    }
  }

  // Show track selection if upgrading from free to creator
  // For free tier, user should have exactly 1 track (their primary track)
  // So we show track selection if they have 1 track and are upgrading to creator
  const showTrackSelection = oldTier === 'free' && newTier === 'creator' && currentTracks.length >= 0 && currentTracks.length < 2;
  const availableTracks = TRACKS.filter(t => !currentTracks.includes(t.id));
  const currentTrackObjects = TRACKS.filter(t => currentTracks.includes(t.id));
  
  // Check if user is new (no tracks selected yet) vs existing user (has 1 track)
  const isNewUser = currentTracks.length === 0;
  const isExistingUserWithOneTrack = currentTracks.length === 1;

  // For new users, allow selecting 2 tracks; for existing users, allow selecting 1 additional track
  const [selectedTracks, setSelectedTracks] = useState<TrackId[]>([]);
  
  const handleSelectTrack = (trackId: TrackId) => {
    if (isNewUser) {
      // New user: can select up to 2 tracks
      if (selectedTracks.includes(trackId)) {
        setSelectedTracks(selectedTracks.filter(id => id !== trackId));
      } else if (selectedTracks.length < 2) {
        setSelectedTracks([...selectedTracks, trackId]);
      }
    } else {
      // Existing user: can select 1 additional track
      if (selectedTracks.includes(trackId)) {
        setSelectedTracks([]);
      } else {
        setSelectedTracks([trackId]);
      }
    }
  };

  const handleContinue = async () => {
    if (showTrackSelection && onSelectTrack && selectedTracks.length > 0) {
      try {
        // For new users, save all tracks sequentially (each call adds to existing)
        // For existing users, save the additional track
        // Since onSelectTrack updates the database and reloads, we need to call it sequentially
        if (isNewUser && selectedTracks.length > 0) {
          // Save tracks one by one - each call will add to the existing tracks
          // Don't close modal until all tracks are saved
          for (let i = 0; i < selectedTracks.length; i++) {
            await onSelectTrack(selectedTracks[i], false); // Don't close modal yet
            if (i < selectedTracks.length - 1) {
              // Wait a bit before next call to ensure DB update completes
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          // Close modal after all tracks are saved
          onClose();
        } else if (isExistingUserWithOneTrack && selectedTracks.length > 0) {
          // For existing users, save the additional track and close modal
          await onSelectTrack(selectedTracks[0], true);
        }
      } catch (error) {
        console.error('Error saving tracks:', error);
        // Modal will stay open on error
      }
    } else {
      // If user skipped track selection in creator tier, show message
      if (showTrackSelection && selectedTracks.length === 0 && newTier === 'creator' && oldTier === 'free') {
        if (isNewUser) {
          alert('תוכל לבחור תחומי ניתוח מאוחר יותר מההגדרות > עדכונים');
        } else {
          alert('תוכל לבחור תחום ניתוח נוסף מאוחר יותר מההגדרות > עדכונים');
        }
      }
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>🎉 מזל טוב! שדרגת בהצלחה</h2>
          {isCoachToCoachPro ? (
            <>
              <p>
                החבילה שלך עודכנה ל-<strong style={{ color: '#D4A043' }}>מאמנים, סוכנויות ובתי ספר למשחק</strong>
              </p>
              <p style={{ color: '#D4A043', fontSize: '1.4rem', fontWeight: 700, marginTop: '10px' }}>
                בגרסת הפרו
              </p>
            </>
          ) : (
            <p>
              החבילה שלך עודכנה ל-<strong style={{ color: '#D4A043' }}>{newPlan.name}</strong>
            </p>
          )}
        </ModalHeader>

        <BenefitsList>
          <h3 style={{ color: '#D4A043', margin: '0 0 20px 0', fontSize: '1.3rem', textAlign: 'right' }}>
            האופציות החדשות שנפתחו בפניך:
          </h3>
          {isCoachToCoachPro ? (
            <>
              {benefits.map((benefit, index) => (
                <BenefitItem key={index}>
                  <span className="icon">✓</span>
                  <span className="text">{benefit}</span>
                </BenefitItem>
              ))}
              <BenefitItem>
                <span className="icon">✓</span>
                <span className="text">כל התכונות של מאמנים, סוכנויות ובתי ספר למשחק זמינות לך כעת!</span>
              </BenefitItem>
            </>
          ) : benefits.length > 0 ? (
            benefits.map((benefit, index) => (
              <BenefitItem key={index}>
                <span className="icon">✓</span>
                <span className="text">{benefit}</span>
              </BenefitItem>
            ))
          ) : (
            <BenefitItem>
              <span className="icon">✓</span>
              <span className="text">כל התכונות של {newPlan.name} זמינות לך כעת!</span>
            </BenefitItem>
          )}
        </BenefitsList>

        {showTrackSelection && (
          <TracksSection>
            <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem', textAlign: 'right' }}>
              🎯 בחר תחום ניתוח נוסף (אופציונלי)
            </h3>
            <p style={{ color: '#aaa', marginBottom: '15px', textAlign: 'right', fontSize: '0.95rem' }}>
              כחלק מחבילת יוצרים, תוכל לבחור תחום ניתוח נוסף. תוכל לעשות זאת גם מאוחר יותר מההגדרות.
            </p>
            <TracksGrid>
              {/* Show current tracks as "included" */}
              {currentTrackObjects.map((track) => {
                const TrackIconComponent = track.icon;
                return (
                  <TrackCard
                    key={track.id}
                    $selected={false}
                    $included={true}
                    $disabled={true}
                  >
                    <IncludedBadge>כלול</IncludedBadge>
                    <TrackIcon>
                      <TrackIconComponent />
                    </TrackIcon>
                    <TrackName style={{ color: '#4CAF50' }}>{track.label}</TrackName>
                  </TrackCard>
                );
              })}
              {/* Show available tracks for selection */}
              {availableTracks.map((track) => {
                const TrackIconComponent = track.icon;
                const isSelected = selectedTracks.includes(track.id);
                const canSelect = isNewUser ? selectedTracks.length < 2 : selectedTracks.length < 1;
                return (
                  <TrackCard
                    key={track.id}
                    $selected={isSelected}
                    $disabled={!canSelect && !isSelected}
                    onClick={() => canSelect || isSelected ? handleSelectTrack(track.id) : undefined}
                  >
                    <TrackIcon>
                      <TrackIconComponent />
                    </TrackIcon>
                    <TrackName>{track.label}</TrackName>
                  </TrackCard>
                );
              })}
            </TracksGrid>
          </TracksSection>
        )}

        <ButtonGroup>
          <PrimaryButton onClick={handleContinue}>
            {showTrackSelection && selectedTracks.length > 0 ? 'שמור והמשך' : 'מעולה, בואו נתחיל!'}
          </PrimaryButton>
          {showTrackSelection && (
            <SecondaryButton onClick={onClose}>
              דלג לעת עתה
            </SecondaryButton>
          )}
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

