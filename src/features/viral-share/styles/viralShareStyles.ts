import styled from 'styled-components';
import {
  vsBreathingGlow,
  vsFadeIn,
  vsPulseGlow,
  vsScoreGlow,
  vsShimmer,
  VS_COLORS,
} from './viralShareAnimations';
import { VIRAL_SHARE_Z_INDEX } from '../constants';

/* All viral-share styles live here — fully removable module. */

export const ShareButtonRow = styled.div<{ $inline?: boolean }>`
  width: 100%;
  max-width: ${({ $inline }) => ($inline ? '420px' : '440px')};
  flex: ${({ $inline }) => ($inline ? '1 1 auto' : '0 1 auto')};
  min-width: ${({ $inline }) => ($inline ? '260px' : '0')};
  flex-shrink: 0;
  margin: ${({ $inline }) => ($inline ? '0' : '16px auto 24px')};
  display: flex;
  justify-content: center;
  padding: ${({ $inline }) => ($inline ? '0' : '0 12px')};
  box-sizing: border-box;
`;

export const ShareActionButton = styled.button`
  position: relative;
  width: 100%;
  min-width: 260px;
  max-width: 420px;
  background: linear-gradient(
    125deg,
    #8a6420 0%,
    #c9a04a 18%,
    #f0d78c 42%,
    #e8c66a 58%,
    #c49a3c 78%,
    #9a7028 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.55);
  color: #1a1208;
  padding: 14px 18px;
  border-radius: 18px;
  font-family: 'Assistant', sans-serif;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  direction: inherit;
  overflow: hidden;
  animation: ${vsBreathingGlow} 3.2s ease-in-out infinite;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 8px 28px rgba(212, 160, 67, 0.45),
    0 0 24px rgba(212, 160, 67, 0.25);
  -webkit-tap-highlight-color: transparent;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      115deg,
      transparent 30%,
      rgba(255, 255, 255, 0.35) 48%,
      transparent 62%
    );
    background-size: 200% 100%;
    animation: ${vsShimmer} 5s linear infinite;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 18%;
    width: 48px;
    height: 8px;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.85) 0%, transparent 70%);
    filter: blur(1px);
    pointer-events: none;
    opacity: 0.9;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.18) inset,
      0 12px 36px rgba(212, 160, 67, 0.55),
      0 0 32px rgba(255, 215, 0, 0.3);
  }

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid ${VS_COLORS.gold};
    outline-offset: 3px;
  }
`;

export const ShareButtonText = styled.span`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: start;
  flex: 1;
  min-width: 0;
`;

export const ShareButtonTitle = styled.span`
  font-weight: 800;
  font-size: 1.08rem;
  line-height: 1.25;
  color: #1a1008;
  letter-spacing: 0.01em;
`;

export const ShareButtonSubtitle = styled.span`
  font-weight: 500;
  font-size: 0.82rem;
  line-height: 1.35;
  color: rgba(26, 16, 8, 0.72);
  margin-top: 2px;
`;

