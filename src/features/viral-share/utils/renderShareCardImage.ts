import type { ShareStrings } from '../i18n';
import { SHARE_CTA_URL } from '../constants';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

const GOLD = '#D4A043';
const GOLD_LIGHT = '#e6be74';
const TEXT = '#e8e8e8';
const TEXT_MUTED = '#a8a8a8';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function ensureFonts(): Promise<void> {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('400 30px Assistant'),
      document.fonts.load('600 34px Assistant'),
      document.fonts.load('700 40px Assistant'),
      document.fonts.load('800 140px Assistant'),
    ]);
  } catch {
    /* fallback to system fonts */
  }
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = `${last.replace(/\.{3}$/, '')}…`;
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGoldTopRule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.25, 'rgba(212,160,67,0.25)');
  grad.addColorStop(0.5, 'rgba(255,230,160,0.9)');
  grad.addColorStop(0.75, 'rgba(212,160,67,0.25)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = '28px Assistant, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦', x + w / 2, y + 22);
}

function drawScoreDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number): void {
  const half = w / 2;
  const grad = ctx.createLinearGradient(cx - half, y, cx + half, y);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.25, 'rgba(212,160,67,0.2)');
  grad.addColorStop(0.5, 'rgba(255,230,160,0.85)');
  grad.addColorStop(0.75, 'rgba(212,160,67,0.2)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - half, y, w, 3);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '24px Assistant, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,230,160,0.9)';
  ctx.shadowBlur = 12;
  ctx.fillText('✦', cx, y + 10);
  ctx.shadowBlur = 0;
}

export interface RenderShareCardInput {
  viralScore: number;
  metrics: string[];
  insight: string;
  creatorName?: string;
  creatorTypeLabel?: string;
  showCreatorName: boolean;
  showCreatorType: boolean;
  strings: ShareStrings;
  rtl: boolean;
  siteUrl?: string;
}

