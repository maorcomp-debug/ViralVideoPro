import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { updateCurrentUserProfile } from '../../lib/supabase-helpers';
import { fadeIn } from '../../styles/globalStyles';
import type { TrackId } from '../../types';

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
  font-size: 3rem;
  margin-bottom: 15px;
  text-align: center;
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
  onSelect: (trackId: TrackId) => void;
}

// Track definitions (matching the ones in index.tsx)
const TRACKS = [
  { 
    id: 'actors' as TrackId, 
    label: 'שחקנים ואודישנים',
    description: 'חדר האודישנים הראשי של הפקות הדרמה המובילות',
    icon: '🎭'
  },
  { 
    id: 'musicians' as TrackId, 
    label: 'זמרים ומוזיקאים',
    description: 'פאנל השופטים של תוכניות המוזיקה הגדולות',
    icon: '🎵'
  },
  { 
    id: 'creators' as TrackId, 
    label: 'יוצרי תוכן וכוכבי רשת',
    description: 'האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב)',
    icon: '⭐'
  },
  { 
    id: 'influencers' as TrackId, 
    label: 'משפיענים ומותגים',
    description: 'חדר האסטרטגיה של המותגים הגדולים ומשרדי הפרסום',
    icon: '🎤'
  },
];

export const TrackSelectionModal: React.FC<TrackSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTrack = (trackId: TrackId) => {
    setSelectedTrack(trackId);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      setError('אנא בחר תחום ניתוח');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update user profile with selected track
      await updateCurrentUserProfile({
        selected_primary_track: selectedTrack,
        selected_tracks: [selectedTrack], // For free tier, only one track
      });

      // Call onSelect callback
      onSelect(selectedTrack);
      
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
        <ModalHeader>
          <h2>בחר תחום ניתוח</h2>
          <p>
            כחלק מחבילת הניסיון, אנא בחר תחום אחד לניתוח. תוכל לשדרג את החבילה מאוחר יותר לבחור תחומים נוספים.
          </p>
        </ModalHeader>

        <InfoMessage>
          💡 כל תחום כולל פאנל מומחים מותאם אישית. ניתן לשדרג בעתיד לבחור תחומים נוספים.
        </InfoMessage>

        <TracksGrid>
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              $selected={selectedTrack === track.id}
              onClick={() => handleSelectTrack(track.id)}
            >
              {selectedTrack === track.id && (
                <SelectedBadge>✓ נבחר</SelectedBadge>
              )}
              <TrackIcon>{track.icon}</TrackIcon>
              <TrackName>{track.label}</TrackName>
              <TrackDescription>{track.description}</TrackDescription>
            </TrackCard>
          ))}
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
          disabled={!selectedTrack || loading}
        >
          {loading ? 'שומר...' : 'אשר בחירה והמשך'}
        </SubmitButton>
      </ModalContent>
    </ModalOverlay>
  );
};

