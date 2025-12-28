import styled from 'styled-components';
import { fadeIn } from './globalStyles';

// --- Shared Modal Styled Components ---
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 10px;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const ModalContent = styled.div`
  background: #0a0a0a;
  border: 1px solid #D4A043;
  border-radius: 12px;
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden; /* Changed from overflow-y: auto - prevent scroll on modal itself */
  position: relative;
  box-shadow: 0 0 40px rgba(212, 160, 67, 0.2);
  display: flex;
  flex-direction: column;
  
  /* Smooth scrolling for mobile */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
`;

export const ModalHeader = styled.div`
  padding: 25px 25px 15px;
  text-align: center;
  border-bottom: 1px solid #222;
  flex-shrink: 0; /* Prevent header from shrinking */
  
  @media (max-width: 600px) {
    padding: 20px 15px 12px;
  }
`;

export const ModalTitle = styled.h2`
  color: #D4A043;
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

export const ModalSubtitle = styled.p`
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

export const ModalCloseBtn = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #D4A043; }
`;

export const ModalTabs = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #D4A043;
  margin-top: 0;
  margin-bottom: 0;
  padding-bottom: 15px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 10px;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Smooth scroll for tabs */
  scroll-behavior: smooth;
  
  @media (max-width: 600px) {
    gap: 6px;
    padding-top: 8px;
    padding-bottom: 12px;
  }
`;

export const ModalTab = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: fit-content;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.2), rgba(212, 160, 67, 0.1))' 
    : 'rgba(255, 255, 255, 0.03)'};
  border: ${props => props.$active 
    ? '2px solid #D4A043' 
    : '1px solid rgba(212, 160, 67, 0.3)'};
  border-radius: 8px;
  color: ${props => props.$active ? '#D4A043' : '#aaa'};
  padding: 12px 16px;
  font-weight: 700;
  font-family: 'Assistant', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  box-shadow: ${props => props.$active 
    ? '0 2px 8px rgba(212, 160, 67, 0.3)' 
    : 'none'};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Prevent text selection on mobile */
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  &:hover {
    color: #D4A043;
    border-color: #D4A043;
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.25), rgba(212, 160, 67, 0.15))' 
      : 'rgba(212, 160, 67, 0.08)'};
    box-shadow: 0 2px 8px rgba(212, 160, 67, 0.2);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: scale(0.98) translateY(0);
  }
  
  @media (max-width: 600px) {
    padding: 10px 12px;
    font-size: 0.85rem;
    border-radius: 6px;
    border-width: ${props => props.$active ? '2px' : '1px'};
  }
`;

export const TrackDescriptionText = styled.p`
  text-align: center;
  color: #999;
  font-size: 1rem;
  margin: 20px auto 15px;
  max-width: 750px;
  line-height: 1.5;
  padding: 12px 20px;
  background: rgba(212, 160, 67, 0.05);
  border: 1px solid rgba(212, 160, 67, 0.15);
  border-radius: 8px;
  flex-shrink: 0; /* Prevent description from shrinking */
  
  @media (max-width: 600px) {
    margin: 15px auto 12px;
    padding: 10px 15px;
    font-size: 0.95rem;
  }
`;

export const ModalBody = styled.div`
  padding: 25px;
  overflow-y: auto;
  flex: 1;
  /* Smooth scrolling for mobile */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
`;

export const ModalRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  border-bottom: 1px solid #1a1a1a;
  padding-bottom: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

export const ModalRole = styled.div`
  color: #e6be74;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 5px;
  padding: 12px 15px;
  background: rgba(212, 160, 67, 0.08);
  border: 1px solid rgba(212, 160, 67, 0.2);
  border-radius: 8px;
  text-align: center;
  position: relative;
  display: block;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 600px) {
    font-size: 1.2rem;
    padding: 14px 16px;
    border-width: 1.5px;
    background: rgba(212, 160, 67, 0.12);
  }
`;

export const ModalDesc = styled.div`
  color: #e0e0e0;
  font-size: 0.95rem;
  text-align: center;
  line-height: 1.6;
  padding: 0 10px;
  
  @media (max-width: 600px) {
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

