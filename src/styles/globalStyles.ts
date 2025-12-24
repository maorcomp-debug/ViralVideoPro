import { createGlobalStyle, keyframes } from 'styled-components';

// --- Global Animations ---
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(212, 160, 67, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0); }
`;

export const glowReady = keyframes`
  0% { box-shadow: 0 0 5px rgba(212, 160, 67, 0.3); border-color: rgba(212, 160, 67, 0.5); }
  50% { box-shadow: 0 0 25px rgba(212, 160, 67, 0.7); border-color: #D4A043; transform: scale(1.02); }
  100% { box-shadow: 0 0 5px rgba(212, 160, 67, 0.3); border-color: rgba(212, 160, 67, 0.5); }
`;

export const breathingHigh = keyframes`
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

// --- Global Styles ---
export const GlobalStyle = createGlobalStyle`
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

