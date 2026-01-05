import styled, { css } from 'styled-components';
import { fadeIn, shimmer, glowReady, breathingHigh } from './globalStyles';

// --- Main Page Styles ---

export const Title = styled.h1`
  font-size: 3.5rem;
  color: #D4A043;
  margin: 10px 0 5px;
  letter-spacing: 3px;
  text-transform: uppercase;
  background: linear-gradient(to bottom, #fcf6ba, #bf953f, #b38728, #fbf5b7, #aa771c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 10px rgba(212, 160, 67, 0.3));
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  @media (max-width: 480px) {
    font-size: 2rem;
    letter-spacing: 1px;
  }
`;

export const Subtitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  color: #D4A043;
  margin-bottom: 10px;
  font-weight: 400;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

export const Description = styled.p`
  color: #888;
  font-size: 1rem;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 30px;
  padding: 0 10px;
`;

export const CTAButton = styled.button`
  background: linear-gradient(135deg, #b8862e 0%, #e6be74 50%, #b8862e 100%);
  background-size: 200% auto;
  color: #000;
  border: none;
  border-radius: 50px;
  padding: 12px 35px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 160, 67, 0.3);

  &:hover {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 160, 67, 0.5);
  }
`;

export const CapabilitiesButton = styled.button`
  background: #000;
  border: 1px solid #D4A043;
  color: #D4A043;
  border-radius: 50px;
  padding: 10px 30px;
  font-family: 'Assistant', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 20px 0 40px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(212, 160, 67, 0.1);

  &:hover {
    background: rgba(212, 160, 67, 0.1);
    box-shadow: 0 0 15px rgba(212, 160, 67, 0.3);
    transform: translateY(-2px);
  }

  span {
    background: linear-gradient(90deg, #D4A043, #e6be74);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

// --- Coach Dashboard Styles ---

export const CoachDashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const CoachHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

export const CoachButton = styled.button`
  background: linear-gradient(135deg, #b8862e 0%, #e6be74 50%, #b8862e 100%);
  background-size: 200% auto;
  color: #000;
  border: none;
  border-radius: 50px;
  padding: 10px 25px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 160, 67, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 160, 67, 0.5);
  }
`;

export const TraineeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-top: 15px;
  }
`;

export const UpgradeMessageBox = styled.div`
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(212, 160, 67, 0.25), rgba(212, 160, 67, 0.15));
  border: 2px solid rgba(212, 160, 67, 0.6);
  border-radius: 12px;
  color: #D4A043;
  font-size: 0.9rem;
  line-height: 1.6;
  text-align: center;
  max-width: 420px;
  box-shadow: 0 4px 16px rgba(212, 160, 67, 0.3);
  font-weight: 500;
  animation: ${fadeIn} 0.5s ease-in;
`;

export const TraineeCard = styled.div`
  background: linear-gradient(145deg, #111, #0a0a0a);
  border: 1px solid #333;
  border-top: 2px solid #D4A043;
  border-radius: 8px;
  padding: 15px;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(212, 160, 67, 0.2);
    border-color: #D4A043;
  }
  
  @media (max-width: 600px) {
    padding: 12px;
  }
`;

export const TraineeName = styled.h3`
  color: #D4A043;
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

export const TraineeInfo = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TraineeActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #222;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
  }
  
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

export const TraineeActionButton = styled.button`
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    border-color: #D4A043;
    color: #D4A043;
    background: rgba(212, 160, 67, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }

  &.delete {
    &:hover {
      border-color: #ff4d4d;
      color: #ff4d4d;
      background: rgba(255, 77, 77, 0.1);
    }
  }
  
  @media (max-width: 600px) {
    padding: 7px 8px;
    font-size: 0.75rem;
    border-radius: 5px;
  }
  
  @media (max-width: 400px) {
    padding: 8px 10px;
    font-size: 0.8rem;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  
  h3 {
    color: #888;
    margin-bottom: 10px;
  }
  
  p {
    margin-bottom: 30px;
  }
`;

export const TraineeForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

export const FormInput = styled.input`
  background: #0a0a0a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  color: #e0e0e0;
  font-family: 'Assistant', sans-serif;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }

  &::placeholder {
    color: #666;
  }