export const ShareHexIconWrap = styled.span`
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ShareHexagon = styled.span`
  position: absolute;
  inset: 4px;
  background: linear-gradient(160deg, #2a2420 0%, #12100e 100%);
  clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

export const ShareSparkle = styled.span<{ $top: string; $left: string; $size?: string }>`
  position: absolute;
  top: ${(p) => p.$top};
  left: ${(p) => p.$left};
  width: ${(p) => p.$size || '6px'};
  height: ${(p) => p.$size || '6px'};
  color: rgba(255, 255, 255, 0.95);
  font-size: ${(p) => p.$size || '6px'};
  line-height: 1;
  pointer-events: none;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
`;

export const ShareCrownSvg = styled.svg`
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  fill: ${VS_COLORS.goldLight};
  filter: drop-shadow(0 0 4px rgba(212, 160, 67, 0.6));
`;

/** RN-compatible pattern: fixed overlay in tree, no portal / document.body */
export const ShareModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${(p) => (p.$isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(12px);
  z-index: ${VIRAL_SHARE_Z_INDEX};
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const ShareModalPanel = styled.div`
  background: linear-gradient(160deg, #141414 0%, ${VS_COLORS.bgDeep} 55%, #1a1208 100%);
  border: 1px solid ${VS_COLORS.glassBorder};
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65), 0 0 40px rgba(212, 160, 67, 0.12);
  animation: ${vsFadeIn} 0.35s ease-out;
  position: relative;
`;

export const ShareModalHeader = styled.div`
  padding: 22px 20px 14px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
`;

export const ShareModalTitle = styled.h2`
  color: ${VS_COLORS.gold};
  font-family: 'Frank Ruhl Libre', serif;
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
`;

export const ShareModalSubtitle = styled.p`
  color: ${VS_COLORS.textMuted};
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

export const ShareModalClose = styled.button`
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: ${VS_COLORS.gold};
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(212, 160, 67, 0.15);
  }
`;

export const ShareModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  direction: inherit;
`;

export const ShareModalFooter = styled.div`
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  direction: inherit;
`;

export const SharePrimaryBtn = styled.button`
  flex: 1;
  background: linear-gradient(135deg, ${VS_COLORS.goldDark}, ${VS_COLORS.goldLight});
  border: none;
  color: #000;
  padding: 12px 16px;
  border-radius: 12px;
  font-family: 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-1px);
  }
`;

export const ShareSecondaryBtn = styled.button`
  flex: 0 0 auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${VS_COLORS.text};
  padding: 12px 18px;
  border-radius: 12px;
  font-family: 'Assistant', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;

  &:hover {
    border-color: ${VS_COLORS.gold};
    color: ${VS_COLORS.gold};
  }
`;

export const ConsentBox = styled.div`
  background: ${VS_COLORS.glass};
  border: 1px solid ${VS_COLORS.glassBorder};
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
`;

export const ConsentText = styled.p`
  color: ${VS_COLORS.text};
  font-size: 0.92rem;
  line-height: 1.65;
  margin: 0 0 14px;
`;

export const ConsentLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  color: ${VS_COLORS.text};
  font-size: 0.95rem;
  line-height: 1.5;

  input {
    margin-top: 4px;
    accent-color: ${VS_COLORS.gold};
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  color: ${VS_COLORS.text};
  font-size: 0.95rem;

  input {
    accent-color: ${VS_COLORS.gold};
    width: 18px;
    height: 18px;
  }
`;

export const FieldLabel = styled.div`
  color: ${VS_COLORS.gold};
  font-size: 0.85rem;
  font-weight: 600;
  margin: 12px 0 8px;
`;

export const TypeChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const TypeChip = styled.button<{ $active: boolean }>`
  background: ${(p) => (p.$active ? 'rgba(212, 160, 67, 0.2)' : 'rgba(255,255,255,0.04)')};
  border: 1px solid ${(p) => (p.$active ? VS_COLORS.gold : 'rgba(255,255,255,0.12)')};
  color: ${(p) => (p.$active ? VS_COLORS.gold : VS_COLORS.textMuted)};
  padding: 8px 12px;
  border-radius: 20px;
  font-family: 'Assistant', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${VS_COLORS.gold};
    color: ${VS_COLORS.gold};
  }
`;

export const PreviewCard = styled.div`
  background: linear-gradient(145deg, rgba(212, 160, 67, 0.12) 0%, rgba(10, 10, 10, 0.95) 40%, #0a0a0a 100%);
  border: 1px solid rgba(212, 160, 67, 0.35);
  border-radius: 18px;
  padding: 24px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: ${vsFadeIn} 0.4s ease-out;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, ${VS_COLORS.gold}, transparent);
    background-size: 200% 100%;
    animation: ${vsShimmer} 4s linear infinite;
  }
`;

export const PreviewLogo = styled.img`
  height: 36px;
  width: auto;
  margin-bottom: 16px;
  opacity: 0.95;
`;

export const PreviewCreatorName = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

export const PreviewCreatorType = styled.div`
  color: ${VS_COLORS.gold};
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
`;

export const PreviewScore = styled.div`
  font-size: 3.75rem;
  font-weight: 800;
  line-height: 1;
  animation: ${vsScoreGlow} 3s ease-in-out infinite;
`;

export const PreviewScoreLabel = styled.div`
  color: ${VS_COLORS.gold};
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 8px;
  margin-bottom: 12px;
`;

export const PreviewScoreRule = styled.div`
  position: relative;
  width: min(100%, 240px);
  height: 2px;
  margin: 0 auto 18px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(212, 160, 67, 0.2) 25%,
    rgba(255, 230, 160, 0.85) 50%,
    rgba(212, 160, 67, 0.2) 75%,
    transparent
  );
  box-shadow: 0 0 10px rgba(212, 160, 67, 0.4);

  &::after {
    content: '✦';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ffe9a8;
    font-size: 0.7rem;
    text-shadow: 0 0 8px rgba(255, 230, 160, 0.9);
  }
`;

export const PreviewMetrics = styled.ul`
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  text-align: start;
`;

export const PreviewMetricItem = styled.li`
  color: ${VS_COLORS.text};
  font-size: 0.88rem;
  line-height: 1.45;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '✦';
    color: ${VS_COLORS.gold};
    margin-inline-end: 8px;
    font-size: 0.7rem;
  }
`;

export const PreviewInsight = styled.blockquote`
  margin: 0 0 18px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  border-inline-end: 3px solid ${VS_COLORS.gold};
  color: #f0f0f0;
  font-size: 0.92rem;
  font-style: italic;
  line-height: 1.55;
  text-align: start;
`;

export const PreviewCta = styled.a<{ $decorative?: boolean }>`
  display: inline-block;
  margin-top: 4px;
  padding: 10px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, ${VS_COLORS.goldDark}, ${VS_COLORS.gold});
  color: #000;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: ${({ $decorative }) => ($decorative ? 'default' : 'pointer')};
  pointer-events: ${({ $decorative }) => ($decorative ? 'none' : 'auto')};
  user-select: none;

  &:hover {
    transform: ${({ $decorative }) => ($decorative ? 'none' : 'translateY(-1px)')};
    box-shadow: ${({ $decorative }) =>
      $decorative ? 'none' : '0 4px 16px rgba(212, 160, 67, 0.35)'};
  }
`;

export const MockShareRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
`;

export const MockShareBtn = styled.button`
  flex: 1 1 calc(33% - 10px);
  min-width: 88px;
  max-width: 140px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 160, 67, 0.3);
  color: ${VS_COLORS.text};
  padding: 12px 10px;
  border-radius: 12px;
  font-family: 'Assistant', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(212, 160, 67, 0.12);
    border-color: ${VS_COLORS.gold};
    color: ${VS_COLORS.gold};
  }
`;

export const SectionHeading = styled.h3`
  color: ${VS_COLORS.gold};
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 12px;
  text-align: start;
`;

export const ShareLinkBox = styled.div`
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid ${VS_COLORS.glassBorder};
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  word-break: break-all;
`;

export const ShareLinkText = styled.div`
  color: ${VS_COLORS.goldLight};
  font-size: 0.78rem;
  line-height: 1.45;
  text-align: left;
`;

export const PublicPageWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(160deg, ${VS_COLORS.bgDeep} 0%, #1a1208 100%);
  direction: inherit;
`;

export const PublicUnavailable = styled.p`
  color: ${VS_COLORS.gold};
  font-size: 1.1rem;
  text-align: center;
  line-height: 1.6;
`;
