import React from 'react';
import { FrequencyAnalysis } from '../../utils/audioAnalysis';
import { ComparisonRow } from './ComparisonRow';
import { formatDb, formatFrequency, getDelta, getFrequencyDelta } from '../../utils/analysisFormatters';

interface FrequencyAnalysisSectionProps {
  trackAFrequencyAnalysis?: FrequencyAnalysis;
  trackBFrequencyAnalysis?: FrequencyAnalysis;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
}

export function FrequencyAnalysisSection({
  trackAFrequencyAnalysis,
  trackBFrequencyAnalysis,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false
}: FrequencyAnalysisSectionProps) {
  if (!trackAFrequencyAnalysis && !trackBFrequencyAnalysis) {
    return (
      <div className="px-3 py-2 text-xs text-white/70">
        No frequency data available
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
        <div className="space-y-3">
        {/* Bass Comparison */}
        <ComparisonRow
          label="Bass (20-200 Hz) (dB)"
          valueA={trackAFrequencyAnalysis ? formatDb(trackAFrequencyAnalysis.bassEnergy) : '-∞'}
          valueB={trackBFrequencyAnalysis ? formatDb(trackBFrequencyAnalysis.bassEnergy) : '-∞'}
          deltaText={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.bassEnergy, trackBFrequencyAnalysis.bassEnergy).text : undefined}
          deltaColor={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.bassEnergy, trackBFrequencyAnalysis.bassEnergy).color : undefined}
          showDelta={!!(trackAFrequencyAnalysis && trackBFrequencyAnalysis)}
        />

        {/* Mid Comparison */}
        <ComparisonRow
          label="Mid (200-2k Hz) (dB)"
          valueA={trackAFrequencyAnalysis ? formatDb(trackAFrequencyAnalysis.midEnergy) : '-∞'}
          valueB={trackBFrequencyAnalysis ? formatDb(trackBFrequencyAnalysis.midEnergy) : '-∞'}
          deltaText={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.midEnergy, trackBFrequencyAnalysis.midEnergy).text : undefined}
          deltaColor={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.midEnergy, trackBFrequencyAnalysis.midEnergy).color : undefined}
          showDelta={!!(trackAFrequencyAnalysis && trackBFrequencyAnalysis)}
        />

        {/* High Comparison */}
        <ComparisonRow
          label="High (2k+ Hz) (dB)"
          valueA={trackAFrequencyAnalysis ? formatDb(trackAFrequencyAnalysis.highEnergy) : '-∞'}
          valueB={trackBFrequencyAnalysis ? formatDb(trackBFrequencyAnalysis.highEnergy) : '-∞'}
          deltaText={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.highEnergy, trackBFrequencyAnalysis.highEnergy).text : undefined}
          deltaColor={trackAFrequencyAnalysis && trackBFrequencyAnalysis ? 
            getDelta(trackAFrequencyAnalysis.highEnergy, trackBFrequencyAnalysis.highEnergy).color : undefined}
          showDelta={!!(trackAFrequencyAnalysis && trackBFrequencyAnalysis)}
        />

        {/* Peak Frequency Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Peak Freq (Hz)</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  A
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {trackAFrequencyAnalysis ? 
                    formatFrequency(trackAFrequencyAnalysis.peakFreq) : '--'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-mono">
                  {trackBFrequencyAnalysis ? 
                    formatFrequency(trackBFrequencyAnalysis.peakFreq) : '--'}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  B
                </span>
              </div>
            </div>
            {trackAFrequencyAnalysis && trackBFrequencyAnalysis && (
              <div className="text-center mt-1">
                <span className={`text-xs font-mono ${getFrequencyDelta(
                  trackAFrequencyAnalysis.peakFreq,
                  trackBFrequencyAnalysis.peakFreq
                ).color}`}>
                  Δ {getFrequencyDelta(
                    trackAFrequencyAnalysis.peakFreq,
                    trackBFrequencyAnalysis.peakFreq
                  ).text}
                </span>
              </div>
            )}
          </div>
        </div>
        </div>
    </div>
  );
}