import { useRef, useEffect, useState } from 'react';
import {
  SpectrogramBuffer,
  SpectrogramAverager,
  calculateSpectrogramMetrics,
} from '../utils/audioAnalysis';
import type { SpectrogramAnalysis } from '../utils/audioAnalysis';
import { getMixToneClass } from '../utils/analysisFormatters';
import { SpectrogramMetricCards } from './spectrogram-analyzer/SpectrogramMetricCards';
import { SpectrogramMetricsGrid } from './spectrogram-analyzer/SpectrogramMetricsGrid';
import { SpectrogramStatusFooter } from './spectrogram-analyzer/SpectrogramStatusFooter';
import { drawSpectrogramCanvas } from './spectrogram-analyzer/spectrogramCanvas';

interface SpectrogramAnalyzerProps {
  frequencyData: Float32Array;
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}

const createNeutralSpectrogramAnalysis = (): SpectrogramAnalysis => ({
  brightness: 0,
  dynamicRange: 0,
  activity: 0,
  toneVsNoise: 0,
  highFreqContent: 0,
});

export function SpectrogramAnalyzer({
  frequencyData,
  isActive,
  isPlaying,
  crossfadeVolume = 1,
}: SpectrogramAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramBuffer = useRef<SpectrogramBuffer | null>(null);
  const spectrogramAverager = useRef<SpectrogramAverager | null>(null);

  const [displayData, setDisplayData] = useState<SpectrogramAnalysis>(
    createNeutralSpectrogramAnalysis
  );

  useEffect(() => {
    if (!spectrogramBuffer.current) {
      spectrogramBuffer.current = new SpectrogramBuffer(5000, 100);
    }

    if (!spectrogramAverager.current) {
      spectrogramAverager.current = new SpectrogramAverager(300, 100);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying && spectrogramBuffer.current && spectrogramAverager.current) {
      spectrogramBuffer.current.reset();
      spectrogramAverager.current.reset();
      setDisplayData(createNeutralSpectrogramAnalysis());
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isActive) {
      setDisplayData(createNeutralSpectrogramAnalysis());
      return;
    }

    if (frequencyData && isPlaying && spectrogramBuffer.current && spectrogramAverager.current) {
      const spectrogramAnalysis = calculateSpectrogramMetrics(
        frequencyData,
        spectrogramBuffer.current,
        48000,
        true,
        isPlaying
      );

      const shouldUpdate = spectrogramAverager.current.addSample(spectrogramAnalysis);

      if (shouldUpdate) {
        const smoothed = spectrogramAverager.current.getSmoothedValues();
        setDisplayData(smoothed);
      }
    }
  }, [isActive, isPlaying, frequencyData]);

  useEffect(() => {
    let animationFrameId: number | undefined;

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      const buffer = spectrogramBuffer.current;

      if (!canvas || !buffer) return;

      drawSpectrogramCanvas({
        canvas,
        buffer,
        isActive,
      });
    };

    if (isActive && isPlaying) {
      animationFrameId = requestAnimationFrame(renderCanvas);
    } else {
      renderCanvas();
    }

    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, isPlaying, frequencyData]);

  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  return (
    <div className="h-full flex flex-col">
      <SpectrogramMetricCards displayData={displayData} />

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3 shrink-0">
        <div className="space-y-1.5">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-36 bg-slate-900 rounded-lg border border-slate-700/50"
            />
            {isPlaying && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--theme-deck-a-base)] rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
            <span>5s AGO</span>
            <span>NOW</span>
          </div>
        </div>

        <SpectrogramMetricsGrid displayData={displayData} />
      </div>

      <div className="flex-1" />

      <SpectrogramStatusFooter
        crossfadeVolume={crossfadeVolume}
        isPlaying={isPlaying}
        mixToneClass={mixToneClass}
        transportLabel={transportLabel}
      />
    </div>
  );
}
