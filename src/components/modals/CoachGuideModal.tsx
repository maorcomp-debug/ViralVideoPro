import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalBody,
} from '../../styles/modal';

interface CoachGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachGuideModal: React.FC<CoachGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>{t('coachGuide.title')}</ModalTitle>
          <ModalSubtitle>
            {t('coachGuide.subtitle')}
          </ModalSubtitle>
        </ModalHeader>

        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step1Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step1Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step2Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step2Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step3Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step3Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step4Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step4Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step5Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step5Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step6Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step6Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step7Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step7Desc')}</p>
            </div>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>{t('coachGuide.step8Title')}</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>{t('coachGuide.step8Desc')}</p>
            </div>

            <div style={{ background: 'rgba(255, 193, 7, 0.15)', padding: '20px', borderRadius: '8px', border: '2px solid rgba(255, 193, 7, 0.5)', marginTop: '10px' }}>
              <h4 style={{ color: '#FFC107', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ {t('coachGuide.warningTitle')}
              </h4>
              <p style={{ color: '#ffeb3b', lineHeight: '1.8', margin: '0 0 10px 0', fontWeight: 600 }}>{t('coachGuide.warningP1')}</p>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                <strong>{t('coachGuide.warningP2')}</strong><br/>
                {t('coachGuide.warningP3')}
              </p>
            </div>

            <div style={{ background: 'rgba(212, 160, 67, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)', marginTop: '10px' }}>
              <h4 style={{ color: '#D4A043', margin: '0 0 10px 0' }}>{t('coachGuide.tipsTitle')}</h4>
              <ul style={{ color: '#e0e0e0', lineHeight: '1.8', paddingRight: '20px', margin: 0 }}>
                <li>{t('coachGuide.tip1')}</li>
                <li>{t('coachGuide.tip2')}</li>
                <li>{t('coachGuide.tip3')}</li>
                <li>{t('coachGuide.tip4')}</li>
              </ul>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

