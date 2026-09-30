import { formatPrice } from './utils';

export interface CredentialData {
  blockId: string;
  hash: string;
  key: string;
  price: number;
}

const ACCENT = '#10b981';
const TEXT_PRIMARY = '#f9fafb';
const TEXT_SECONDARY = '#9ca3af';
const TEXT_MUTED = '#6b7280';

function getCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface Theme {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  divider: string;
}

const darkTheme: Theme = {
  bg: '#0a0a0a',
  cardBg: '#111827',
  cardBorder: '#1f2937',
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  accent: ACCENT,
  divider: '#1f2937',
};

const lightTheme: Theme = {
  bg: '#ffffff',
  cardBg: '#f9fafb',
  cardBorder: '#d1d5db',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  accent: '#065f46',
  divider: '#e5e7eb',
};

function drawBlockCard(ctx: CanvasRenderingContext2D, cred: CredentialData, x: number, y: number, w: number, h: number, theme: Theme) {
  drawRoundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  const badgeSize = 28;
  drawRoundedRect(ctx, x + 20, y + 20, badgeSize, badgeSize, 8);
  const grad = ctx.createLinearGradient(x + 20, y + 20, x + 20 + badgeSize, y + 20 + badgeSize);
  grad.addColorStop(0, '#34d399');
  grad.addColorStop(1, '#22c55e');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${cred.blockId}`, x + 20 + badgeSize / 2, y + 20 + badgeSize / 2);

  ctx.fillStyle = theme.textPrimary;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Block #${cred.blockId}`, x + 58, y + 22);

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatPrice(cred.price), x + w - 20, y + 22);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BLOCK HASH', x + 20, y + 60);
  ctx.fillStyle = theme.textSecondary;
  ctx.font = '11px "Courier New", monospace';
  const hashDisplay = cred.hash.length > 32 ? `${cred.hash.slice(0, 16)}...${cred.hash.slice(-8)}` : cred.hash;
  ctx.fillText(hashDisplay, x + 20, y + 74);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '9px sans-serif';
  ctx.fillText('ACCESS KEY', x + 20, y + 100);
  ctx.fillStyle = theme.textSecondary;
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(cred.key, x + 20, y + 114);

  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + h - 30);
  ctx.lineTo(x + w - 20, y + h - 30);
  ctx.stroke();

  ctx.fillStyle = theme.textMuted;
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('XCITYDAO • Block Ownership Certificate', x + 20, y + h - 18);
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toISOString().slice(0, 10), x + w - 20, y + h - 18);
}

function renderCredentialsCanvas(credentials: CredentialData[], theme: Theme): HTMLCanvasElement {
  const cardW = 400;
  const cardH = 150;
  const gap = 16;
  const padding = 40;
  const headerH = 80;
  const footerH = 40;
  const totalH = headerH + credentials.length * (cardH + gap) - gap + footerH + padding * 2;
  const w = cardW + padding * 2;

  const canvas = getCanvas(w, totalH);
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, totalH);

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('XCITYDAO', padding, padding);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = '12px sans-serif';
  ctx.fillText(`Block Ownership Certificates • ${credentials.length} block${credentials.length !== 1 ? 's' : ''}`, padding, padding + 28);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleString(), w - padding, padding + 4);

  credentials.forEach((cred, i) => {
    drawBlockCard(ctx, cred, padding, headerH + padding + i * (cardH + gap), cardW, cardH, theme);
  });

  ctx.fillStyle = theme.textMuted;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by XCITYDAO • These credentials serve as proof of block ownership', w / 2, totalH - padding);

  return canvas;
}

export function downloadCredentialsImage(credentials: CredentialData[]) {
  const canvas = renderCredentialsCanvas(credentials, darkTheme);
  const link = document.createElement('a');
  link.download = `xcitydao-credentials-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadCredentialsPDF(credentials: CredentialData[]) {
  const canvas = renderCredentialsCanvas(credentials, lightTheme);
  const imgDataUrl = canvas.toDataURL('image/png');
  const w = canvas.width;
  const h = canvas.height;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>XCITYDAO Block Certificates</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
  img { max-width: 100%; height: auto; }
  @media print {
    body { background: #fff; }
    @page { margin: 0.5in; }
  }
</style>
</head>
<body>
<img src="${imgDataUrl}" alt="XCITYDAO Block Certificates" />
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</body>
</html>`);
  win.document.close();
}
