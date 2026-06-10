import type { VectorscopeSample } from './stereoAnalyzerTypes';

const getCorrelationColor = (correlation: number) => {
  if (correlation > 0.7) return '#22c55e';
  if (correlation > 0.3) return '#eab308';
  return '#ef4444';
};

export const drawVectorscope = ({
  canvas,
  isActive,
  isPlaying,
  samples,
  phaseCorrelation,
}: {
  canvas: HTMLCanvasElement;
  isActive: boolean;
  isPlaying: boolean;
  samples: VectorscopeSample[];
  phaseCorrelation: number;
}) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.85;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  if (!isActive) return;

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
  ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
  ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
  ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.3;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius * i) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.font = '10px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('R+', centerX, 12);
  ctx.fillText('R-', centerX, height - 3);
  ctx.textAlign = 'left';
  ctx.fillText('L-', 3, centerY - 3);
  ctx.textAlign = 'right';
  ctx.fillText('L+', width - 3, centerY - 3);

  if (!isPlaying || samples.length === 0) return;

  samples.forEach((sample) => {
    const x = centerX + (sample.x * radius * 0.8);
    const y = centerY - (sample.y * radius * 0.8);
    const maxAge = 60;
    const ageAlpha = Math.max(0, 1 - (sample.age / maxAge));
    const pointSize = 1 + (ageAlpha * 1.5);
    const baseColor = getCorrelationColor(phaseCorrelation);

    ctx.fillStyle = `${baseColor}${Math.floor(ageAlpha * 255).toString(16).padStart(2, '0')}`;
    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    ctx.fill();
  });

  if (Math.abs(phaseCorrelation) > 0.01) {
    ctx.strokeStyle = getCorrelationColor(phaseCorrelation);
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;

    const vectorLength = radius * 0.6 * Math.abs(phaseCorrelation);
    const vectorAngle = phaseCorrelation > 0 ? Math.PI / 4 : -Math.PI / 4;
    const vectorX = centerX + Math.cos(vectorAngle) * vectorLength;
    const vectorY = centerY - Math.sin(vectorAngle) * vectorLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(vectorX, vectorY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
};