`;

export const FormTextarea = styled.textarea`
  background: #0a0a0a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  color: #e0e0e0;
  font-family: 'Assistant', sans-serif;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }

  &::placeholder {
    color: #666;
  }
`;

// --- Comparison Modal Styles ---

export const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ComparisonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

export const ComparisonSelection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

export const AnalysisSelector = styled.div<{ $selected: boolean }>`
  background: ${props => props.$selected ? 'rgba(212, 160, 67, 0.15)' : 'rgba(20, 20, 20, 0.6)'};
  border: 2px solid ${props => props.$selected ? '#D4A043' : '#333'};
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #D4A043;
    background: rgba(212, 160, 67, 0.05);
  }
`;

export const SelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const SelectorName = styled.div`
  color: #D4A043;
  font-weight: 700;
  font-size: 0.95rem;
`;

export const SelectorScore = styled.span`
  background: #D4A043;
  color: #000;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
`;

export const SelectorMeta = styled.div`
  color: #888;
  font-size: 0.85rem;
  margin-top: 5px;
`;

export const ComparisonTable = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 20px;
`;

export const ComparisonTableHeader = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(auto-fit, minmax(200px, 1fr));
  background: rgba(212, 160, 67, 0.1);
  border-bottom: 2px solid #D4A043;
  padding: 15px;
  gap: 10px;
`;

export const ComparisonTableRow = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(auto-fit, minmax(200px, 1fr));
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
`;

export const TableHeaderCell = styled.div`
  color: #D4A043;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
`;

export const TableCell = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  text-align: center;
`;

export const TableLabel = styled.div`
  color: #aaa;
  font-weight: 600;
  font-size: 0.9rem;
`;

export const ScoreCell = styled.div<{ $score: number }>`
  background: ${props => {
    if (props.$score >= 80) return 'rgba(76, 175, 80, 0.2)';
    if (props.$score >= 60) return 'rgba(255, 193, 7, 0.2)';
    return 'rgba(244, 67, 54, 0.2)';
  }};
  color: ${props => {
    if (props.$score >= 80) return '#4CAF50';
    if (props.$score >= 60) return '#FFC107';
    return '#f44336';
  }};
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 700;
  display: inline-block;
`;

export const ComparisonSummary = styled.div`
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

export const SummaryTitle = styled.h3`
  color: #D4A043;
  margin: 0 0 15px 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

export const SummaryText = styled.p`
  color: #e0e0e0;
  line-height: 1.6;
  margin: 0;
`;

// --- Track Selection ---

export const SectionLabel = styled.div`
  color: #e0e0e0;
  font-size: 1.2rem;
  margin-bottom: 20px;
  font-weight: 600;
  position: relative;
  display: inline-block;
  text-align: center;
  
  &::after {
    content: '';
    display: block;
    width: 40px;
    height: 2px;
    background: #D4A043;
    margin: 8px auto 0;
  }
`;

// --- Expert Selection Controls ---

export const ExpertControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
  
  @media (max-width: 650px) {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
`;

export const ExpertControlText = styled.div`
  color: #e0e0e0;
  font-size: 1rem;
  padding-right: 5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: 'Assistant', sans-serif;

  strong {
    color: #D4A043;
    font-weight: 700;
  }

  @media (max-width: 600px) {
    font-size: 0.95rem;
  }
`;

export const ExpertToggleGroup = styled.div`
  display: flex;
  background: rgba(255,255,255,0.05);
  border-radius: 50px;
  padding: 4px;
  border: 1px solid #333;
  gap: 5px;
`;

