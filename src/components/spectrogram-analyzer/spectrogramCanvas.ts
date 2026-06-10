import type { SpectrogramBuffer } from '../../utils/audioAnalysis';

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_DB = -60;
const MAX_DB = 0;
const FREQUENCY_MARKERS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const TIME_INTERVALS_MS = [1000, 2000, 3000, 4000];

interface DrawSpectrogramCanvasParams {
  canvas: HTMLCanvasElement;
  buffer: SpectrogramBuffer;
  isActive: boolean;
}

const frequencyToY = (frequency: number, height: number): number => {
  const logMinFreq = Math.log10(MIN_FREQ);
  const logMaxFreq = Math.log10(MAX_FREQ);
  const logFreqRange = logMaxFreq - logMinFreq;
  const logFreq = Math.log10(Math.max(frequency, MIN_FREQ));
  const normalizedLog = (logFreq - logMinFreq) / logFreqRange;

  return height - (normalizedLog * height);
};

const dbToColor = (db: number): string => {
  const normalized = Math.max(0, Math.min(1, (db - MIN_DB) / (MAX_DB - MIN_DB)));

  if (normalized < 0.25) {
    const t = normalized / 0.25;
    const r = Math.floor(0 * (1 - t) + 0 * t);
    const g = Math.floor(100 * (1 - t) + 150 * t);
    const b = Math.floor(255 * (1 - t) + 255 * t);
    return `rgb(${r},${g},${b})`;
  }

  if (normalized < 0.5) {
    const t = (normalized - 0.25) / 0.25;
    const r = Math.floor(0 * (1 - t) + 0 * t);
    const g = Math.floor(150 * (1 - t) + 255 * t);
    const b = Math.floor(255 * (1 - t) + 0 * t);
    return `rgb(${r},${g},${b})`;
  }

  if (normalized < 0.75) {
    const t = (normalized - 0.5) / 0.25;
    const r = Math.floor(0 * (1 - t) + 255 * t);
    const g = Math.floor(255 * (1 - t) + 255 * t);
    const b = Math.floor(0 * (1 - t) + 0 * t);
    return `rgb(${r},${g},${b})`;
  }

  const t = (normalized - 0.75) / 0.25;
  const r = Math.floor(255 * (1 - t) + 255 * t);
  const g = Math.floor(255 * (1 - t) + 0 * t);
  const b = Math.floor(0 * (1 - t) + 0 * t);

  return `rgb(${r},${g},${b})`;
};

const drawFrequencyGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  FREQUENCY_MARKERS.forEach((frequency) => {
    if (frequency < MIN_FREQ || frequency > MAX_FREQ) return;

    const y = frequencyToY(frequency, height);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillText(frequency >= 1000 ? `${frequency / 1000}k` : `${frequency}`, 2, y - 2);
  });
};

const drawTimeGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeWindowMs: number
) => {
  TIME_INTERVALS_MS.forEach((intervalMs) => {
    const x = (intervalMs / timeWindowMs) * width;
    if (x >= width) return;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(`${intervalMs / 1000}s`, x, height - 5);
  });
};

export const drawSpectrogramCanvas = ({
  canvas,
  buffer,
  isActive,
}: DrawSpectrogramCanvasParams) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  if (!isActive) return;

  const snapshots = buffer.getVisibleSnapshots();
  if (snapshots.length === 0) return;

  const columnWidth = Math.max(1, width / Math.max(snapshots.length, 100));

  snapshots.forEach((snapshot, index) => {
    const x = (index / Math.max(snapshots.length - 1, 1)) * width;
    const freqData = snapshot.frequencyData;
    const nyquist = snapshot.sampleRate / 2;
    const freqResolution = nyquist / freqData.length;

    for (let binIndex = 1; binIndex < freqData.length; binIndex++) {
      const frequency = binIndex * freqResolution;

      if (frequency >= MIN_FREQ && frequency <= MAX_FREQ) {
        const y1 = frequencyToY(frequency, height);
        const y2 = frequencyToY(frequency + freqResolution, height);
        const magnitude = freqData[binIndex];

        ctx.fillStyle = dbToColor(magnitude);
        ctx.fillRect(x, Math.min(y1, y2), columnWidth, Math.abs(y2 - y1) + 1);
      }
    }
  });

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.5;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#64748b';

  drawFrequencyGrid(ctx, width, height);
  drawTimeGrid(ctx, width, height, buffer.getTimeWindowMs());
};
