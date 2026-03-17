import React, { useRef, useEffect } from 'react';
import { InsightMetricCard } from './analysis/InsightMetricCard';
import { formatFrequency, formatMixPercent, formatPeakBandLabel, formatSignedDb, formatSpectralBalanceLabel, getMixToneClass, getPeakBandToneClass, getSpectralBalanceToneClass } from '../utils/analysisFormatters';

interface FrequencyVisualizerProps {
  frequencyData: Float32Array; // Array of frequency data (e.g., from AnalyserNode)
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}

export function FrequencyVisualizer({ frequencyData, isActive, isPlaying, crossfadeVolume = 1 }: FrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate frequency analysis metrics
  const calculateFrequencyMetrics = () => {
    if (!frequencyData || frequencyData.length === 0 || !isActive || !isPlaying) {
      return {
        bassEnergy: -60,
        midEnergy: -60,
        highEnergy: -60,
        peakFreq: 0,
        peakFreqBand: 'bass' as const,
        spectralBalance: 'SILENT' as const
      };
    }

    const sampleRate = 48000;
    const nyquistFreq = sampleRate / 2;
    const freqResolution = nyquistFreq / frequencyData.length;

    // Use the same approach as the visual spectrum for consistency
    let bassMax = -Infinity, midMax = -Infinity, highMax = -Infinity;
    let bassSum = 0, midSum = 0, highSum = 0;
    let bassCount = 0, midCount = 0, highCount = 0;
    let peakMagnitude = -Infinity;
    let peakFreq = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * freqResolution;
      const magnitudeDb = frequencyData[i]; // Raw dB value from analyser

      // Track peak frequency
      if (magnitudeDb > peakMagnitude) {
        peakMagnitude = magnitudeDb;
        peakFreq = freq;
      }

      // Find maximum values in each band (like the visual does)
      // and also accumulate for averaging
      if (freq >= 20 && freq < 200) { // Bass
        bassMax = Math.max(bassMax, magnitudeDb);
        bassSum += magnitudeDb;
        bassCount++;
      } else if (freq >= 200 && freq < 2000) { // Mid  
        midMax = Math.max(midMax, magnitudeDb);
        midSum += magnitudeDb;
        midCount++;
      } else if (freq >= 2000 && freq <= nyquistFreq) { // High
        highMax = Math.max(highMax, magnitudeDb);
        highSum += magnitudeDb;
        highCount++;
      }
    }

    // Use a blend of maximum and average for more representative values
    const bassEnergy = bassCount > 0 ? Math.max(bassMax, bassSum / bassCount) : -60;
    const midEnergy = midCount > 0 ? Math.max(midMax, midSum / midCount) : -60;
    const highEnergy = highCount > 0 ? Math.max(highMax, highSum / highCount) : -60;

    // Determine which frequency band the peak belongs to
    let peakFreqBand = 'bass';
    if (peakFreq >= 200 && peakFreq < 2000) {
      peakFreqBand = 'mid';
    } else if (peakFreq >= 2000 && peakFreq < 8000) {
      peakFreqBand = 'upperMid';
    } else if (peakFreq >= 8000) {
      peakFreqBand = 'high';
    }

    // Determine spectral balance
    let spectralBalance = 'BALANCED';
    const bassToHigh = bassEnergy - highEnergy;
    if (bassToHigh > 6) spectralBalance = 'BASS-HEAVY';
    else if (bassToHigh < -6) spectralBalance = 'BRIGHT';

    return {
      bassEnergy: Math.max(-60, bassEnergy),
      midEnergy: Math.max(-60, midEnergy), 
      highEnergy: Math.max(-60, highEnergy),
      peakFreq: Math.round(peakFreq),
      peakFreqBand: peakFreqBand as any,
      spectralBalance: spectralBalance as any
    };
  };

  const metrics = calculateFrequencyMetrics();
  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  useEffect(() => {
    let animationFrameId: number;

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match container
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (!isActive || !isPlaying || frequencyData.length === 0) {
        return;
      }

      // Professional audio frequency analysis constants
      const sampleRate = 48000;
      const nyquistFreq = sampleRate / 2;
      const minFreq = 20;
      const maxFreq = 20000;
      
      const freqResolution = nyquistFreq / frequencyData.length;
      const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      
      const freqToLogPosition = (freq: number): number => {
        return Math.log10(Math.max(freq, minFreq) / minFreq) / Math.log10(maxFreq / minFreq);
      };
      
      const numBars = Math.floor(width / 2);
      
      for (let i = 0; i < numBars; i++) {
        const leftPos = i / numBars;
        const rightPos = (i + 1) / numBars;
        
        const leftFreq = minFreq * Math.pow(maxFreq / minFreq, leftPos);
        const rightFreq = minFreq * Math.pow(maxFreq / minFreq, rightPos);
        
        const leftBin = Math.floor(leftFreq / freqResolution);
        const rightBin = Math.floor(rightFreq / freqResolution);
        
        let avgMagnitude = 0;
        let binCount = 0;
        
        for (let bin = leftBin; bin <= Math.min(rightBin, frequencyData.length - 1); bin++) {
          if (bin >= 0 && bin < frequencyData.length) {
            avgMagnitude += frequencyData[bin];
            binCount++;
          }
        }
        
        if (binCount > 0) {
          avgMagnitude /= binCount;
        }
        
        const dbValue = avgMagnitude;
        const normalizedHeight = Math.max(0, Math.min(1, (dbValue + 60) / 60));
        const barHeight = normalizedHeight * height;
        
        let color;
        const centerFreq = Math.sqrt(leftFreq * rightFreq);
        
        if (centerFreq < 200) {
          color = `hsl(0, 100%, ${50 + normalizedHeight * 30}%)`;
        } else if (centerFreq < 2000) {
          const hue = 15 + (Math.log10(centerFreq / 200) / Math.log10(10)) * 45;
          color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
        } else if (centerFreq < 8000) {
          const hue = 60 + (Math.log10(centerFreq / 2000) / Math.log10(4)) * 60;
          color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
        } else {
          const hue = 200 + (Math.log10(centerFreq / 8000) / Math.log10(2.5)) * 80;
          color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
        }
        
        ctx.fillStyle = color;
        
        const barX = i * (width / numBars);
        const barWidth = Math.ceil(width / numBars);
        
        ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      freqMarkers.forEach(freq => {
        if (freq >= minFreq && freq <= maxFreq) {
          const x = freqToLogPosition(freq) * width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      });
    };

    if (isActive && isPlaying) {
        animationFrameId = requestAnimationFrame(renderCanvas);
    } else {
        renderCanvas(); // Render once if not playing (e.g. to clear or draw static state)
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [frequencyData, isActive, isPlaying]);

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
        <InsightMetricCard
          label="Tilt"
          value={formatSpectralBalanceLabel(metrics.spectralBalance)}
          valueClassName={getSpectralBalanceToneClass(metrics.spectralBalance)}
        />
        <InsightMetricCard
          label="Peak Band"
          value={formatPeakBandLabel(metrics.peakFreqBand)}
          valueClassName={getPeakBandToneClass(metrics.peakFreqBand)}
        />
        <InsightMetricCard label="Peak Freq" value={`${formatFrequency(metrics.peakFreq)} Hz`} />
        <InsightMetricCard label="Mix" value={formatMixPercent(crossfadeVolume)} valueClassName={mixToneClass} />
      </div>
      
      {/* Main content area */}
      <div className="shrink-0 mt-3">
        <div className="bg-slate-800 rounded-2xl overflow-hidden h-36">
          <canvas ref={canvasRef} className="bg-slate-900 w-full h-full block"></canvas>
        </div>
      </div>
      
      {/* Anchor spacer */}
      <div className="flex-1" />
      
      {/* Standardized Footer block */}
      <div className="shrink-0 space-y-2">
        <div className="flex justify-between text-[10px] text-audio-text-dim font-mono tabular-nums relative whitespace-nowrap mb-1.5">
          <span>20</span>
          <span>50</span>
          <span>100</span>
          <span>500</span>
          <span>1k</span>
          <span>5k</span>
          <span>10k</span>
          <span className="text-white font-bold">20k</span>
        </div>
        
        <div className="pt-2 border-t border-slate-700/50">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">Low</div>
              <div className="mt-1 font-mono font-bold tabular-nums text-white whitespace-nowrap">{formatSignedDb(metrics.bassEnergy)} dB</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">Mid</div>
              <div className="mt-1 font-mono font-bold tabular-nums text-white whitespace-nowrap">{formatSignedDb(metrics.midEnergy)} dB</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">High</div>
              <div className="mt-1 font-mono font-bold tabular-nums text-white whitespace-nowrap">{formatSignedDb(metrics.highEnergy)} dB</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">State</div>
              <div className={`mt-1 flex items-center gap-1.5 font-mono font-bold tabular-nums whitespace-nowrap ${mixToneClass}`}>
                <div className={`w-2 h-2 rounded-full ${
                  crossfadeVolume === 0 ? 'bg-red-500' :
                  isPlaying ? 'bg-[var(--theme-deck-a-base)] animate-pulse' : 'bg-slate-500'
                }`}></div>
                <span>{transportLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
