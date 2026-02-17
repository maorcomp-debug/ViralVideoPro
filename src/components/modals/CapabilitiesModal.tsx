import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalTabs,
  ModalTab,
  TrackDescriptionText,
  ModalBody,
  ModalRow,
  ModalRole,
  ModalDesc,
} from '../../styles/modal';

// --- CapabilitiesModal Component ---
interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const CapabilitiesModal: React.FC<CapabilitiesModalProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab 
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const getContent = (tab: string) => {
    if (tab === 'coach') {
      return Array.from({ length: 10 }, (_, i) => ({
        role: t(`capabilitiesCoach.${i}_role`),
        desc: t(`capabilitiesCoach.${i}_desc`),
      }));
    }
    const track = tab as 'actors' | 'musicians' | 'creators' | 'influencers';
    return Array.from({ length: 8 }, (_, i) => ({
      role: t(`experts.${track}.${i}.title`),
      desc: t(`experts.${track}.${i}.desc`),
    }));
  };

  const regularTabs = [
    { id: 'actors', labelKey: 'track.actors' },
    { id: 'musicians', labelKey: 'track.musicians' },
    { id: 'creators', labelKey: 'track.creators' },
    { id: 'influencers', labelKey: 'track.influencers' },
  ];
  
  const premiumTab = { id: 'coach', labelKey: 'coachTrack.modalTab' };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        
        <div style={{ 
          position: 'sticky',
          top: 0,
          background: '#0a0a0a',
          zIndex: 15,
          flexShrink: 0,
          paddingBottom: '10px'
        }}>
          <ModalHeader>
            <ModalTitle>{t('header.ctaCapabilities')}</ModalTitle>
            <ModalSubtitle>
              {t('capabilitiesModal.subtitle')}
            </ModalSubtitle>
          </ModalHeader>
          <ModalTabs>
            {regularTabs.map(tab => (
              <ModalTab 
                key={tab.id} 
                $active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Smooth scroll to top of content when switching tabs
                  const modalBody = document.querySelector('[data-modal-body]');
                  if (modalBody) {
                    modalBody.scrollTop = 0;
                  }
                }}
              >
                {t(tab.labelKey)}
              </ModalTab>
            ))}
          </ModalTabs>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '15px',
            marginBottom: '15px'
          }}>
            <ModalTab 
              $active={activeTab === premiumTab.id}
              onClick={() => {
                setActiveTab(premiumTab.id);
                const modalBody = document.querySelector('[data-modal-body]');
                if (modalBody) {
                  modalBody.scrollTop = 0;
                }
              }}
              style={{
                maxWidth: '400px',
                width: '100%'
              }}
            >
              {t(premiumTab.labelKey)}
            </ModalTab>
          </div>

          <TrackDescriptionText>
             {t(`trackDescription.${activeTab}`)}
          </TrackDescriptionText>
        </div>
        
        <ModalBody data-modal-body style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {getContent(activeTab)?.map((item, idx) => (
             <ModalRow key={idx}>
               <ModalRole>{item.role}</ModalRole>
               <ModalDesc>{item.desc}</ModalDesc>
             </ModalRow>
          )) || <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>{t('capabilitiesModal.contentBuilding')}</div>}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

