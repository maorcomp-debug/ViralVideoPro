import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { updateCurrentUserProfile } from '../../lib/supabase-helpers';
import { fadeIn } from '../../styles/globalStyles';
import { ModalCloseBtn } from '../../styles/modal';
import type { TrackId, SubscriptionTier } from '../../types';

// Track Icons (SVG matching index.tsx)
const TheaterMasksIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
    <path d="M2 10.5C2 5.8 5.8 2 10.5 2h3C18.2 2 22 5.8 22 10.5v1c0 4.7-3.8 8.5-8.5 8.5h-3C5.8 20 2 16.2 2 11.5v-1z" />
    <path d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12 16c-2.5 0-4-2-4-2s1.5-2 4-2 4 2 4 2-1.5 2-4 2z" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const PhoneStarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
    <path d="M14.5 9.5l-2.5-1.5-2.5 1.5 1-3-2.5-1.5h3l1.5-3 1.5 3h3l-2.5 1.5 1 3z" style={{ fill: 'currentColor', stroke: 'none' }} opacity="0.5"/>
  </svg>
);

const MicrophoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// --- Track Selection Modal Styled Components ---
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

const TracksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const TrackCard = styled.div<{ $selected: boolean; $disabled?: boolean }>`
  background: ${props => props.$selected 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.2), rgba(212, 160, 67, 0.1))' 
    : 'rgba(26, 26, 26, 0.8)'};
  border: 2px solid ${props => props.$selected ? '#D4A043' : props.$disabled ? '#444' : 'rgba(212, 160, 67, 0.3)'};
  border-radius: 15px;
  padding: 25px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  position: relative;

  &:hover {
    ${props => !props.$disabled && `
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(212, 160, 67, 0.3);
      border-color: #D4A043;
    `}
  }

  ${props => props.$selected && `
    box-shadow: 0 0 20px rgba(212, 160, 67, 0.4);
  `}
`;

const TrackIcon = styled.div`
  margin-bottom: 15px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #D4A043;
  
  svg {
    width: 48px;
    height: 48px;
  }
`;

const TrackName = styled.h3`
  color: #D4A043;
  font-size: 1.3rem;
  margin: 0 0 10px 0;
  text-align: center;
  font-weight: 700;
`;

