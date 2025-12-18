import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type TrackId = 'actors' | 'musicians' | 'creators' | 'coach' | 'influencers';

interface ExpertAnalysis {
  role: string;
  insight: string;
  tips: string;
  score: number; // Individual expert score
}

interface AnalysisResult {
  expertAnalysis: ExpertAnalysis[];
  hook: string; // The "Golden Insight"
  committee: {
    summary: string;
    finalTips: string[];
  };
}

// --- Coach Edition Types ---

interface SavedAnalysis {
  id: string;
  videoName: string;
  videoUrl: string;
  traineeId?: string;
  traineeName?: string;
  analysisDate: Date;
  result: AnalysisResult;
  averageScore: number;
  track: TrackId;
  metadata?: {
    duration?: number;
    fileSize?: number;
    prompt?: string;
  };
}

interface Trainee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  analyses: SavedAnalysis[];
}

interface CoachComparison {
  id: string;
  name: string;
  analyses: SavedAnalysis[];
  comparisonDate: Date;
  insights?: string;
}

interface CoachReport {
  id: string;
  traineeId?: string;
  traineeName?: string;
  reportDate: Date;
  analyses: SavedAnalysis[];
  summary: string;
  trends?: {
    improvement: boolean;
    areas: string[];
    recommendations: string[];
  };
}

// --- Constants ---
const MAX_VIDEO_SECONDS = 5 * 60; // 5 minutes
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

const TRACK_DESCRIPTIONS: Record<string, string> = {
  actors: 'חדר האודישנים הראשי של הפקות הדרמה המובילות בישראל ובעולם אצלך בכיס. הסטנדרט הוא קולנועי וחסר פשרות.',
  musicians: 'פאנל השופטים של תוכניות המוזיקה הגדולות והלייבלים המובילים אצלך בכיס.',
  creators: 'האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב) אצלך בכיס.',
  coach: 'פלטפורמה מקצועית למאמנים וסוכנויות לניתוח עומק, מעקב התקדמות והפקת דוחות מקצועיים.',
  influencers: 'חדר האסטרטגיה של המותגים הגדולים ומשרדי הפרסום המובילים אצלך בכיס.',
};

// --- Global Styles & Animation ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(212, 160, 67, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0); }
`;

const glowReady = keyframes`
  0% { box-shadow: 0 0 5px rgba(212, 160, 67, 0.3); border-color: rgba(212, 160, 67, 0.5); }
  50% { box-shadow: 0 0 25px rgba(212, 160, 67, 0.7); border-color: #D4A043; transform: scale(1.02); }
  100% { box-shadow: 0 0 5px rgba(212, 160, 67, 0.3); border-color: rgba(212, 160, 67, 0.5); }
`;

const breathingHigh = keyframes`
  0% { 
    box-shadow: 0 0 20px rgba(212, 160, 67, 0.6); 
    transform: scale(1); 
    filter: brightness(100%);
    border-color: rgba(212, 160, 67, 0.5);
  }
  50% { 
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.8); 
    transform: scale(1.02); 
    filter: brightness(140%);
    border-color: #fff;
  }
  100% { 
    box-shadow: 0 0 20px rgba(212, 160, 67, 0.6); 
    transform: scale(1); 
    filter: brightness(100%);
    border-color: rgba(212, 160, 67, 0.5);
  }
`;

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #050505;
    color: #e0e0e0;
    font-family: 'Assistant', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  
  ::selection {
    background: #D4A043;
    color: #000;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0f0f0f; 
  }
  ::-webkit-scrollbar-thumb {
    background: #333; 
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #D4A043; 
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Frank Ruhl Libre', serif;
    margin: 0;
  }
`;

// --- Styled Components ---

const AppContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 600px) {
    padding: 20px 15px;
  }
`;

// -- Header Section --

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  color: #D4A043; /* Metallic Gold */
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

const Subtitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  color: #D4A043;
  margin-bottom: 10px;
  font-weight: 400;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const Description = styled.p`
  color: #888;
  font-size: 1rem;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 30px;
  padding: 0 10px;
`;

const CTAButton = styled.button`
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

// -- Capabilities Button --

const CapabilitiesButton = styled.button`
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

// -- Modal --

const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background: #0a0a0a;
  border: 1px solid #D4A043;
  border-radius: 12px;
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 0 40px rgba(212, 160, 67, 0.2);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 25px 25px 15px;
  text-align: center;
  border-bottom: 1px solid #222;
`;

const ModalTitle = styled.h2`
  color: #D4A043;
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

const ModalSubtitle = styled.p`
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const ModalCloseBtn = styled.button`
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

const ModalTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #D4A043;
  margin-top: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModalTab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: ${props => props.$active ? 'linear-gradient(to top, rgba(212, 160, 67, 0.1), transparent)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#D4A043' : 'transparent'};
  color: ${props => props.$active ? '#D4A043' : '#888'};
  padding: 15px;
  font-weight: 700;
  font-family: 'Assistant', sans-serif;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    color: #D4A043;
  }
`;

const TrackDescriptionText = styled.p`
  text-align: center;
  color: #999;
  font-size: 1rem;
  margin: 25px auto 10px;
  max-width: 750px;
  line-height: 1.5;
  padding: 0 20px;
`;

const ModalBody = styled.div`
  padding: 25px;
  overflow-y: auto;
`;

// -- Coach Dashboard Styles --

const CoachDashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CoachHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const CoachButton = styled.button`
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

const TraineeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const TraineeCard = styled.div`
  background: linear-gradient(145deg, #111, #0a0a0a);
  border: 1px solid #333;
  border-top: 2px solid #D4A043;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(212, 160, 67, 0.2);
    border-color: #D4A043;
  }
`;

const TraineeName = styled.h3`
  color: #D4A043;
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

const TraineeInfo = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TraineeActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #222;
`;

const TraineeActionButton = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #D4A043;
    color: #D4A043;
    background: rgba(212, 160, 67, 0.1);
  }

  &.delete {
    &:hover {
      border-color: #ff4d4d;
      color: #ff4d4d;
      background: rgba(255, 77, 77, 0.1);
    }
  }
`;

const EmptyState = styled.div`
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

const TraineeForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const FormInput = styled.input`
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

const FormTextarea = styled.textarea`
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

// -- Comparison Modal Styles --

const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ComparisonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const ComparisonSelection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const AnalysisSelector = styled.div<{ $selected: boolean }>`
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

const SelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SelectorName = styled.div`
  color: #D4A043;
  font-weight: 700;
  font-size: 0.95rem;
`;

const SelectorScore = styled.span`
  background: #D4A043;
  color: #000;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
`;

const SelectorMeta = styled.div`
  color: #888;
  font-size: 0.85rem;
  margin-top: 5px;
`;

const ComparisonTable = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 20px;
`;

const ComparisonTableHeader = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(auto-fit, minmax(200px, 1fr));
  background: rgba(212, 160, 67, 0.1);
  border-bottom: 2px solid #D4A043;
  padding: 15px;
  gap: 10px;
`;

const ComparisonTableRow = styled.div`
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

const TableHeaderCell = styled.div`
  color: #D4A043;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
`;

const TableCell = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  text-align: center;
`;

const TableLabel = styled.div`
  color: #aaa;
  font-weight: 600;
  font-size: 0.9rem;
`;

const ScoreCell = styled.div<{ $score: number }>`
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

const ComparisonSummary = styled.div`
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const SummaryTitle = styled.h3`
  color: #D4A043;
  margin: 0 0 15px 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

const SummaryText = styled.p`
  color: #e0e0e0;
  line-height: 1.6;
  margin: 0;
`;

const ModalRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  border-bottom: 1px solid #1a1a1a;
  padding-bottom: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

const ModalRole = styled.div`
  color: #e6be74;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 5px;
  text-align: right;
`;

const ModalDesc = styled.div`
  color: #e0e0e0;
  font-size: 0.95rem;
  text-align: right;
`;

// -- Track Selection --

const SectionLabel = styled.div`
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

// -- Expert Selection Controls --

const ExpertControlBar = styled.div`
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

const ExpertControlText = styled.div`
  color: #ccc;
  font-size: 0.95rem;
  padding-right: 5px;

  strong {
    color: #D4A043;
    font-weight: 600;
  }
`;

const ExpertToggleGroup = styled.div`
  display: flex;
  background: rgba(255,255,255,0.05);
  border-radius: 50px;
  padding: 4px;
  border: 1px solid #333;
  gap: 5px;
`;

const ExpertToggleButton = styled.button<{ $active: boolean }>`
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  width: 100%;
  margin-bottom: 30px;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TrackCard = styled.div<{ $active: boolean }>`
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
    color: ${props => props.$active ? '#D4A043' : '#aaa'};
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
  }
`;

const PremiumCoachCard = styled.div<{ $active: boolean }>`
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

// -- Features Grid (Resized to match TrackCard) --

const FeatureCard = styled.div<{ $selected: boolean }>`
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

  /* Checkmark */
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

const FeatureTitle = styled.h4<{ $selected: boolean }>`
  color: ${props => props.$selected ? '#D4A043' : '#ccc'};
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
`;

const FeatureDesc = styled.p`
  color: #e0e0e0;
  font-size: 0.75rem;
  line-height: 1.1;
  margin: 5px 0 0 0;
  font-weight: 400;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// -- Upload Section --

const UploadContainer = styled.div<{ $hasFile?: boolean }>`
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

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const UploadIcon = styled.div`
  font-size: 50px;
  color: #D4A043;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(212, 160, 67, 0.2));
`;

const UploadTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  text-align: center;
`;

const UploadSubtitle = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 25px;
  text-align: center;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
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

const FullSizePreview = styled.div`
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
    height: 100%;
    object-fit: contain;
    max-height: 500px;
  }
`;

const RemoveFileBtn = styled.button`
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

// -- PDF Upload Section --

const PdfUploadWrapper = styled.div`
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: center;
  margin-top: -10px;
  margin-bottom: 20px;
`;

const PdfUploadLabel = styled.label`
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

const PdfFileInfo = styled.div`
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

const RemovePdfBtnSmall = styled.button`
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

// -- Input Section --

const InputWrapper = styled.div`
  width: 100%;
  max-width: 700px;
  position: relative;
  margin-top: 20px;
`;

const MainInput = styled.textarea`
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

const ActionButton = styled.button<{ $isReady?: boolean; $isLoading?: boolean }>`
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
  
  /* Ready state animation */
  ${props => props.$isReady && !props.$isLoading && css`
    animation: ${glowReady} 2s infinite ease-in-out;
  `}

  /* Loading state styles */
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

const ErrorMsg = styled.div`
  color: #ff4d4d;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
`;

// -- Response Section --

const ResponseArea = styled.div`
  width: 100%;
  max-width: 900px;
  margin-top: 40px;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const SectionTitleExternal = styled.h3`
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

const CompactResultBox = styled.div`
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

const HookText = styled.p`
  color: #fff !important;
  font-style: italic;
  font-family: 'Frank Ruhl Libre', serif !important;
`;

// -- Premium Expert Cards --

const ExpertsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
`;

const ExpertResultCard = styled.div`
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

  /* Decorative Stars */
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

const ExpertScore = styled.span`
  background: #D4A043;
  color: #000;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 2px 8px;
  border-radius: 4px;
`;

const ExpertSectionTitle = styled.h5`
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

const ExpertText = styled.p`
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 10px;
`;

// -- Committee Section --

const CommitteeSection = styled.div`
  margin-top: 40px;
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CommitteeText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin: 0;
`;

const CommitteeTips = styled.div`
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

const FinalScore = styled.div`
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

// -- Action Buttons (Footer of Response) --

const ActionButtonsContainer = styled.div`
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

const SecondaryButton = styled.button`
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

const PrimaryButton = styled.button`
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

const PremiumBadge = styled.span`
  background: rgba(212, 160, 67, 0.15);
  color: #D4A043;
  border: 1px solid rgba(212, 160, 67, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
`;

// --- SVGs ---

const PhoneStarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
    <path d="M14.5 9.5l-2.5-1.5-2.5 1.5 1-3-2.5-1.5h3l1.5-3 1.5 3h3l-2.5 1.5 1 3z" style={{ fill: 'currentColor', stroke: 'none' }} opacity="0.5"/>
    <path d="M12 6v6" opacity="0.01"/>
  </svg>
);

const TheaterMasksIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10.5C2 5.8 5.8 2 10.5 2h3C18.2 2 22 5.8 22 10.5v1c0 4.7-3.8 8.5-8.5 8.5h-3C5.8 20 2 16.2 2 11.5v-1z" />
    <path d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12 16c-2.5 0-4-2-4-2s1.5-2 4-2 4 2 4 2-1.5 2-4 2z" />
  </svg>
);

const MicrophoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CinematicCameraIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <circle cx="9" cy="12" r="3" />
    <path d="M16 16l6 2V6l-6 2" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
);
const UploadIconSmall = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const BulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2v1"></path><path d="M12 6a7 7 0 0 1 7 7c0 2-2 3-2 3v2a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2s-2-1-2-3a7 7 0 0 1 7-7z"></path></svg>
);
const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
  </svg>
);

// Updated Subtle Icons
const SubtleSparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 7h7l-6 5 2 8-6-5-6 5 2-8-6-5h7z" />
  </svg>
);
const SubtleDocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CoachIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const ComparisonIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 12l4-4 4 4 6-6" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    <circle cx="11" cy="8" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="21" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

// --- Logo Component ---

const LogoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const LogoPlaceholder = styled.div`
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

const HiddenLogoInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const StyledLogoImg = styled.img`
  width: 100%;
  height: auto;
  max-width: 320px;
  object-fit: contain;