export const ExpertToggleButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? '#D4A043' : 'transparent'};
  color: ${props => props.$active ? '#000' : '#888'};
  border: none;
  border-radius: 50px;
  padding: 6px 18px;
  font-size: 0.85rem;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$active ? '#000' : '#D4A043'};
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  width: 100%;
  margin-bottom: 30px;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const TrackCard = styled.div<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(212, 160, 67, 0.15)' : 'rgba(20, 20, 20, 0.6)'};
  border: 1px solid ${props => props.$active ? '#D4A043' : '#333'};
  border-radius: 12px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100px;
  
  &:hover {
    border-color: #D4A043;
    background: rgba(212, 160, 67, 0.05);
    transform: translateY(-5px);
  }

  svg {
    width: 32px;
    height: 32px;
    margin-bottom: 10px;
    stroke: ${props => props.$active ? '#D4A043' : '#888'};
    transition: stroke 0.3s;
  }

  span {
    color: ${props => props.$active ? '#D4A043' : '#e0e0e0'};
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    text-shadow: ${props => props.$active ? '0 0 8px rgba(212, 160, 67, 0.5)' : 'none'};
    letter-spacing: 0.5px;
    
    @media (max-width: 600px) {
      font-size: 0.95rem;
    }
  }
`;

export const PremiumCoachCard = styled.div<{ $active: boolean }>`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.25) 0%, rgba(212, 160, 67, 0.15) 100%)' 
    : 'linear-gradient(135deg, rgba(212, 160, 67, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%)'};
  border: 2px solid ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.5)'};
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  position: relative;
  overflow: hidden;
  grid-column: 2 / 4;
  max-width: 400px;
  margin: 0 auto;
  
  @media (max-width: 900px) {
    grid-column: 1 / -1;
    max-width: 100%;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #D4A043, #e6be74, #D4A043);
    background-size: 200% auto;
    animation: ${props => props.$active ? shimmer : 'none'} 2s linear infinite;
  }
  
  &:hover {
    border-color: #D4A043;
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.3) 0%, rgba(212, 160, 67, 0.2) 100%)' 
      : 'linear-gradient(135deg, rgba(212, 160, 67, 0.15) 0%, rgba(212, 160, 67, 0.05) 100%)'};
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(212, 160, 67, 0.3);
  }

  svg {
    width: 36px;
    height: 36px;
    margin-bottom: 10px;
    stroke: ${props => props.$active ? '#D4A043' : '#D4A043'};
    fill: ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.3)'};
    filter: ${props => props.$active ? 'drop-shadow(0 0 8px rgba(212, 160, 67, 0.6))' : 'none'};
    transition: all 0.3s;
  }

  .coach-line1 {
    color: ${props => props.$active ? '#D4A043' : '#D4A043'};
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 4px;
    text-shadow: ${props => props.$active ? '0 0 10px rgba(212, 160, 67, 0.5)' : 'none'};
  }

  .coach-line2 {
    color: ${props => props.$active ? 'rgba(212, 160, 67, 0.95)' : 'rgba(212, 160, 67, 0.7)'};
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 6px;
  }

  .coach-line3 {
    color: ${props => props.$active ? '#D4A043' : '#D4A043'};
    font-size: 0.85rem;
    font-weight: 800;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: ${props => props.$active ? '0 0 8px rgba(212, 160, 67, 0.6)' : 'none'};
    border-top: 1px solid ${props => props.$active ? 'rgba(212, 160, 67, 0.4)' : 'rgba(212, 160, 67, 0.2)'};
    padding-top: 6px;
    margin-top: 4px;
  }
`;

// --- Features Grid ---

export const FeatureCard = styled.div<{ $selected: boolean }>`
  background: ${props => props.$selected ? 'rgba(212, 160, 67, 0.1)' : '#0a0a0a'};
  border: 1px solid ${props => props.$selected ? '#D4A043' : '#222'};
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  height: 100px;

  &:hover {
    border-color: #D4A043;
    background: rgba(212, 160, 67, 0.05);
    transform: translateY(-5px);
  }

  &::after {
    content: '✓';
    position: absolute;
    top: 5px;
    left: 8px;
    color: #D4A043;
    opacity: ${props => props.$selected ? 1 : 0};
    font-weight: bold;
    transition: opacity 0.2s;
    font-size: 14px;
  }
`;

export const FeatureTitle = styled.h4<{ $selected: boolean }>`
  color: ${props => props.$selected ? '#D4A043' : '#e0e0e0'};
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Assistant', sans-serif;
  margin: 0;
  line-height: 1.2;
  letter-spacing: 0.5px;
  text-shadow: ${props => props.$selected ? '0 0 8px rgba(212, 160, 67, 0.5)' : 'none'};
  text-align: center;
  
  @media (max-width: 600px) {
    font-size: 0.95rem;
  }