const TrackDescription = styled.p`
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  text-align: center;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  background: #D4A043;
  color: #000;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
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

interface TrackSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (trackIds: TrackId[]) => void;
  subscriptionTier: SubscriptionTier;
  existingTracks?: TrackId[]; // For adding additional tracks (not replacing)
  mode?: 'replace' | 'add'; // 'replace' = select all tracks, 'add' = add to existing
}

// Track definitions (matching the ones in index.tsx)
const TRACKS = [
  { 
    id: 'actors' as TrackId, 
    label: 'שחקנים ואודישנים',
    description: 'חדר האודישנים הראשי של הפקות הדרמה המובילות',
    icon: TheaterMasksIcon
  },
  { 
    id: 'musicians' as TrackId, 
    label: 'זמרים ומוזיקאים',
    description: 'פאנל השופטים של תוכניות המוזיקה הגדולות',
    icon: MusicNoteIcon
  },
  { 
    id: 'creators' as TrackId, 
    label: 'יוצרי תוכן וכוכבי רשת',
    description: 'האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב)',
    icon: PhoneStarIcon
  },
  { 
    id: 'influencers' as TrackId, 
    label: 'משפיענים ומותגים',
    description: 'חדר האסטרטגיה של המותגים הגדולים ומשרדי הפרסום',
    icon: MicrophoneIcon
  },
];

export const TrackSelectionModal: React.FC<TrackSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  subscriptionTier,
  existingTracks = [],
  mode = 'replace'
}) => {
  // If mode is 'add', start with existing tracks selected
  const [selectedTracks, setSelectedTracks] = useState<TrackId[]>(
    mode === 'add' ? [...existingTracks] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine max tracks allowed based on subscription tier
  const maxTracks = subscriptionTier === 'free' ? 1 : subscriptionTier === 'creator' ? 2 : 4;
  
  // If in 'add' mode, calculate how many more tracks can be added
  const remainingSlots = mode === 'add' ? maxTracks - existingTracks.length : maxTracks;

  const handleSelectTrack = (trackId: TrackId) => {
    setError(null);
    
    // In 'add' mode, don't allow deselecting existing tracks
    if (mode === 'add' && existingTracks.includes(trackId)) {
      setError('לא ניתן להסיר תחום קיים. בחר תחום נוסף.');
      return;
    }
    
    if (selectedTracks.includes(trackId)) {
      // Deselect track (only if not existing in 'add' mode)
      setSelectedTracks(prev => prev.filter(id => id !== trackId));
    } else {
      // Select track if under limit
      if (mode === 'add') {
        // In 'add' mode, check remaining slots
        if (selectedTracks.length - existingTracks.length < remainingSlots) {
          setSelectedTracks(prev => [...prev, trackId]);
        } else {
          setError(`ניתן להוסיף עד ${remainingSlots} ${remainingSlots === 1 ? 'תחום נוסף' : 'תחומים נוספים'} בחבילה זו`);
        }
      } else {
        // In 'replace' mode, use normal logic
        if (selectedTracks.length < maxTracks) {
          setSelectedTracks(prev => [...prev, trackId]);
        } else {
          setError(`ניתן לבחור עד ${maxTracks} ${maxTracks === 1 ? 'תחום' : 'תחומים'} בחבילה זו`);
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (loading) return;
    
    if (mode === 'add') {
      // In 'add' mode, check if at least one new track was selected
      const newTracks = selectedTracks.filter(t => !existingTracks.includes(t));
      if (newTracks.length === 0) {
        setError('אנא בחר תחום נוסף להוספה');
        return;
      }
      
      if (selectedTracks.length > maxTracks) {
        setError(`ניתן לבחור עד ${maxTracks} ${maxTracks === 1 ? 'תחום' : 'תחומים'} בחבילה זו`);
        return;
      }
    } else {
      // In 'replace' mode, normal validation
      if (selectedTracks.length === 0) {
        setError('אנא בחר תחום ניתוח');
        return;
      }

      if (selectedTracks.length > maxTracks) {
        setError(`ניתן לבחור עד ${maxTracks} ${maxTracks === 1 ? 'תחום' : 'תחומים'} בחבילה זו`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Update user profile with selected tracks
      const primaryTrack = selectedTracks[0];
      await updateCurrentUserProfile({
        selected_primary_track: primaryTrack,
        selected_tracks: selectedTracks,
      });

      // Call onSelect callback with all selected tracks
      onSelect(selectedTracks);
      
      // Close modal
      onClose();
    } catch (err: any) {
      console.error('Error saving track selection:', err);
      setError(err.message || 'שגיאה בשמירת הבחירה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      // Don't close on overlay click - user must select a track
      e.stopPropagation();
    }}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {mode === 'add' && (
          <ModalCloseBtn onClick={onClose} style={{ position: 'absolute', top: '15px', left: '15px' }}>✕</ModalCloseBtn>
        )}
        <ModalHeader>
          <h2>{mode === 'add' ? 'הוסף תחום ניתוח נוסף' : 'בחר תחום ניתוח'}</h2>
          <p>
            {mode === 'add' 
              ? `בחר תחום נוסף להוספה לחבילה שלך. ניתן להוסיף עד ${remainingSlots} ${remainingSlots === 1 ? 'תחום נוסף' : 'תחומים נוספים'}.`
              : subscriptionTier === 'free' 
              ? 'כחלק מחבילת הניסיון, אנא בחר תחום אחד לניתוח. תוכל לשדרג את החבילה מאוחר יותר לבחור תחומים נוספים.'
              : subscriptionTier === 'creator'
              ? 'בחר עד שני תחומי ניתוח. תוכל לשדרג את החבילה מאוחר יותר לכל התחומים.'
              : 'בחר תחומי ניתוח (עד 4 תחומים).'}
          </p>
        </ModalHeader>

        <InfoMessage>
          {mode === 'add' && `💡 תחומים קיימים שלך: ${existingTracks.length}. ניתן להוסיף עוד ${remainingSlots} ${remainingSlots === 1 ? 'תחום' : 'תחומים'}.`}
          {mode === 'replace' && subscriptionTier === 'free' && '💡 כל תחום כולל פאנל מומחים מותאם אישית. ניתן לשדרג בעתיד לבחור תחומים נוספים.'}
          {mode === 'replace' && subscriptionTier === 'creator' && `💡 ניתן לבחור עד 2 תחומים. נבחרו: ${selectedTracks.length}/${maxTracks}`}
          {mode === 'replace' && subscriptionTier !== 'free' && subscriptionTier !== 'creator' && '💡 כל התחומים זמינים לך!'}
        </InfoMessage>

        <TracksGrid>
          {TRACKS.map((track) => {
            const TrackIconComponent = track.icon;
            const isSelected = selectedTracks.includes(track.id);
            const isExisting = mode === 'add' && existingTracks.includes(track.id);
            // Disable if: existing track (can't select), or reached max limit and not selected
            const isDisabled = isExisting || (mode === 'add' && remainingSlots === 0 && !isExisting && !isSelected);
            
            return (
              <TrackCard
                key={track.id}
                $selected={isSelected || isExisting} // Show as selected if existing or newly selected
                $disabled={isDisabled}
                onClick={() => !isDisabled && !isExisting && handleSelectTrack(track.id)}
                style={{
                  cursor: isExisting ? 'default' : (isDisabled ? 'not-allowed' : 'pointer'),
                  opacity: isDisabled && !isExisting ? 0.5 : 1
                }}
              >
                {(isSelected || isExisting) && (
                  <SelectedBadge>✓ נבחר</SelectedBadge>
                )}
                <TrackIcon>
                  <TrackIconComponent />
                </TrackIcon>
                <TrackName>{track.label}</TrackName>
                <TrackDescription>{track.description}</TrackDescription>
              </TrackCard>
            );
          })}
        </TracksGrid>

        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            textAlign: 'center', 
            fontSize: '0.9rem',
            marginBottom: '20px',
            padding: '10px',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
          </div>
        )}

        <SubmitButton
          onClick={handleSubmit}
          disabled={
            loading || 
            (mode === 'add' 
              ? selectedTracks.length === existingTracks.length 
              : selectedTracks.length === 0)
          }
        >
          {loading 
            ? 'שומר...' 
            : mode === 'add'
            ? `הוסף תחום נוסף (${selectedTracks.length - existingTracks.length} חדש${selectedTracks.length - existingTracks.length > 0 ? 'ים' : ''}/${remainingSlots})`
            : `אשר בחירה והמשך (${selectedTracks.length}/${maxTracks})`
          }
        </SubmitButton>
      </ModalContent>
    </ModalOverlay>
  );
};

