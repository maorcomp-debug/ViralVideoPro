import type { ShareStrings } from '../i18n';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
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
}

export async function renderShareCardImage(input: RenderShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const pad = 72;
  const innerW = STORY_WIDTH - pad * 2;

  const bg = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
  bg.addColorStop(0, '#141414');
  bg.addColorStop(0.45, '#0a0a0a');
  bg.addColorStop(1, '#1a1208');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.strokeStyle = 'rgba(212, 160, 67, 0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, pad - 12, 180, innerW + 24, STORY_HEIGHT - 360, 36);
  ctx.stroke();

  ctx.fillStyle = 'rgba(212, 160, 67, 0.08)';
  roundRect(ctx, pad, 200, innerW, STORY_HEIGHT - 400, 28);
  ctx.fill();

  try {
    const logo = await loadImage('/Logo.png');
    const logoW = 220;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, (STORY_WIDTH - logoW) / 2, 240, logoW, logoH);
  } catch {
    ctx.fillStyle = '#D4A043';
    ctx.font = 'bold 56px Assistant, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIRALY', STORY_WIDTH / 2, 320);
  }

  let y = 520;
  ctx.direction = input.rtl ? 'rtl' : 'ltr';
  const align = input.rtl ? 'right' : 'left';
  const textX = input.rtl ? STORY_WIDTH - pad : pad;

  if (input.showCreatorName && input.creatorName?.trim()) {
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '600 44px Assistant, Arial, sans-serif';
    ctx.textAlign = align;
    ctx.fillText(input.creatorName.trim(), textX, y);
    y += 56;
  }
  if (input.showCreatorType && input.creatorTypeLabel) {
    ctx.fillStyle = '#D4A043';
    ctx.font = '500 34px Assistant, Arial, sans-serif';
    ctx.textAlign = align;
    ctx.fillText(input.creatorTypeLabel, textX, y);
    y += 48;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#D4A043';
  ctx.font = 'bold 160px Assistant, Arial, sans-serif';
  ctx.fillText(`${input.viralScore}%`, STORY_WIDTH / 2, y + 120);

  ctx.fillStyle = '#cccccc';
  ctx.font = '500 38px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.viralScoreLabel, STORY_WIDTH / 2, y + 175);
  y += 240;

  ctx.textAlign = align;
  ctx.fillStyle = '#D4A043';
  ctx.font = 'bold 36px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.metricsTitle, textX, y);
  y += 52;

  ctx.fillStyle = '#e8e8e8';
  ctx.font = '400 32px Assistant, Arial, sans-serif';
  for (const metric of input.metrics.slice(0, 3)) {
    const lines = wrapLines(ctx, `• ${metric}`, innerW - 20, 2);
    for (const line of lines) {
      ctx.fillText(line, textX, y);
      y += 42;
    }
    y += 8;
  }

  y += 16;
  ctx.fillStyle = '#D4A043';
  ctx.font = 'bold 34px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.insightTitle, textX, y);
  y += 48;

  ctx.fillStyle = '#d0d0d0';
  ctx.font = 'italic 30px Assistant, Arial, sans-serif';
  const insightLines = wrapLines(ctx, `"${input.insight}"`, innerW - 20, 5);
  for (const line of insightLines) {
    ctx.fillText(line, textX, y);
    y += 40;
  }

  ctx.textAlign = 'center';
  const ctaY = STORY_HEIGHT - 200;
  roundRect(ctx, pad + 40, ctaY, innerW - 80, 88, 44);
  const ctaGrad = ctx.createLinearGradient(pad, ctaY, pad + innerW, ctaY + 88);
  ctaGrad.addColorStop(0, '#c49a3c');
  ctaGrad.addColorStop(0.5, '#f0d78c');
  ctaGrad.addColorStop(1, '#9a7028');
  ctx.fillStyle = ctaGrad;
  ctx.fill();
  ctx.fillStyle = '#1a1208';
  ctx.font = 'bold 34px Assistant, Arial, sans-serif';
  ctx.fillText(input.strings.cta, STORY_WIDTH / 2, ctaY + 56);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export share card'))),
      'image/png',
      0.92
    );
  });
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