export async function renderShareCardImage(input: RenderShareCardInput): Promise<Blob> {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const siteUrl = (input.siteUrl || SHARE_CTA_URL).replace(/\/$/, '');
  const siteLabel = siteUrl.replace(/^https?:\/\//, '');

  const cardPad = 56;
  const cardX = cardPad;
  const cardW = STORY_WIDTH - cardPad * 2;
  const cardY = 120;
  const cardH = STORY_HEIGHT - 240;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, 'rgba(212,160,67,0.14)');
  cardGrad.addColorStop(0.35, 'rgba(10,10,10,0.97)');
  cardGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = cardGrad;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  ctx.strokeStyle = 'rgba(212,160,67,0.38)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.stroke();

  drawGoldTopRule(ctx, cardX + 40, cardY + 8, cardW - 80);

  const cx = STORY_WIDTH / 2;
  const contentW = cardW - 80;
  const contentLeft = cardX + 40;
  let y = cardY + 72;

  try {
    const logo = await loadImage('/Logo.png');
    const logoH = 72;
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, cx - logoW / 2, y, logoW, logoH);
    y += logoH + 28;
  } catch {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 48px Assistant, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIRALY', cx, y + 40);
    y += 64;
  }

  ctx.textAlign = 'center';
  ctx.direction = 'ltr';

  if (input.showCreatorName && input.creatorName?.trim()) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 40px Assistant, Arial, sans-serif';
    ctx.fillText(input.creatorName.trim(), cx, y);
    y += 48;
  }

  if (input.showCreatorType && input.creatorTypeLabel) {
    ctx.fillStyle = GOLD;
    ctx.font = '600 30px Assistant, Arial, sans-serif';
    ctx.fillText(input.creatorTypeLabel, cx, y);
    y += 44;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 140px Assistant, Arial, sans-serif';
  ctx.shadowColor = 'rgba(212,160,67,0.55)';
  ctx.shadowBlur = 28;
  ctx.fillText(`${input.viralScore}%`, cx, y + 100);
  ctx.shadowBlur = 0;

  ctx.fillStyle = GOLD;
  ctx.font = '600 34px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.viralScoreLabel, cx, y + 148);
  y += 168;

  drawScoreDivider(ctx, cx, y, Math.min(420, contentW - 40));
  y += 36;

  ctx.fillStyle = GOLD;
  ctx.font = '700 34px Assistant, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(input.strings.metricsTitle, cx, y);
  y += 40;

  const metricsBoxX = contentLeft;
  const metricsBoxW = contentW;
  const metricFont = '500 32px Assistant, Arial, sans-serif';
  ctx.font = metricFont;

  for (let i = 0; i < input.metrics.slice(0, 3).length; i++) {
    const metric = input.metrics[i];
    const itemY = y;
    const lines = wrapLines(ctx, metric, metricsBoxW - 72, 3);
    const blockH = lines.length * 40 + 24;

    roundRect(ctx, metricsBoxX, itemY, metricsBoxW, blockH, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,160,67,0.18)';
    ctx.lineWidth = 1;
    roundRect(ctx, metricsBoxX, itemY, metricsBoxW, blockH, 14);
    ctx.stroke();

    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = '600 26px Assistant, Arial, sans-serif';
    const starX = input.rtl ? metricsBoxX + metricsBoxW - 28 : metricsBoxX + 28;
    ctx.textAlign = 'center';
    ctx.fillText('✦', starX, itemY + 36);

    ctx.fillStyle = TEXT;
    ctx.font = metricFont;
    ctx.textAlign = input.rtl ? 'right' : 'left';
    const textX = input.rtl ? metricsBoxX + metricsBoxW - 48 : metricsBoxX + 48;
    let lineY = itemY + 36;
    for (const line of lines) {
      ctx.fillText(line, textX, lineY);
      lineY += 40;
    }

    y += blockH + 14;
  }

  y += 12;
  ctx.textAlign = 'center';
  ctx.direction = 'ltr';
  ctx.fillStyle = GOLD;
  ctx.font = '700 30px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.insightTitle, cx, y);
  y += 36;

  const insightPad = 28;
  ctx.font = 'italic 28px Assistant, Arial, sans-serif';
  const insightLines = wrapLines(ctx, `"${input.insight}"`, contentW - insightPad * 2 - 20, 5);
  const insightH = insightLines.length * 38 + insightPad * 2;
  roundRect(ctx, contentLeft, y, contentW, insightH, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  const borderSide = input.rtl ? 'right' : 'left';
  ctx.fillStyle = GOLD;
  if (borderSide === 'left') {
    ctx.fillRect(contentLeft, y + 12, 4, insightH - 24);
  } else {
    ctx.fillRect(contentLeft + contentW - 4, y + 12, 4, insightH - 24);
  }

  ctx.fillStyle = '#d8d8d8';
  ctx.textAlign = input.rtl ? 'right' : 'left';
  let iy = y + insightPad + 26;
  const ix = input.rtl ? contentLeft + contentW - insightPad : contentLeft + insightPad + 12;
  for (const line of insightLines) {
    ctx.fillText(line, ix, iy);
    iy += 38;
  }
  y += insightH + 28;

  const ctaH = 80;
  const ctaW = contentW - 48;
  const ctaX = contentLeft + 24;
  roundRect(ctx, ctaX, y, ctaW, ctaH, 40);
  const ctaGrad = ctx.createLinearGradient(ctaX, y, ctaX + ctaW, y + ctaH);
  ctaGrad.addColorStop(0, '#9a7028');
  ctaGrad.addColorStop(0.45, '#f0d78c');
  ctaGrad.addColorStop(1, '#c49a3c');
  ctx.fillStyle = ctaGrad;
  ctx.fill();
  ctx.fillStyle = '#1a1208';
  ctx.font = '700 32px Assistant, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.direction = 'ltr';
  ctx.fillText(input.strings.cta, cx, y + 52);
  y += ctaH + 22;

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = '600 28px Assistant, Arial, sans-serif';
  ctx.fillText(siteLabel, cx, y);
  y += 32;
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '400 22px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.storyTapLinkHint, cx, y);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export share card'))),
      'image/png',
      0.95
    );
  });
}