`;

export const FeatureDesc = styled.p<{ $selected?: boolean }>`
  color: ${props => props.$selected ? '#e0e0e0' : '#d0d0d0'};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 8px 0 0 0;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  @media (max-width: 600px) {
    font-size: 0.85rem;
    line-height: 1.4;
    margin-top: 6px;
  }
`;

// --- Upload Section ---

export const UploadContainer = styled.div<{ $hasFile?: boolean }>`
  background: ${props => props.$hasFile ? '#000' : '#0f0f0f'};
  border: 2px dashed ${props => props.$hasFile ? '#D4A043' : '#333'};
  border-radius: 16px;
  padding: ${props => props.$hasFile ? '0' : '40px'};
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 480px) {
    padding: ${props => props.$hasFile ? '0' : '30px 15px'};
  }
  
  &:hover {
    border-color: #D4A043;
    background: ${props => props.$hasFile ? '#000' : '#111'};
  }
`;

export const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const UploadIcon = styled.div`
  font-size: 50px;
  color: #D4A043;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(212, 160, 67, 0.2));
`;

export const UploadTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  text-align: center;
`;

export const UploadSubtitle = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 25px;
  text-align: center;
`;

export const FileInput = styled.input`
  display: none;
`;

export const UploadButton = styled.label`
  background: #D4A043;
  color: #000;
  padding: 12px 30px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
  
  &:hover {
    background: #e6be74;
  }
`;

export const FullSizePreview = styled.div`
  width: 100%;
  height: 100%;
  min-height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  position: relative;

  video, img {
    width: 100%;
    height: auto;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }
  
  @media (max-width: 600px) {
    min-height: 250px;
  }
  
  @media (max-width: 480px) {
    min-height: 200px;
  }
`;

export const RemoveFileBtn = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: 1px solid #D4A043;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #D4A043;
    color: #000;
  }
`;

// --- PDF Upload Section ---

export const PdfUploadWrapper = styled.div`
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: center;
  margin-top: -10px;
  margin-bottom: 20px;
`;

export const PdfUploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 160, 67, 0.4);
  padding: 12px 25px;
  border-radius: 8px;
  color: #e6be74;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 600;

  &:hover {
    background: rgba(212, 160, 67, 0.15);
    border-color: #D4A043;
    color: #fff;
    transform: translateY(-1px);
  }
`;

export const PdfFileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  padding: 8px 15px;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.9rem;
  animation: ${fadeIn} 0.3s ease-out;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
`;

export const RemovePdfBtnSmall = styled.button`
  background: none;
  border: none;
  color: #D4A043;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

// --- Input Section ---

export const InputWrapper = styled.div`
  width: 100%;
  max-width: 700px;
  position: relative;
  margin-top: 20px;
`;

export const MainInput = styled.textarea`
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
  color: #e0e0e0;
  font-family: 'Assistant', sans-serif;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #D4A043;
  }
  
  &::placeholder {
    color: #999;
    font-weight: 500;
  }
