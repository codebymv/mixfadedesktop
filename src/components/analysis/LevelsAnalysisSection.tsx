import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AudioLevels } from '../../utils/audioAnalysis';
import { AnalysisSectionHeader } from './AnalysisSectionHeader';
import { ComparisonRow } from './ComparisonRow';
import { formatDb, linearToDb, getDelta } from '../../utils/analysisFormatters';

interface LevelsAnalysisSectionProps {
  trackAAudioLevels?: AudioLevels;
  trackBAudioLevels?: AudioLevels;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
}

export function LevelsAnalysisSection({
  trackAAudioLevels,
  trackBAudioLevels,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false
}: LevelsAnalysisSectionProps) {
  return (
    <div className="px-3 py-2 bg-slate-800 rounded-md">
      <AnalysisSectionHeader
        icon={TrendingUp}
        title="Levels"
        isTransitioning={isTransitioning}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        gradientId="levelsGradient"
      />
      
      <div className="space-y-3">
        {/* LUFS Comparison */}
        <ComparisonRow
          label="Integrated LUFS"
          valueA={trackAAudioLevels ? formatDb(trackAAudioLevels.lufs) : '-∞'}
          valueB={trackBAudioLevels ? formatDb(trackBAudioLevels.lufs) : '-∞'}
          deltaText={trackAAudioLevels && trackBAudioLevels ? 
            getDelta(trackAAudioLevels.lufs, trackBAudioLevels.lufs).text + ' dB' : undefined}
          deltaColor={trackAAudioLevels && trackBAudioLevels ? 
            getDelta(trackAAudioLevels.lufs, trackBAudioLevels.lufs).color : undefined}
          showDelta={!!(trackAAudioLevels && trackBAudioLevels)}
        />

        {/* RMS Comparison */}
        <ComparisonRow
          label="RMS Levels"
          valueA={trackAAudioLevels ? formatDb(linearToDb(trackAAudioLevels.rms)) : '-∞'}
          valueB={trackBAudioLevels ? formatDb(linearToDb(trackBAudioLevels.rms)) : '-∞'}
          deltaText={trackAAudioLevels && trackBAudioLevels ? 
            getDelta(linearToDb(trackAAudioLevels.rms), linearToDb(trackBAudioLevels.rms)).text + ' dB' : undefined}
          deltaColor={trackAAudioLevels && trackBAudioLevels ? 
            getDelta(linearToDb(trackAAudioLevels.rms), linearToDb(trackBAudioLevels.rms)).color : undefined}
          showDelta={!!(trackAAudioLevels && trackBAudioLevels)}
        />

        {/* Peak Levels */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Peak Levels (L/R)</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  A
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {trackAAudioLevels ? 
                    `${formatDb(linearToDb(trackAAudioLevels.left))} / ${formatDb(linearToDb(trackAAudioLevels.right))}` : '-∞ / -∞'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-mono">
                  {trackBAudioLevels ? 
                    `${formatDb(linearToDb(trackBAudioLevels.left))} / ${formatDb(linearToDb(trackBAudioLevels.right))}` : '-∞ / -∞'}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  B
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}