`;

const AppLogo = () => {
  return (
    <LogoContainer>
      <StyledLogoImg 
        src="/Logo.png" 
        alt="Logo"
      />
    </LogoContainer>
  );
};

// --- Modal Component ---

const CapabilitiesModal = ({ isOpen, onClose, activeTab, setActiveTab }: { isOpen: boolean, onClose: () => void, activeTab: string, setActiveTab: (t: string) => void }) => {
  if (!isOpen) return null;

  const content: Record<string, { role: string; desc: string }[]> = {
    actors: [
      { role: 'הבמאי', desc: 'בניית הסצנה, פיצוח הרצון, חלוקה לביטים.' },
      { role: 'מלהקת ראשית', desc: 'טייפקאסט, אמינות, האם הוא "חי" את הדמות.' },
      { role: 'התסריטאי', desc: 'דיוק בטקסט, הבנת הסאב-טקסט והניואנסים.' },
      { role: 'מאמן משחק', desc: 'מתח גופני, בחירות רגשיות, זיכרון חושי.' },
      { role: 'צלם ראשי', desc: 'מציאת האור, קשר עין, עבודה מול עדשה.' },
      { role: 'מומחה שפת גוף', desc: 'הלימה בין גוף לטקסט, מיקרו-הבעות.' },
      { role: 'מנטור אודישנים', desc: 'הצגה עצמית, כניסה ויציאה מדמות.' },
      { role: 'אסטרטג קריירה', desc: 'התאמה לתיק עבודות, פוטנציאל ליהוק.' },
    ],
    musicians: [
       { role: 'מאמן ווקאלי', desc: 'טכניקה, דיוק בצליל, נשימה, תמיכה.' },
       { role: 'מפיק מוזיקלי', desc: 'ריתמיקה, גרוב, דינמיקה, עיבוד.' },
       { role: 'השופט הקשוח', desc: 'ייחודיות, חותם אישי, כריזמה.' },
       { role: 'מומחה פרפורמנס', desc: 'הגשה, תנועה על במה, קשר עם הקהל.' },
       { role: 'מומחה אינטרפרטציה', desc: 'רגש, חיבור לטקסט, אמינות בהגשה.' },
       { role: 'סטיילינג ותדמית', desc: 'לוק, נראות, התאמה לז\'אנר.' },
       { role: 'מנהל רפרטואר', desc: 'בחירת שיר, התאמה למנעד ולזמר.' },
       { role: 'עורך רדיו', desc: 'פוטנציאל רדיופוני, מסחריות.' },
    ],
    creators: [
       { role: 'אסטרטג ויראליות', desc: 'הבטחה מול ביצוע, פוטנציאל שיתוף.' },
       { role: 'מאסטר הוקים', desc: '3 שניות ראשונות, לכידת תשומת לב.' },
       { role: 'עורך וידאו', desc: 'קצב וזרימה, חיתוכים, זום, אפקטים.' },
       { role: 'האקר אלגוריתם', desc: 'זמן צפייה, צפייה חוזרת.' },
       { role: 'מומחה אנרגיה', desc: 'וייב, אותנטיות, התאמה לטרנדים.' },
       { role: 'עורך הפקה', desc: 'ערך הפקה, תאורה, איכות סאונד, כתוביות.' },
       { role: 'גורו מעורבות', desc: 'הנעה לפעולה, עידוד תגובות.' },
       { role: 'תסריטאי רשת', desc: 'פאנץ\', הידוק מסרים, סטוריטלינג קצר.' },
    ],
    coach: [
       { role: 'מאמן נוכחות מקצועית', desc: 'נוכחות בימתית, ביטחון עצמי, החזקת קהל, אנרגיה.' },
       { role: 'מומחה דיבור והגשה', desc: 'דיקציה, שטף, אינטונציה, קצב דיבור, נשימה.' },
       { role: 'אנליסט מסר ותוכן', desc: 'בהירות מסר, מבנה לוגי, שכנוע, העברת ערך.' },
       { role: 'מאמן חיבור רגשי', desc: 'אותנטיות, אמפתיה, יצירת קשר עם קהל, רגש.' },
       { role: 'מומחה שפת גוף מקצועית', desc: 'תנועות ידיים, יציבה, קשר עין, תנועה במרחב.' },
       { role: 'אסטרטג התפתחות', desc: 'מעקב התקדמות, זיהוי נקודות חוזק וחולשה, מדידות.' },
       { role: 'מאמן ביצועים', desc: 'אנרגיה, דינמיקה, מעברים חלקים, קצב.' },
       { role: 'יועץ מותג אישי', desc: 'עקביות, ייחודיות, מיצוב מקצועי, תדמית.' },
    ],
    influencers: [
       { role: 'מאסטר רטוריקה', desc: 'דיקציה, שטף דיבור, שכנוע והעברת מסר.' },
       { role: 'בונה סמכות', desc: 'מיצוב כמומחה, אמינות מקצועית וביטחון.' },
       { role: 'סטוריטלר עסקי', desc: 'העברת מסר מורכב בפשטות ורגש.' },
       { role: 'מומחה שפת גוף', desc: 'פתיחות, ביטחון עצמי, תנועות ידיים.' },
       { role: 'מנהל מותג אישי', desc: 'בידול, ערכים, שפה ויזואלית אחידה.' },
       { role: 'כריזמה בימתית', desc: 'נוכחות, החזקת קהל, אנרגיה גבוהה.' },
       { role: 'קופירייטר שיווקי', desc: 'דיוק המסר, הנעה לפעולה אפקטיבית.' },
       { role: 'אסטרטג תוכן', desc: 'ערך לקהל, בניית אמון לאורך זמן.' },
    ]
  };

  const tabs = [
    { id: 'actors', label: 'שחקנים ואודישנים' },
    { id: 'musicians', label: 'זמרים ומוזיקאים' },
    { id: 'creators', label: 'יוצרי תוכן וכוכבי רשת' },
    { id: 'coach', label: 'מסלול פרימיום סטודיו ומאמנים' },
    { id: 'influencers', label: 'משפיענים ומותגים' },
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>יכולות האפליקציה של סוכן העל</ModalTitle>
          <ModalSubtitle>
            פשוט וקל<br/>
            מעלים סרטון, מצרפים קובץ הנחיות או תסריט (לדיוק מקסימלי),
            כותבים הנחיה, הוראות או שאלות למומחים (אופציונלי) ולוחצים על אקשן !
          </ModalSubtitle>
        </ModalHeader>
        
        <ModalTabs>
          {tabs.map(tab => (
            <ModalTab 
              key={tab.id} 
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </ModalTab>
          ))}
        </ModalTabs>

        <TrackDescriptionText>
           {TRACK_DESCRIPTIONS[activeTab]}
        </TrackDescriptionText>
        
        <ModalBody>
          {content[activeTab]?.map((item, idx) => (
             <ModalRow key={idx}>
               <ModalRole>{item.role}</ModalRole>
               <ModalDesc>{item.desc}</ModalDesc>
             </ModalRow>
          )) || <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>תוכן בבנייה...</div>}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// --- Comparison Modal ---

const ComparisonModal = ({
  isOpen,
  onClose,
  savedAnalyses,
  trainees
}: {
  isOpen: boolean;
  onClose: () => void;
  savedAnalyses: SavedAnalysis[];
  trainees: Trainee[];
}) => {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const getTraineeName = (traineeId?: string) => {
    if (!traineeId) return 'לא שויך';
    const trainee = trainees.find(t => t.id === traineeId);
    return trainee?.name || 'לא נמצא';
  };

  const toggleAnalysisSelection = (analysisId: string) => {
    setSelectedAnalyses(prev => {
      if (prev.includes(analysisId)) {
        return prev.filter(id => id !== analysisId);
      } else {
        if (prev.length >= 4) {
          alert('ניתן להשוות עד 4 ניתוחים בבת אחת');
          return prev;
        }
        return [...prev, analysisId];
      }
    });
  };

  const selectedAnalysesData = savedAnalyses.filter(a => selectedAnalyses.includes(a.id));

  const generateComparison = () => {
    if (selectedAnalysesData.length < 2) {
      return null;
    }

    // Compare by expert roles
    const allExpertRoles = new Set<string>();
    selectedAnalysesData.forEach(analysis => {
      analysis.result.expertAnalysis?.forEach(expert => {
        allExpertRoles.add(expert.role);
      });
    });

    return Array.from(allExpertRoles).map(role => {
      const comparisonRow: any = { role, scores: [] };
      selectedAnalysesData.forEach(analysis => {
        const expert = analysis.result.expertAnalysis?.find(e => e.role === role);
        if (expert) {
          comparisonRow.scores.push(expert.score);
        } else {
          comparisonRow.scores.push(null);
        }
      });
      return comparisonRow;
    });
  };

  const comparisonData = generateComparison();
  const overallAverages = selectedAnalysesData.map(a => a.averageScore);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>השוואת ניתוחים - Coach Edition</ModalTitle>
          <ModalSubtitle>
            השווה בין ניתוחים שונים של מתאמנים או ניתוחים לאורך זמן
          </ModalSubtitle>
        </ModalHeader>

        <ModalBody>
          <ComparisonContainer>
            <ComparisonHeader>
              <div>
                <h3 style={{ color: '#D4A043', margin: '0 0 5px 0' }}>
                  בחר ניתוחים להשוואה ({selectedAnalyses.length} נבחרו)
                </h3>
                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                  ניתן לבחור עד 4 ניתוחים להשוואה
                </p>
              </div>
            </ComparisonHeader>

            {savedAnalyses.length === 0 ? (
              <EmptyState>
                <h3>אין ניתוחים שמורים</h3>
                <p>שמור ניתוחים כדי להשוות אותם</p>
              </EmptyState>
            ) : (
              <>
                <ComparisonSelection>
                  {savedAnalyses
                    .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
                    .map(analysis => (
                      <AnalysisSelector
                        key={analysis.id}
                        $selected={selectedAnalyses.includes(analysis.id)}
                        onClick={() => toggleAnalysisSelection(analysis.id)}
                      >
                        <SelectorHeader>
                          <SelectorName>{analysis.videoName}</SelectorName>
                          <SelectorScore>{analysis.averageScore}</SelectorScore>
                        </SelectorHeader>
                        <SelectorMeta>
                          {getTraineeName(analysis.traineeId)}
                          {' • '}
                          {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                        </SelectorMeta>
                      </AnalysisSelector>
                    ))}
                </ComparisonSelection>

                {selectedAnalysesData.length >= 2 && (
                  <>
                    <ComparisonTable>
                      <ComparisonTableHeader>
                        <TableHeaderCell>מומחה</TableHeaderCell>
                        {selectedAnalysesData.map(analysis => (
                          <TableHeaderCell key={analysis.id}>
                            {getTraineeName(analysis.traineeId)}
                            <br />
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                              {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                            </span>
                          </TableHeaderCell>
                        ))}
                      </ComparisonTableHeader>

                      {comparisonData?.map((row, idx) => (
                        <ComparisonTableRow key={idx}>
                          <TableLabel>{row.role}</TableLabel>
                          {row.scores.map((score: number | null, scoreIdx: number) => (
                            <TableCell key={scoreIdx}>
                              {score !== null ? (
                                <ScoreCell $score={score}>{score}</ScoreCell>
                              ) : (
                                <span style={{ color: '#666' }}>-</span>
                              )}
                            </TableCell>
                          ))}
                        </ComparisonTableRow>
                      ))}

                      <ComparisonTableRow style={{ background: 'rgba(212, 160, 67, 0.1)', fontWeight: 700 }}>
                        <TableLabel style={{ color: '#D4A043', fontWeight: 700 }}>ציון ממוצע כולל</TableLabel>
                        {overallAverages.map((avg, idx) => (
                          <TableCell key={idx}>
                            <ScoreCell $score={avg}>{avg}</ScoreCell>
                          </TableCell>
                        ))}
                      </ComparisonTableRow>
                    </ComparisonTable>

                    <ComparisonSummary>
                      <SummaryTitle>סיכום השוואה</SummaryTitle>
                      <SummaryText>
                        {selectedAnalysesData.length > 0 && (
                          <>
                            <strong>מתאמנים משוואים:</strong>{' '}
                            {Array.from(new Set(selectedAnalysesData.map(a => getTraineeName(a.traineeId)))).join(', ')}
                            <br />
                            <strong>טווח תאריכים:</strong>{' '}
                            {new Date(Math.min(...selectedAnalysesData.map(a => new Date(a.analysisDate).getTime()))).toLocaleDateString('he-IL')}
                            {' - '}
                            {new Date(Math.max(...selectedAnalysesData.map(a => new Date(a.analysisDate).getTime()))).toLocaleDateString('he-IL')}
                            <br />
                            <strong>השינוי בציון הממוצע:</strong>{' '}
                            {overallAverages.length > 1 && (
                              <>
                                {overallAverages[overallAverages.length - 1] > overallAverages[0] ? '↑ עלייה' : 
                                 overallAverages[overallAverages.length - 1] < overallAverages[0] ? '↓ ירידה' : '→ ללא שינוי'}
                                {' '}({overallAverages[0]} → {overallAverages[overallAverages.length - 1]})
                              </>
                            )}
                          </>
                        )}
                      </SummaryText>
                    </ComparisonSummary>
                  </>
                )}
              </>
            )}
          </ComparisonContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// --- Coach Dashboard Modal ---

const CoachDashboardModal = ({ 
  isOpen, 
  onClose, 
  trainees, 
  setTrainees,
  savedAnalyses,
  onTraineeSelect,
  onViewAnalysis,
  onExportReport
}: { 
  isOpen: boolean; 
  onClose: () => void;
  trainees: Trainee[];
  setTrainees: React.Dispatch<React.SetStateAction<Trainee[]>>;
  savedAnalyses: SavedAnalysis[];
  onTraineeSelect?: (traineeId: string) => void;
  onViewAnalysis?: (analysis: SavedAnalysis) => void;
  onExportReport?: (traineeId: string) => void;
}) => {
  const [isAddingTrainee, setIsAddingTrainee] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [viewingTraineeAnalyses, setViewingTraineeAnalyses] = useState<string | null>(null);

  useEffect(() => {
    // Sync with localStorage
    localStorage.setItem('viraly_coach_trainees', JSON.stringify(trainees));
  }, [trainees]);

  const handleSaveTrainee = () => {
    if (!formData.name.trim()) {
      alert('נא להזין שם מתאמן');
      return;
    }

    if (editingTrainee) {
      // Update existing
      setTrainees(prev => prev.map(t => 
        t.id === editingTrainee.id 
          ? { ...t, ...formData, email: formData.email || undefined, phone: formData.phone || undefined, notes: formData.notes || undefined }
          : t
      ));
      setEditingTrainee(null);
    } else {
      // Add new
      const newTrainee: Trainee = {
        id: `trainee_${Date.now()}`,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
        createdAt: new Date(),
        analyses: []
      };
      setTrainees(prev => [...prev, newTrainee]);
      setIsAddingTrainee(false);
    }
    
    setFormData({ name: '', email: '', phone: '', notes: '' });
  };

  const handleDeleteTrainee = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מתאמן זה?')) {
      setTrainees(prev => prev.filter(t => t.id !== id));
      // Also remove saved analyses for this trainee
      const updatedAnalyses = savedAnalyses.filter(a => a.traineeId !== id);
      localStorage.setItem('viraly_coach_analyses', JSON.stringify(updatedAnalyses));
    }
  };

  const handleEditTrainee = (trainee: Trainee) => {
    setEditingTrainee(trainee);
    setFormData({
      name: trainee.name,
      email: trainee.email || '',
      phone: trainee.phone || '',
      notes: trainee.notes || ''
    });
    setIsAddingTrainee(true);
  };

  const getTraineeAnalysesCount = (traineeId: string) => {
    return savedAnalyses.filter(a => a.traineeId === traineeId).length;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>ניהול מתאמנים - Coach Edition</ModalTitle>
          <ModalSubtitle>
            ניהול רשימת המתאמנים שלך, מעקב התקדמות וניתוחים שמורים
          </ModalSubtitle>
        </ModalHeader>

        <ModalBody>
          <CoachDashboardContainer>
            <CoachHeader>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 5px 0' }}>
                  {trainees.length} מתאמנים רשומים
                </h3>
                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                  סך הכל {savedAnalyses.length} ניתוחים שמורים
                </p>
              </div>
              {!isAddingTrainee && (
                <CoachButton onClick={() => {
                  setIsAddingTrainee(true);
                  setEditingTrainee(null);
                  setFormData({ name: '', email: '', phone: '', notes: '' });
                }}>
                  + הוסף מתאמן חדש
                </CoachButton>
              )}
            </CoachHeader>

            {isAddingTrainee && (
              <TraineeForm style={{ background: 'rgba(212, 160, 67, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.2)' }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 15px 0' }}>
                  {editingTrainee ? 'עריכת מתאמן' : 'מתאמן חדש'}
                </h3>
                <FormInput
                  placeholder="שם מלא *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <FormInput
                  type="email"
                  placeholder="אימייל (אופציונלי)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <FormInput
                  type="tel"
                  placeholder="טלפון (אופציונלי)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <FormTextarea
                  placeholder="הערות (אופציונלי)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <CoachButton onClick={handleSaveTrainee} style={{ flex: 1 }}>
                    {editingTrainee ? 'שמור שינויים' : 'שמור מתאמן'}
                  </CoachButton>
                  <TraineeActionButton onClick={() => {
                    setIsAddingTrainee(false);
                    setEditingTrainee(null);
                    setFormData({ name: '', email: '', phone: '', notes: '' });
                  }}>
                    ביטול
                  </TraineeActionButton>
                </div>
              </TraineeForm>
            )}

            {trainees.length === 0 && !isAddingTrainee ? (
              <EmptyState>
                <h3>אין מתאמנים רשומים</h3>
                <p>התחל בהוספת מתאמן חדש כדי להתחיל לעבוד</p>
                <CoachButton onClick={() => setIsAddingTrainee(true)}>
                  + הוסף מתאמן ראשון
                </CoachButton>
              </EmptyState>
            ) : (
              <TraineeGrid>
                {trainees.map(trainee => {
                  const analysesCount = getTraineeAnalysesCount(trainee.id);
                  return (
                    <TraineeCard key={trainee.id}>
                      <TraineeName>{trainee.name}</TraineeName>
                      {trainee.email && (
                        <TraineeInfo>
                          📧 {trainee.email}
                        </TraineeInfo>
                      )}
                      {trainee.phone && (
                        <TraineeInfo>
                          📱 {trainee.phone}
                        </TraineeInfo>
                      )}
                      <TraineeInfo>
                        📊 {analysesCount} ניתוחים שמורים
                      </TraineeInfo>
                      {trainee.notes && (
                        <TraineeInfo style={{ color: '#888', fontSize: '0.85rem', marginTop: '10px' }}>
                          {trainee.notes}
                        </TraineeInfo>
                      )}
                      <TraineeActions>
                        <TraineeActionButton onClick={() => {
                          setViewingTraineeAnalyses(viewingTraineeAnalyses === trainee.id ? null : trainee.id);
                        }}>
                          {viewingTraineeAnalyses === trainee.id ? 'הסתר ניתוחים' : 'צפה בניתוחים'}
                        </TraineeActionButton>
                        <TraineeActionButton onClick={() => {
                          if (onTraineeSelect) onTraineeSelect(trainee.id);
                          onClose();
                        }}>
                          בחר לניתוח
                        </TraineeActionButton>
                        <TraineeActionButton onClick={() => handleEditTrainee(trainee)}>
                          ערוך
                        </TraineeActionButton>
                        {analysesCount > 0 && onExportReport && (
                          <TraineeActionButton 
                            onClick={() => {
                              onExportReport(trainee.id);
                            }}
                            style={{ background: 'rgba(212, 160, 67, 0.1)', borderColor: '#D4A043', color: '#D4A043' }}
                          >
                            📄 יצא דוח PDF
                          </TraineeActionButton>
                        )}
                        <TraineeActionButton 
                          className="delete"
                          onClick={() => handleDeleteTrainee(trainee.id)}
                        >
                          מחק
                        </TraineeActionButton>
                      </TraineeActions>
                      {viewingTraineeAnalyses === trainee.id && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #222' }}>
                          <h4 style={{ color: '#D4A043', margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                            ניתוחים שמורים ({analysesCount})
                          </h4>
                          {analysesCount === 0 ? (
                            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                              אין ניתוחים שמורים עבור מתאמן זה
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {savedAnalyses
                                .filter(a => a.traineeId === trainee.id)
                                .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
                                .map(analysis => (
                                  <div 
                                    key={analysis.id}
                                    style={{
                                      background: 'rgba(212, 160, 67, 0.05)',
                                      border: '1px solid rgba(212, 160, 67, 0.2)',
                                      borderRadius: '6px',
                                      padding: '12px',
                                      cursor: onViewAnalysis ? 'pointer' : 'default'
                                    }}
                                    onClick={() => onViewAnalysis && onViewAnalysis(analysis)}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                      <span style={{ color: '#D4A043', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {analysis.videoName}
                                      </span>
                                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <span style={{ 
                                        background: '#D4A043', 
                                        color: '#000', 
                                        padding: '2px 8px', 
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700
                                      }}>
                                        ציון: {analysis.averageScore}
                                      </span>
                                      {onViewAnalysis && (
                                        <span style={{ color: '#888', fontSize: '0.85rem' }}>
                                          לחץ לצפייה →
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TraineeCard>
                  );
                })}
              </TraineeGrid>
            )}
          </CoachDashboardContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// --- Main App Logic ---

const TRACKS = [
  { id: 'actors', label: 'שחקנים ואודישנים', icon: <TheaterMasksIcon /> },
  { id: 'musicians', label: 'זמרים ומוזיקאים', icon: <MusicNoteIcon /> },
  { id: 'creators', label: 'יוצרי תוכן וכוכבי רשת', icon: <PhoneStarIcon /> },
  { id: 'influencers', label: 'משפיענים ומותגים', icon: <MicrophoneIcon /> },
  { id: 'coach', label: 'מסלול פרימיום', icon: <CoachIcon />, isPremium: true },
];

const EXPERTS_BY_TRACK: Record<string, { title: string; desc: string }[]> = {
  coach: [
    { title: 'מאמן נוכחות מקצועית', desc: 'נוכחות בימתית, ביטחון עצמי, החזקת קהל' },
    { title: 'מומחה דיבור והגשה', desc: 'דיקציה, שטף, אינטונציה, קצב דיבור' },
    { title: 'אנליסט מסר ותוכן', desc: 'בהירות מסר, מבנה לוגי, שכנוע' },
    { title: 'מאמן חיבור רגשי', desc: 'אותנטיות, אמפתיה, יצירת קשר עם קהל' },
    { title: 'מומחה שפת גוף מקצועית', desc: 'תנועות ידיים, יציבה, קשר עין, תנועה במרחב' },
    { title: 'אסטרטג התפתחות', desc: 'מעקב התקדמות, זיהוי נקודות חוזק וחולשה' },
    { title: 'מאמן ביצועים', desc: 'אנרגיה, דינמיקה, מעברים חלקים' },
    { title: 'יועץ מותג אישי', desc: 'עקביות, ייחודיות, מיצוב מקצועי' },
  ],
  creators: [
    { title: 'אסטרטג ויראליות', desc: 'הבטחה מול ביצוע, פוטנציאל שיתוף' },
    { title: 'מאסטר הוקים', desc: '3 שניות ראשונות, לכידת תשומת לב' },
    { title: 'עורך וידאו', desc: 'קצב וזרימה, חיתוכים, זום, אפקטים' },
    { title: 'האקר אלגוריתם', desc: 'זמן צפייה, צפייה חוזרת' },
    { title: 'מומחה אנרגיה', desc: 'וייב, אותנטיות, התאמה לטרנדים' },
    { title: 'עורך הפקה', desc: 'ערך הפקה, תאורה, איכות סאונד' },
    { title: 'גורו מעורבות', desc: 'הנעה לפעולה, עידוד תגובות' },
    { title: 'תסריטאי רשת', desc: 'פאנץ\', הידוק מסרים, סטוריטלינג' },
  ],
  influencers: [
    { title: 'מאסטר רטוריקה', desc: 'דיקציה, שטף דיבור, שכנוע' },
    { title: 'בונה סמכות', desc: 'מיצוב כמומחה, אמינות מקצועית' },
    { title: 'סטוריטלר עסקי', desc: 'העברת מסר מורכב בפשטות' },
    { title: 'מומחה שפת גוף', desc: 'פתיחות, ביטחון עצמי, תנועות' },
    { title: 'מנהל מותג אישי', desc: 'בידול, ערכים, שפה ויזואלית' },
    { title: 'כריזמה בימתית', desc: 'נוכחות, החזקת קהל, אנרגיה' },
    { title: 'קופירייטר שיווקי', desc: 'דיוק המסר, הנעה לפעולה' },
    { title: 'אסטרטג תוכן', desc: 'ערך לקהל, בניית אמון' },
  ],
  actors: [
    { title: 'הבמאי', desc: 'בניית הסצנה, פיצוח הרצון' },
    { title: 'מלהקת ראשית', desc: 'טייפקאסט, אמינות, דמות' },
    { title: 'התסריטאי', desc: 'דיוק בטקסט, סאב-טקסט' },
    { title: 'מאמן משחק', desc: 'מתח גופני, בחירות רגשיות' },
    { title: 'צלם ראשי', desc: 'מציאת האור, קשר עין, עדשה' },
    { title: 'מומחה שפת גוף', desc: 'הלימה בין גוף לטקסט' },
    { title: 'מנטור אודישנים', desc: 'הצגה עצמית, כניסה לדמות' },
    { title: 'אסטרטג קריירה', desc: 'התאמה לתיק עבודות, ליהוק' },
  ],
  musicians: [
    { title: 'מאמן ווקאלי', desc: 'טכניקה, דיוק בצליל, נשימה' },
    { title: 'מפיק מוזיקלי', desc: 'ריתמיקה, גרוב, דינמיקה, עיבוד' },
    { title: 'השופט הקשוח', desc: 'ייחודיות, חותם אישי, כריזמה' },
    { title: 'מומחה פרפורמנס', desc: 'הגשה, תנועה על במה, קהל' },
    { title: 'מומחה אינטרפרטציה', desc: 'רגש, חיבור לטקסט, אמינות' },
    { title: 'סטיילינג ותדמית', desc: 'לוק, נראות, התאמה לז\'אנר' },
    { title: 'מנהל רפרטואר', desc: 'בחירת שיר, התאמה למנעד' },
    { title: 'עורך רדיו', desc: 'פוטנציאל רדיופוני, מסחריות' },
  ],
};

const App = () => {
  const [activeTrack, setActiveTrack] = useState<TrackId>('actors');
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('actors');
  const [hasPremiumAccess] = useState(true); // Placeholder for future premium gating logic
  
  // Results
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [previousResult, setPreviousResult] = useState<AnalysisResult | null>(null);
  const [isImprovementMode, setIsImprovementMode] = useState(false);

  // Coach Edition State
  const [coachMode, setCoachMode] = useState<'coach' | 'trainee' | null>(null);
  const [coachTrainingTrack, setCoachTrainingTrack] = useState<TrackId>('actors'); // תחום האימון שנבחר במסלול Coach
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'deep'>('standard'); // סוג הניתוח: רגיל או מעמיק
  const [trainees, setTrainees] = useState<Trainee[]>(() => {
    try {
      const saved = localStorage.getItem('viraly_coach_trainees');
      return saved ? JSON.parse(saved).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        analyses: t.analyses || []
      })) : [];
    } catch {
      return [];
    }
  });
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem('viraly_coach_analyses');
      return saved ? JSON.parse(saved).map((a: any) => ({
        ...a,
        analysisDate: new Date(a.analysisDate)
      })) : [];
    } catch {
      return [];
    }
  });
  const [selectedTrainee, setSelectedTrainee] = useState<string | null>(null);
  const [showCoachDashboard, setShowCoachDashboard] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Sync savedAnalyses to localStorage
  useEffect(() => {
    localStorage.setItem('viraly_coach_analyses', JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
    const defaults = EXPERTS_BY_TRACK[trackToUse].slice(0, 3).map(e => e.title);
    setSelectedExperts(defaults);
  }, [activeTrack, coachTrainingTrack]);

  const handleTrackChange = (id: string) => {
    setActiveTrack(id as TrackId);
    setResult(null);
    setPreviousResult(null);
    setIsImprovementMode(false);
    // Sync modal tab with active track if possible
    if (['actors', 'musicians', 'creators', 'influencers', 'coach'].includes(id)) {
        setModalTab(id === 'coach' ? 'creators' : id);
    }
    // Reset coach training track when switching to coach mode
    if (id === 'coach') {
      // Don't auto-open dashboard, let user choose when to open it
    }
  };

  const toggleExpert = (title: string) => {
    setSelectedExperts(prev => {
      if (prev.includes(title)) {
        return prev.filter(t => t !== title);
      } else {
        if (prev.length >= 8) return prev;
        return [...prev, title];
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_BYTES) {
      alert("הקובץ גדול מדי. מגבלה: עד 5 דקות או 20MB.");
      resetInput();
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    const finalizeSelection = () => {
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
      if (!isImprovementMode) {
        setResult(null);
      }
    };

    if (selectedFile.type.startsWith('video')) {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = objectUrl;

      videoEl.onloadedmetadata = () => {
        if (videoEl.duration > MAX_VIDEO_SECONDS) {
          alert("הסרטון חורג מהמגבלה: עד 5 דקות או 20MB.");
          URL.revokeObjectURL(objectUrl);
          resetInput();
          return;
        }
        finalizeSelection();
      };

      videoEl.onerror = () => {
        alert("לא ניתן לקרוא את המטא-דאטה של הווידאו. נסה קובץ אחר.");
        URL.revokeObjectURL(objectUrl);
        resetInput();
      };
    } else {
      finalizeSelection();
    }
  };
  
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedPdf = e.target.files[0];
      if (selectedPdf.type === 'application/pdf') {
        setPdfFile(selectedPdf);
      } else {
        alert("נא להעלות קובץ PDF בלבד");
      }
    }
  };

  const handleRemovePdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleReset = () => {
    setFile(null);
    setPdfFile(null);
    setPreviewUrl(null);
    setPrompt('');
    setResult(null);
    setPreviousResult(null);
    setIsImprovementMode(false);
    setSelectedTrainee(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAnalysis = () => {
    if (!result || activeTrack !== 'coach') return;

    if (!selectedTrainee) {
      alert('נא לבחור מתאמן לפני שמירת הניתוח');
      setShowCoachDashboard(true);
      return;
    }

    const trainee = trainees.find(t => t.id === selectedTrainee);
    if (!trainee) {
      alert('מתאמן לא נמצא');
      return;
    }

    const savedAnalysis: SavedAnalysis = {
      id: `analysis_${Date.now()}`,
      videoName: file?.name || 'ניתוח ללא קובץ',
      videoUrl: previewUrl || '',
      traineeId: selectedTrainee,
      traineeName: trainee.name,
      analysisDate: new Date(),
      result: result,
      averageScore: averageScore,
      track: activeTrack,
      metadata: {
        duration: undefined, // ניתן להוסיף בעתיד
        fileSize: file?.size,
        prompt: prompt || undefined
      }
    };

    setSavedAnalyses(prev => [...prev, savedAnalysis]);
    alert(`הניתוח נשמר בהצלחה עבור ${trainee.name}`);
  };

  const handleUploadImprovedTake = () => {
    if (result) {
      setPreviousResult(result);
    }
    setResult(null);
    setIsImprovementMode(true);
    setFile(null);
    setPreviewUrl(null);
    // Keep PDF if uploaded, or clear it? Let's keep it as it might be relevant.
    setPrompt(''); 
    
    setTimeout(() => {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
      fileInputRef.current?.click();
    }, 100);
  };

  const handleExportCoachReport = (traineeId: string) => {
    const trainee = trainees.find(t => t.id === traineeId);
    if (!trainee) {
      alert('מתאמן לא נמצא');
      return;
    }

    const traineeAnalyses = savedAnalyses
      .filter(a => a.traineeId === traineeId)
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime());

    if (traineeAnalyses.length === 0) {
      alert('אין ניתוחים שמורים עבור מתאמן זה');
      return;
    }

    // Calculate trends
    const firstAnalysis = traineeAnalyses[0];
    const lastAnalysis = traineeAnalyses[traineeAnalyses.length - 1];
    const scoreChange = lastAnalysis.averageScore - firstAnalysis.averageScore;
    const isImproving = scoreChange > 0;

    // Calculate average scores per expert
    const expertAverages: Record<string, number[]> = {};
    traineeAnalyses.forEach(analysis => {
      analysis.result.expertAnalysis?.forEach(expert => {
        if (!expertAverages[expert.role]) {
          expertAverages[expert.role] = [];
        }
        expertAverages[expert.role].push(expert.score);
      });
    });

    const expertTrends = Object.entries(expertAverages).map(([role, scores]) => ({
      role,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      improvement: scores[scores.length - 1] - scores[0],
      scores
    }));

    // Generate report HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('לא ניתן לפתוח חלון חדש. אנא אפשר חלונות קופצים בדפדפן.');
      return;
    }

    const styles = `
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        direction: rtl;
        font-family: 'Assistant', sans-serif;
        background: #ffffff !important;
        color: #333333 !important;
        padding: 32px 32px 40px 32px;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Frank Ruhl Libre', serif;
        color: #b8862e !important;
        margin: 0 0 15px;
      }
      .report-wrapper { max-width: 1000px; margin: 0 auto; }
      .report-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
        border-bottom: 2px solid #b8862e;
        padding-bottom: 20px;
      }
      .report-header-text {
        text-align: right;
        flex: 1;
        margin-right: 20px;
      }
      .report-header h1 {
        margin: 0 0 10px;
        font-size: 2rem;
      }
      .report-header .subtitle {
        color: #666;
        font-size: 1rem;
      }
      .report-logo-left img {
        max-width: 120px;
        height: auto;
      }
      .trainee-info {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }
      .trainee-info h3 {
        margin-top: 0;
      }
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      .stat-box {
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }
      .stat-box .number {
        font-size: 2rem;
        font-weight: 800;
        color: #b8862e;
        display: block;
      }
      .stat-box .label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 5px;
      }
      .analysis-card {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .analysis-card h4 {
        color: #b8862e;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .expert-row {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px dashed #ddd;
      }
      .expert-row:last-child {
        border-bottom: none;
      }
      .expert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .expert-name {
        font-weight: 700;
        color: #333;
      }
      .expert-score {
        background: #b8862e;
        color: #fff;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 700;
      }
      .expert-text {
        color: #444;
        font-size: 0.9rem;
        line-height: 1.6;
        margin-top: 8px;
      }
      .trends-section {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin: 30px 0;
      }
      .trend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      .trend-item:last-child {
        border-bottom: none;
      }
      .improvement {
        color: #4CAF50;
        font-weight: 700;
      }
      .decline {
        color: #f44336;
        font-weight: 700;
      }
      a, button { display: none !important; }
      ul { padding-right: 20px; margin: 0; }
      li { margin-bottom: 8px; }
    `;

    const analysesHTML = traineeAnalyses.map((analysis, idx) => {
      const date = new Date(analysis.analysisDate).toLocaleDateString('he-IL');
      const expertsHTML = analysis.result.expertAnalysis?.map(expert => `
        <div class="expert-row">
          <div class="expert-header">
            <span class="expert-name">${expert.role}</span>
            <span class="expert-score">${expert.score}</span>
          </div>
          <div class="expert-text">
            <strong>ניתוח:</strong> ${expert.insight}<br/>
            <strong>טיפים:</strong> ${expert.tips}
          </div>
        </div>
      `).join('') || '';

      return `
        <div class="analysis-card">
          <h4>ניתוח #${idx + 1} - ${date}</h4>
          <div style="margin-bottom: 15px;">
            <strong>קובץ:</strong> ${analysis.videoName}<br/>
            <strong>ציון ממוצע:</strong> <span style="font-size: 1.2rem; font-weight: 700; color: #b8862e;">${analysis.averageScore}</span>
          </div>
          ${analysis.result.hook ? `<div style="background: #fff9e6; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-right: 4px solid #b8862e;"><strong>טיפ זהב:</strong> "${analysis.result.hook}"</div>` : ''}
          ${expertsHTML}
          ${analysis.result.committee ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd;">
              <strong>סיכום ועדת המומחים:</strong><br/>
              ${analysis.result.committee.summary}
              ${analysis.result.committee.finalTips && analysis.result.committee.finalTips.length > 0 ? `
                <ul style="margin-top: 10px;">
                  ${analysis.result.committee.finalTips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const trendsHTML = expertTrends.map(trend => `
      <div class="trend-item">
        <span>${trend.role}</span>
        <span>
          ממוצע: <strong>${trend.average.toFixed(1)}</strong>
          ${trend.improvement !== 0 ? ` | ${trend.improvement > 0 ? '<span class="improvement">↑ +' : '<span class="decline">↓ '}${trend.improvement.toFixed(1)}</span>` : ''}
        </span>
      </div>
    `).join('');

    printWindow.document.open();
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>דוח מתאמן - ${trainee.name}</title>
        </head>
        <body>
          <div class="report-wrapper">
            <div class="report-header">
              <div class="report-header-text">
                <h1>דוח מתאמן מקצועי</h1>
                <div class="subtitle">${trainee.name} | ${new Date().toLocaleDateString('he-IL')}</div>
              </div>
              <div class="report-logo-left">
                <img src="${window.location.origin}/Logo.png" alt="Viraly Logo" />
              </div>
            </div>

            <div class="trainee-info">
              <h3>פרטי המתאמן</h3>
              <p><strong>שם:</strong> ${trainee.name}</p>
              ${trainee.email ? `<p><strong>אימייל:</strong> ${trainee.email}</p>` : ''}
              ${trainee.phone ? `<p><strong>טלפון:</strong> ${trainee.phone}</p>` : ''}
              ${trainee.notes ? `<p><strong>הערות:</strong> ${trainee.notes}</p>` : ''}
            </div>

            <div class="summary-stats">
              <div class="stat-box">
                <span class="number">${traineeAnalyses.length}</span>
                <span class="label">סך ניתוחים</span>
              </div>
              <div class="stat-box">
                <span class="number">${firstAnalysis.averageScore}</span>
                <span class="label">ציון ראשון</span>
              </div>
              <div class="stat-box">
                <span class="number">${lastAnalysis.averageScore}</span>
                <span class="label">ציון אחרון</span>
              </div>
              <div class="stat-box">
                <span class="number ${isImproving ? 'improvement' : 'decline'}">${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)}</span>
                <span class="label">שינוי כולל</span>
              </div>
            </div>

            ${expertTrends.length > 0 ? `
              <div class="trends-section">
                <h3>מגמות לפי מומחה</h3>
                ${trendsHTML}
              </div>
            ` : ''}

            <h2>פירוט ניתוחים</h2>
            ${analysesHTML}
          </div>
        </body>
      </html>
    `);

    const styleTag = printWindow.document.createElement('style');
    styleTag.textContent = styles;
    printWindow.document.head.appendChild(styleTag);
    printWindow.document.close();

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportPdf = () => {
    if (!result) return;

    if (!hasPremiumAccess) {
      alert('יצוא ל-PDF זמין למנויי פרימיום בלבד.');
      return;
    }

    const contentElement = document.getElementById('analysis-content');
    if (!contentElement) {
      alert('לא נמצא תוכן ניתוח לייצוא.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('נא לאפשר חלונות קופצים כדי לייצא ל-PDF.');
      return;
    }

    const styles = `
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
      }
      body { 
        direction: rtl; 
        font-family: 'Assistant', sans-serif; 
        background: #ffffff !important; 
        color: #1a1a1a !important; 
        padding: 36px 42px 48px 42px;
      }
      h1,h2,h3,h4,h5,h6 {
        font-family: 'Frank Ruhl Libre', serif;
        color: #b8862e !important;
        margin: 0 0 12px;
        letter-spacing: 0.5px;
      }
      p, li, span, div {
        color: #2b2b2b;
        line-height: 1.6;
      }
      .export-wrapper { max-width: 1040px; margin: 0 auto; }
      .export-header { 
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px; 
        border-bottom: 2px solid #e6e6e6;
        padding-bottom: 14px;
      }
      .export-header-text {
        text-align: right;
        flex: 1;
        margin-right: 16px;
      }
      .export-note { color: #666; font-size: 11px; margin-top: 4px; }
      .export-logo-left {
        flex: 0 0 auto;
      }
      .export-logo-left img {
        max-width: 140px;
        height: auto;
        object-fit: contain;
      }
      .export-wrapper > * + * {
        margin-top: 18px;
      }
      .section-title {
        margin: 18px 0 10px;
        padding: 8px 12px;
        background: #fff7e6;
        border: 1px solid #f1e0c3;
        border-radius: 8px;
        color: #b0751f;
        font-weight: 800;
      }
      .card {
        border: 1px solid #e6e6e6;
        border-radius: 10px;
        padding: 16px 18px;
        margin-bottom: 14px;
        background: #ffffff;
        box-shadow: 0 4px 18px rgba(0,0,0,0.04);
      }
      .score-badge {
        display: inline-block;
        background: #b8862e;
        color: #000;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 800;
        margin-right: 6px;
      }
      .subtle-label {
        color: #555;
        font-weight: 700;
      }
      /* אל תציג כפתורים וקישורים */
      a, button { display: none !important; }
      /* רשימות */
      ul { padding-right: 20px; margin: 0; }
      li { margin-bottom: 8px; }
      /* איקונים – קטנים ועדינים יותר */
      svg { max-width: 16px; max-height: 16px; }
    `;

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <html dir="rtl">
        <head>
          <title>דו"ח ניתוח וידאו</title>
        </head>
        <body>
          <div class="export-wrapper">
            <div class="export-header">
              <div class="export-header-text">
                <h2>דו"ח ניתוח - Video Director Pro</h2>
                <div class="export-note">נוצר במסלול פרימיום • ${new Date().toLocaleString('he-IL')}</div>
              </div>
              <div class="export-logo-left">
                <img src="${window.location.origin}/Logo.png" alt="Viraly Logo" />
              </div>
            </div>
            ${contentElement.innerHTML}
          </div>
        </body>
      </html>
    `);

    // הזרקת סגנונות ייעודיים ל-PDF בלבד
    const styleTag = doc.createElement('style');
    styleTag.textContent = styles;
    doc.head.appendChild(styleTag);

    doc.close();

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (!base64data) {
           reject(new Error("Failed to read file"));
           return;
        }
        const base64Content = base64data.split(',')[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && !file) || selectedExperts.length < 3) return;
    
    // Start playing video when analysis begins
    if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => console.log('Playback not allowed:', e));
    }

    setLoading(true);
    
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        alert("חסר מפתח API. נא להגדיר VITE_GEMINI_API_KEY בסביבת ההרצה.");
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const expertPanel = selectedExperts.join(', ');

      let extraContext = '';
      if (isImprovementMode && previousResult) {
        extraContext = `
          CONTEXT: This is a "Second Take" (Attempt #2).
          The user is trying to improve based on previous feedback.
          
          TASK: Compare this new take to the previous analysis (implied). 
          Did they improve? Point out specific improvements in the expert analysis.
        `;
      }
      
      let pdfContext = '';
      if (pdfFile) {
        pdfContext = `
          ADDITIONAL CONTEXT: The user has attached a PDF document (Script, Audition Instructions, or Guidelines). 
          Use the content of this PDF to check if the video matches the requirements, lines, or tone described in the document.
          This is crucial for the "Script Analysis" or "Director" roles if selected.
        `;
      }

      const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
      const depthInstruction = activeTrack === 'coach' && analysisDepth === 'deep' ? `
        
        ANALYSIS DEPTH: DEEP & PROFESSIONAL ANALYSIS MODE
        - Provide extremely detailed, comprehensive, and thorough analysis
        - Include specific timestamps references when relevant (e.g., "בדקה 2:15...")
        - Give multiple layers of feedback (technical, emotional, performance, delivery)
        - Compare to professional standards and best practices
        - Provide actionable, specific, and detailed improvement recommendations
        - Include micro-analysis of body language, vocal nuances, and delivery subtleties
        - Analyze subtext, emotional depth, and authenticity
        - Reference industry benchmarks and professional expectations
        - This is for professional coaching purposes - be comprehensive and detailed.
      ` : activeTrack === 'coach' ? `
        
        ANALYSIS DEPTH: STANDARD ANALYSIS MODE
        - Provide clear, focused analysis
        - Give actionable feedback and recommendations
        - Focus on key areas for improvement
      ` : '';

      const systemInstruction = `
        You are "Viraly", a world-class Video Director and Analyst.
        Current Mode: ${trackToUse}${activeTrack === 'coach' ? ' (Coach Edition - Training Track)' : ''}.
        Panel: ${expertPanel}.
        ${depthInstruction}
        
        Task: Analyze the user's input (Idea/Script or Video File) strictly in HEBREW.
        
        CRITICAL: OUTPUT MUST BE 100% HEBREW. DO NOT USE ENGLISH WORDS IN THE DISPLAYED TEXT.
        Translate strictly:
        - Hook -> "עוגן" or "מקדם צפייה"
        - Cut -> "חיתוך"
        - Frame -> "פריים" (Transliteration allowed for standard industry terms)
        - Lighting -> "תאורה"
        - Script -> "תסריט"
        - Shot -> "שוט" or "צילום"
        - Viral -> "ויראלי"
        - Composition -> "קומפוזיציה"
        - Timeline -> "ציר הזמן"
        
        ${extraContext}
        ${pdfContext}

        Return the result as a raw JSON object with this exact structure (Keys must be English, Values MUST be Hebrew):
        {
          "expertAnalysis": [
            {
              "role": "Expert Title (Hebrew)",
              "insight": "Deep professional analysis from this expert's unique POV (Hebrew only)",
              "tips": "Actionable, specific tips for the next take (Hebrew only)",
              "score": number (1-100)
            }
          ],
          "hook": "The 'Golden Tip'. A single, explosive, game-changing sentence. It must be the absolute secret weapon for this specific video. Phrased as a direct, powerful, and unforgettable command that will transform the user's career. (Hebrew only)",
          "committee": {
            "summary": "A comprehensive summary from the entire committee, synthesizing the views (Hebrew only)",
            "finalTips": ["Tip 1 (Hebrew)", "Tip 2 (Hebrew)", "Tip 3 (Hebrew)"]
          }
        }

        Important:
        - "expertAnalysis" array must contain an object for EACH selected expert in the panel.
        - "hook" is NOT a suggestion for a video hook. It is the "Golden Insight" of the analysis.
        - "score" for each expert must be authentic (1-100).
        - Use purely Hebrew professional terms.
        - Do not use Markdown formatting inside the JSON strings.
        ${activeTrack === 'coach' && analysisDepth === 'deep' ? `
        - For DEEP analysis: Be extremely detailed, include specific examples, timestamps when possible, multiple layers of feedback, and comprehensive recommendations.
        ` : ''}
      `;

      const parts = [];
      
      // Force a text part if prompt is empty to ensure API stability
      if (!prompt.trim()) {
        parts.push({ text: "Please analyze the attached media based on the system instructions." });
      } else {
        parts.push({ text: prompt });
      }
      
      if (file) {
        if (file.size > MAX_FILE_BYTES) {
           alert("הקובץ גדול מדי. מגבלה: עד 5 דקות או 20MB.");
           setLoading(false);
           return;
        }
        try {
          const imagePart = await fileToGenerativePart(file);
          parts.push(imagePart);
        } catch (e) {
          console.error("File processing error", e);
          alert("שגיאה בעיבוד הקובץ");
          setLoading(false);
          return;
        }
      }

      if (pdfFile) {
         try {
           const pdfPart = await fileToGenerativePart(pdfFile);
           parts.push(pdfPart);
         } catch(e) {
            console.error("PDF processing error", e);
         }
      }

      const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
        contents: { parts },
        config: { 
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      // Robust JSON Parsing
      let jsonText = response.text || '{}';
      // Clean potential markdown fencing from the model
      jsonText = jsonText.replace(/```json|```/g, '').trim();
      
      let parsedResult: AnalysisResult;
      try {
        parsedResult = JSON.parse(jsonText) as AnalysisResult;
      } catch (e) {
        console.error("JSON Parse Error", e);
        console.log("Raw Text:", jsonText);
        alert("התקבלה תשובה לא תקינה מהמערכת. אנא נסה שוב.");
        setLoading(false);
        return;
      }
      
      // Calculate average
      if (parsedResult.expertAnalysis && parsedResult.expertAnalysis.length > 0) {
        const total = parsedResult.expertAnalysis.reduce((acc, curr) => acc + curr.score, 0);
        setAverageScore(Math.round(total / parsedResult.expertAnalysis.length));
      }

      setResult(parsedResult);
      
      // Jump to results area immediately
      setTimeout(() => {
        const resultsElement = document.getElementById('results-area');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);

    } catch (error: any) {
      console.error("API Error:", error);
      const code = error?.error?.code || error?.status;
      if (code === 429) {
        alert("חרגת ממכסת הקריאות למודל Gemini בחשבון גוגל. יש להמתין לחידוש המכסה או לשדרג חבילה.");
      } else if (code === 503) {
        alert("המודל של Gemini כרגע עמוס (503). נסה שוב בעוד כמה דקות.");
      } else {
        alert("אירעה שגיאה בניתוח. ייתכן שהאינטרנט איטי, יש עומס על המערכת או בעיית API.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isReady = (!!prompt || !!file) && selectedExperts.length >= 3;

  const trackToUse = activeTrack === 'coach' ? coachTrainingTrack : activeTrack;
  const currentExpertsList = EXPERTS_BY_TRACK[trackToUse];
  
  const handleSetTop3 = () => {
    const top3 = currentExpertsList.slice(0, 3).map(e => e.title);
    setSelectedExperts(top3);
  };

  const handleSetAll = () => {
    const all = currentExpertsList.map(e => e.title);
    setSelectedExperts(all);
  };

  const isTop3 = () => {
    const top3 = currentExpertsList.slice(0, 3).map(e => e.title);
    if (selectedExperts.length !== 3) return false;
    return top3.every(t => selectedExperts.includes(t));
  };

  const isAll = () => {
    return selectedExperts.length === currentExpertsList.length;
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <AppLogo />
          <Title>Video Director Pro</Title>
          <Subtitle>בינת וידאו לשחקנים, זמרים ויוצרי תוכן</Subtitle>
          <Description>
            סוכן על שמשלב ריאליטי, קולנוע, מוזיקה ומשפיענים.<br/>
            קבל ניתוח עומק, הערות מקצועיות וליווי עד לפריצה הגדולה.
          </Description>
          <CTAButton onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
            העלה סרטון וקבל ניתוח מלא
          </CTAButton>
          
          <CapabilitiesButton onClick={() => setIsModalOpen(true)}>
             יכולות האפליקציה של סוכן העל <SparklesIcon />
          </CapabilitiesButton>
        </Header>
        
        <CapabilitiesModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          activeTab={modalTab}
          setActiveTab={setModalTab}
        />

        <CoachDashboardModal
          isOpen={showCoachDashboard}
          onClose={() => setShowCoachDashboard(false)}
          trainees={trainees}
          setTrainees={setTrainees}
          savedAnalyses={savedAnalyses}
          onTraineeSelect={(traineeId) => {
            setSelectedTrainee(traineeId);
            setShowCoachDashboard(false);
          }}
          onViewAnalysis={(analysis) => {
            // ניתן להוסיף תצוגה של ניתוח שמור
            setResult(analysis.result);
            setAverageScore(analysis.averageScore);
            setShowCoachDashboard(false);
            setTimeout(() => {
              document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          onExportReport={handleExportCoachReport}
        />

        <ComparisonModal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          savedAnalyses={savedAnalyses}
          trainees={trainees}
        />

        <SectionLabel>בחר את מסלול הניתוח שלך:</SectionLabel>
        <Grid>
          {TRACKS.filter(track => !track.isPremium).map(track => (
            <TrackCard 
              key={track.id} 
              $active={activeTrack === track.id}
              onClick={() => handleTrackChange(track.id)}
            >
              {track.icon}
              <span>{track.label}</span>
            </TrackCard>
          ))}
          {TRACKS.filter(track => track.isPremium).map(track => (
            <PremiumCoachCard
              key={track.id}
              $active={activeTrack === track.id}
              onClick={() => handleTrackChange(track.id)}
            >
              {track.icon}
              <div className="coach-line1">מסלול פרימיום</div>
              <div className="coach-line2">סטודיו ומאמנים</div>
              <div className="coach-line3">Coach Edition</div>
            </PremiumCoachCard>
          ))}
        </Grid>
        
        <TrackDescriptionText>
           {TRACK_DESCRIPTIONS[activeTrack]}
        </TrackDescriptionText>

        {activeTrack === 'coach' && (
          <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <CoachButton onClick={() => setShowCoachDashboard(true)}>
                <CoachIcon />
                ניהול מתאמנים
              </CoachButton>
              <CoachButton onClick={() => setShowComparison(true)}>
                <ComparisonIcon />
                השוואת ניתוחים
              </CoachButton>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '800px' }}>
              <div style={{ background: 'rgba(212, 160, 67, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.1rem' }}>בחר תחום אימון</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {(['actors', 'musicians', 'creators', 'influencers'] as TrackId[]).map(trackId => {
                    const track = TRACKS.find(t => t.id === trackId);
                    return track ? (
                      <button
                        key={trackId}
                        onClick={() => setCoachTrainingTrack(trackId)}
                        style={{
                          background: coachTrainingTrack === trackId ? 'rgba(212, 160, 67, 0.2)' : 'rgba(20, 20, 20, 0.6)',
                          border: `2px solid ${coachTrainingTrack === trackId ? '#D4A043' : '#333'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          color: coachTrainingTrack === trackId ? '#D4A043' : '#aaa',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {track.label}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(212, 160, 67, 0.1)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                <span style={{ color: '#D4A043', fontWeight: 600 }}>סוג ניתוח:</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setAnalysisDepth('standard')}
                    style={{
                      background: analysisDepth === 'standard' ? '#D4A043' : 'transparent',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: analysisDepth === 'standard' ? '#000' : '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    ניתוח רגיל
                  </button>
                  <button
                    onClick={() => setAnalysisDepth('deep')}
                    style={{
                      background: analysisDepth === 'deep' ? '#D4A043' : 'transparent',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: analysisDepth === 'deep' ? '#000' : '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    ניתוח מעמיק
                  </button>
                </div>
              </div>

              {trainees.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(212, 160, 67, 0.1)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)' }}>
                  <span style={{ color: '#D4A043', fontWeight: 600 }}>מתאמן נבחר:</span>
                  <select 
                    value={selectedTrainee || ''} 
                    onChange={(e) => setSelectedTrainee(e.target.value || null)}
                    style={{
                      background: '#0a0a0a',
                      border: '1px solid #D4A043',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#D4A043',
                      fontFamily: 'Assistant, sans-serif',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    <option value="">-- בחר מתאמן --</option>
                    {trainees.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <SectionLabel>מי הם צוות המומחים שלך?</SectionLabel>
        
        <ExpertControlBar>
           <ExpertControlText>
             הנבחרת שלך ב<strong>{activeTrack === 'coach' ? TRACKS.find(t => t.id === coachTrainingTrack)?.label : TRACKS.find(t => t.id === activeTrack)?.label}</strong>: אלו המומחים ומה הם בודקים
           </ExpertControlText>
           <ExpertToggleGroup>
              <ExpertToggleButton $active={isTop3()} onClick={handleSetTop3}>3 המובילים</ExpertToggleButton>
              <ExpertToggleButton $active={isAll()} onClick={handleSetAll}>כל המומחים</ExpertToggleButton>
           </ExpertToggleGroup>
        </ExpertControlBar>

        <Grid>
          {EXPERTS_BY_TRACK[activeTrack === 'coach' ? coachTrainingTrack : activeTrack].map((expert, i) => {
            const isSelected = selectedExperts.includes(expert.title);
            return (
              <FeatureCard 
                key={i} 
                $selected={isSelected}
                onClick={() => toggleExpert(expert.title)}
              >
                <FeatureTitle $selected={isSelected}>{expert.title}</FeatureTitle>
                <FeatureDesc>{expert.desc}</FeatureDesc>
              </FeatureCard>
            );
          })}
        </Grid>

        <UploadContainer id="upload-section" $hasFile={!!previewUrl}>
          {previewUrl ? (
            <FullSizePreview>
              <RemoveFileBtn onClick={handleRemoveFile}>✕</RemoveFileBtn>
              {file?.type.startsWith('video') ? (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  muted
                  playsInline
                  webkit-playsinline="true"
                  x5-playsinline="true"
                />
              ) : (
                <img src={previewUrl} alt="preview" />
              )}
            </FullSizePreview>
          ) : (
            <UploadContent>
              <UploadIcon><CinematicCameraIcon /></UploadIcon>
              <UploadTitle>
                {isImprovementMode ? 'העלה טייק משופר (ניסיון 2)' : `העלה סרטון ${TRACKS.find(t => t.id === activeTrack)?.label}`}
              </UploadTitle>
              <UploadSubtitle>עד 5 דקות או 20MB</UploadSubtitle>
              
              <UploadButton>
                {isImprovementMode ? 'בחר קובץ לשיפור' : 'העלה סרטון עכשיו'}
                <FileInput 
                  type="file" 
                  accept="video/*,image/*" 
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </UploadButton>
            </UploadContent>
          )}
        </UploadContainer>

        <PdfUploadWrapper>
          {pdfFile ? (
            <PdfFileInfo>
              <PdfIcon />
              <span>{pdfFile.name}</span>
              <RemovePdfBtnSmall onClick={handleRemovePdf} title="הסר קובץ">
                <CloseIcon />
              </RemovePdfBtnSmall>
            </PdfFileInfo>
          ) : (
            <PdfUploadLabel>
              <PdfIcon />
              צרף תסריט / הנחיות (PDF)
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handlePdfSelect} 
                style={{ display: 'none' }} 
                ref={pdfInputRef}
              />
            </PdfUploadLabel>
          )}
        </PdfUploadWrapper>

        <InputWrapper>
          <MainInput 
            placeholder={isImprovementMode ? "מה שינית בטייק הזה? (אופציונלי)" : "כתוב כאן תיאור קצר: מה מטרת הסרטון? מה המסר? (אופציונלי)"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <ActionButton 
            onClick={handleGenerate} 
            disabled={loading || !isReady}
            $isReady={isReady}
            $isLoading={loading}
          >
            {loading ? 'צוות המומחים צופה כעת בסרטון' : (isImprovementMode ? 'נתח שיפורים' : 'אקשן !')}
          </ActionButton>
          {selectedExperts.length < 3 && (
            <ErrorMsg>נא לבחור לפחות 3 מומחים כדי להמשיך</ErrorMsg>
          )}
        </InputWrapper>

        {result && (
          <ResponseArea id="results-area">
            <div id="analysis-content">
              {result.hook && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SectionTitleExternal>
                    <SubtleSparkleIcon /> טיפ זהב של הפאנל <SubtleSparkleIcon />
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <HookText>"{result.hook}"</HookText>
                  </CompactResultBox>
                </div>
              )}

              <SectionLabel style={{ textAlign: 'center', display: 'block', marginTop: '20px' }}>ניתוח פאנל המומחים</SectionLabel>
              
              <ExpertsGrid>
                {result.expertAnalysis?.map((expert, idx) => (
                  <ExpertResultCard key={idx}>
                    <h4>{expert.role} <ExpertScore>{expert.score}</ExpertScore></h4>
                    
                    <ExpertSectionTitle><EyeIcon /> זווית מקצועית</ExpertSectionTitle>
                    <ExpertText>{expert.insight}</ExpertText>
                    
                    <ExpertSectionTitle><BulbIcon /> טיפים לשיפור</ExpertSectionTitle>
                    <ExpertText style={{ color: '#fff', fontWeight: 500 }}>{expert.tips}</ExpertText>
                  </ExpertResultCard>
                )) || <p style={{textAlign: 'center', color: '#666'}}>טוען ניתוח...</p>}
              </ExpertsGrid>

              {result.committee && (
                <CommitteeSection>
                  <SectionTitleExternal>
                     <SubtleDocumentIcon /> סיכום ועדת המומחים
                  </SectionTitleExternal>
                  <CompactResultBox>
                    <CommitteeText>{result.committee.summary}</CommitteeText>
                  </CompactResultBox>
                  
                  {result.committee.finalTips && result.committee.finalTips.length > 0 && (
                    <CommitteeTips>
                      <h5>טיפים מנצחים לעתיד:</h5>
                      <ul>
                        {result.committee.finalTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </CommitteeTips>
                  )}
                  
                  <FinalScore>
                    <span className="number">{averageScore}</span>
                    <span className="label">ציון ויראליות משוקלל</span>
                  </FinalScore>
                </CommitteeSection>
              )}
            </div>

            <ActionButtonsContainer>
              <PrimaryButton onClick={handleExportPdf} disabled={loading || !hasPremiumAccess}>
                <PdfIcon />
                יצוא ניתוח ל-PDF <PremiumBadge>פרימיום</PremiumBadge>
              </PrimaryButton>
              {activeTrack === 'coach' && (
                <PrimaryButton onClick={handleSaveAnalysis} disabled={!result || !selectedTrainee}>
                  💾 שמור ניתוח למתאמן
                </PrimaryButton>
              )}
              <SecondaryButton onClick={handleReset}>
                <RefreshIcon />
                התחל מחדש
              </SecondaryButton>
              <PrimaryButton onClick={handleUploadImprovedTake}>
                <UploadIconSmall />
                העלה טייק משופר
              </PrimaryButton>
            </ActionButtonsContainer>

          </ResponseArea>
        )}
      </AppContainer>
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);