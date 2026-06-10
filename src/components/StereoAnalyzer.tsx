import { useRef, useEffect, useState } from 'react';
import { StereoAnalysis, StereoAverager } from '../utils/audioAnalysis';
import {
  formatBalanceLabel,
  formatMonoCompatibilityLabel,
  formatSignedCorrelation,
  formatStereoWidth,
  getLRBalanceColor,
  getMixToneClass,
  getMonoCompatibilityToneClass,
  getStereoCorrelationColor,
  getStereoWidthColor,
} from '../utils/analysisFormatters';
import { InsightMetricCard } from './analysis/InsightMetricCard';
import { StereoMetricsGrid } from './stereo-analyzer/StereoMetricsGrid';
import { StereoStatusFooter } from './stereo-analyzer/StereoStatusFooter';
import { createVectorscopeSamples, mergeVectorscopeSamples } from './stereo-analyzer/stereoSamples';
import type { VectorscopeSample } from './stereo-analyzer/stereoAnalyzerTypes';
import { drawVectorscope } from './stereo-analyzer/vectorscopeCanvas';

interface StereoAnalyzerProps {
  stereoData: StereoAnalysis;
  leftSamples?: Float32Array;
  rightSamples?: Float32Array;
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}
const MAX_VECTORSCOPE_SAMPLES = 200;

const NEUTRAL_STEREO_DATA: StereoAnalysis = {
  phaseCorrelation: 0,
  stereoWidth: 0,
  balance: 0,
  midLevel: 0,
  sideLevel: 0,
  midLufs: -70,
  sideLufs: -70,
  monoCompatibility: 'EXCELLENT',
};

export function StereoAnalyzer({
  stereoData,
  leftSamples,
  rightSamples,
  isActive,
  isPlaying,
  crossfadeVolume = 1
}: StereoAnalyzerProps) {
  const vectorscopeRef = useRef<HTMLCanvasElement>(null);
  const samplesBuffer = useRef<VectorscopeSample[]>([]);
  const stereoAverager = useRef<StereoAverager | null>(null);
  const [instantData, setInstantData] = useState<StereoAnalysis>(NEUTRAL_STEREO_DATA);
  const [displayData, setDisplayData] = useState<StereoAnalysis>(NEUTRAL_STEREO_DATA);

  useEffect(() => {
    if (!stereoAverager.current) {
      stereoAverager.current = new StereoAverager(300, 50);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying && stereoAverager.current) {
      stereoAverager.current.reset();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isActive) {
      setInstantData(NEUTRAL_STEREO_DATA);
      setDisplayData(NEUTRAL_STEREO_DATA);
      return;
    }

    if (stereoData && isPlaying) {
      setInstantData(stereoData);

      if (stereoAverager.current) {
        const shouldUpdate = stereoAverager.current.addSample(stereoData);

        if (shouldUpdate) {
          setDisplayData(stereoAverager.current.getSmoothedValues());
        }
      }
    } else {
      setInstantData(NEUTRAL_STEREO_DATA);
      setDisplayData(NEUTRAL_STEREO_DATA);
      samplesBuffer.current = [];
    }
  }, [isActive, isPlaying, stereoData]);

  useEffect(() => {
    if (isActive && isPlaying && leftSamples && rightSamples) {
      samplesBuffer.current = mergeVectorscopeSamples(
        createVectorscopeSamples(leftSamples, rightSamples),
        samplesBuffer.current,
        MAX_VECTORSCOPE_SAMPLES
      );
    }
  }, [isActive, isPlaying, leftSamples, rightSamples]);

  useEffect(() => {
    const canvas = vectorscopeRef.current;
    if (!canvas) return;

    drawVectorscope({
      canvas,
      isActive,
      isPlaying,
      samples: samplesBuffer.current,
      phaseCorrelation: instantData.phaseCorrelation,
    });
  }, [isActive, isPlaying, instantData.phaseCorrelation, samplesBuffer.current.length]);

  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
        <InsightMetricCard
          label="Mono"
          value={formatMonoCompatibilityLabel(displayData.monoCompatibility)}
          valueClassName={getMonoCompatibilityToneClass(displayData.monoCompatibility)}
        />
        <InsightMetricCard
          label="Phase"
          value={formatSignedCorrelation(displayData.phaseCorrelation)}
          valueClassName={getStereoCorrelationColor(displayData.phaseCorrelation)}
        />
        <InsightMetricCard
          label="Width"
          value={formatStereoWidth(displayData.stereoWidth)}
          valueClassName={getStereoWidthColor(displayData.stereoWidth)}
        />
        <InsightMetricCard
          label="Balance"
          value={formatBalanceLabel(displayData.balance)}
          valueClassName={getLRBalanceColor(displayData.balance)}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3 shrink-0">
        <div className="space-y-1.5">
          <div className="relative">
            <canvas
              ref={vectorscopeRef}
              className="w-full h-36 bg-slate-900 rounded-lg border border-slate-700/50"
            />
            {isPlaying && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--theme-deck-a-base)] rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>MONO</span>
            <span>STEREO</span>
            <span>PHASE</span>
          </div>
        </div>

        <StereoMetricsGrid displayData={displayData} />
      </div>

      <div className="flex-1" />

      <StereoStatusFooter
        crossfadeVolume={crossfadeVolume}
        isPlaying={isPlaying}
        mixToneClass={mixToneClass}
        transportLabel={transportLabel}
      />
    </div>
  );
}
