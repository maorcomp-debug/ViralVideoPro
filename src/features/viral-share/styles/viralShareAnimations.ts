import { keyframes } from 'styled-components';

/** Local animations — isolated copy; does not modify global animation systems. */
export const vsFadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const vsShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const vsPulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0.45); }
  70% { box-shadow: 0 0 0 12px rgba(212, 160, 67, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 67, 0); }
`;

export const vsBreathingGlow = keyframes`
  0% {
    box-shadow: 0 4px 20px rgba(212, 160, 67, 0.35);
    transform: translateY(0);
  }
  50% {
    box-shadow: 0 8px 32px rgba(212, 160, 67, 0.55);
    transform: translateY(-2px);
  }
  100% {
    box-shadow: 0 4px 20px rgba(212, 160, 67, 0.35);
    transform: translateY(0);
  }
`;

export const vsScoreGlow = keyframes`
  0%, 100% {
    text-shadow:
      0 0 22px rgba(240, 215, 140, 0.55),
      0 0 48px rgba(212, 160, 67, 0.35);
    color: #f5ecd4;
  }
  50% {
    text-shadow:
      0 0 30px rgba(255, 230, 170, 0.8),
      0 0 60px rgba(212, 160, 67, 0.5);
    color: #fff8e8;
  }
`;
export const VS_COLORS = {
  gold: '#D4A043',
  goldLight: '#e6be74',
  goldDark: '#b8862e',
  bg: '#0a0a0a',
  bgDeep: '#050505',
  text: '#e0e0e0',
  textMuted: '#aaa',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(212, 160, 67, 0.25)',
} as const;