`;

export const ActionButton = styled.button<{ $isReady?: boolean; $isLoading?: boolean }>`
  width: 100%;
  margin-top: 15px;
  background: linear-gradient(90deg, #b8862e, #e6be74, #b8862e);
  background-size: 200% auto;
  color: #000;
  border: 2px solid transparent;
  padding: 15px;
  border-radius: 50px;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(212, 160, 67, 0.2);
  transition: all 0.3s;
  
  ${props => props.$isReady && !props.$isLoading && css`
    animation: ${glowReady} 2s infinite ease-in-out;
  `}

  ${props => props.$isLoading && css`
    animation: ${breathingHigh} 1.5s infinite ease-in-out;
    background: linear-gradient(90deg, #D4A043, #FFF8DC, #D4A043);
    background-size: 200% auto;
    opacity: 1 !important;
    cursor: wait !important;
    color: #000 !important;
    border-color: #fff;
    text-shadow: none;
    font-weight: 800;
  `}

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 6px 25px rgba(212, 160, 67, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ErrorMsg = styled.div`
  color: #ff4d4d;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
`;

// --- Response Section ---

export const ResponseArea = styled.div`
  width: 100%;
  max-width: 900px;
  margin-top: 40px;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

export const SectionTitleExternal = styled.h3`
  color: #D4A043;
  font-size: 1rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const CompactResultBox = styled.div`
  background: linear-gradient(145deg, #111, #080808);
  border: 1px solid rgba(212, 160, 67, 0.3);
  padding: 15px 20px;
  border-radius: 8px;
  margin: 0 auto 10px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);

  p {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    color: #e0e0e0;
    font-family: 'Assistant', sans-serif;
    margin: 0;
  }
`;

export const HookText = styled.p`
  color: #fff !important;
  font-style: italic;
  font-family: 'Frank Ruhl Libre', serif !important;
`;

// --- Premium Expert Cards ---

export const ExpertsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
`;

export const ExpertResultCard = styled.div`
  background: linear-gradient(145deg, #111, #0a0a0a);
  border: 1px solid #333;
  border-top: 1px solid #D4A043;
  border-radius: 4px;
  padding: 25px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(212, 160, 67, 0.15);
    border-color: #555;
  }

  &::before, &::after {
    content: '✦';
    position: absolute;
    color: #D4A043;
    font-size: 14px;
    opacity: 0.5;
  }
  &::before { top: 8px; left: 8px; }
  &::after { bottom: 8px; right: 8px; }

  h4 {
    color: #D4A043;
    font-size: 1.2rem;
    margin-bottom: 15px;
    border-bottom: 1px solid rgba(212, 160, 67, 0.3);
    padding-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Frank Ruhl Libre', serif;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

export const ExpertScore = styled.span`
  background: #D4A043;
  color: #000;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 2px 8px;
  border-radius: 4px;
`;

export const ExpertSectionTitle = styled.h5`
  color: #888;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 15px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  svg { width: 14px; height: 14px; color: #D4A043; }
`;

export const ExpertText = styled.p`
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 10px;
`;

// --- Committee Section ---

export const CommitteeSection = styled.div`
  margin-top: 40px;
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const CommitteeText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin: 0;
`;

export const CommitteeTips = styled.div`
  background: rgba(255,255,255,0.03);
  padding: 20px;
  border-radius: 8px;
  text-align: right;
  max-width: 600px;
  width: 100%;
  margin: 20px auto 30px;
  border: 1px dashed #444;

  h5 {
    color: #D4A043;
    margin-bottom: 10px;
    font-size: 1.1rem;
  }
  
  ul {
    padding-right: 20px;
    margin: 0;
  }
  li {
    margin-bottom: 8px;
    color: #ccc;
  }
`;

export const FinalScore = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  
  .number {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    color: #fff;
    text-shadow: 0 0 20px rgba(212, 160, 67, 0.4);
  }
  .label {
    color: #D4A043;
    font-size: 1rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 5px;
  }
`;

// --- Action Buttons (Footer of Response) ---

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const SecondaryButton = styled.button`
  background: transparent;
  border: 1px solid #888;
  color: #ccc;
  padding: 12px 25px;
  border-radius: 50px;
  font-family: 'Assistant', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    border-color: #fff;
    color: #fff;
    background: rgba(255,255,255,0.05);
  }
`;

export const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #b8862e 0%, #e6be74 50%, #b8862e 100%);
  background-size: 200% auto;
  border: none;
  color: #000;
  padding: 12px 25px;
  border-radius: 50px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(212, 160, 67, 0.2);

  &:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 160, 67, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

export const PremiumBadge = styled.span`
  background: rgba(212, 160, 67, 0.15);
  color: #D4A043;
  border: 1px solid rgba(212, 160, 67, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
`;

// --- Logo Component Styles ---

export const LogoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

export const LogoPlaceholder = styled.div`
  width: 180px;
  height: 100px;
  border: 1px dashed rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(212, 160, 67, 0.5);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #D4A043;
    color: #D4A043;
  }
`;

export const HiddenLogoInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

export const StyledLogoImg = styled.img`
  width: 100%;
  height: auto;
  max-width: 320px;
  object-fit: contain;
`;

