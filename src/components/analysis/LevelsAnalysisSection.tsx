import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AudioLevels } from '../../utils/audioAnalysis';
import { AnalysisSectionHeader } from './AnalysisSectionHeader';
import { ComparisonRow } from './ComparisonRow';
import { DualComparisonRow } from './DualComparisonRow';
import { formatDb, linearToDb, getDelta } from '../../utils/analysisFormatters';

interface LevelsAnalysisSectionProps {
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
}

export function LevelsAnalysisSection({
  trackADeckLevels,
  trackBDeckLevels,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false
}: LevelsAnalysisSectionProps) {
  return (
    <div className="bg-slate-800 rounded-md overflow-hidden flex">
      <AnalysisSectionHeader
        icon={TrendingUp}
        title="Levels"
        isTransitioning={isTransitioning}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        gradientId="levelsGradient"
      />

      <div className="flex-1 px-3 py-2 min-w-0">
        <div className="space-y-3">
        {/* LUFS Comparison */}
        <ComparisonRow
          label="Integrated LUFS (dB)"
          valueA={trackADeckLevels ? formatDb(trackADeckLevels.lufs) : '-∞'}
          valueB={trackBDeckLevels ? formatDb(trackBDeckLevels.lufs) : '-∞'}
          deltaText={trackADeckLevels && trackBDeckLevels ? 
            getDelta(trackADeckLevels.lufs, trackBDeckLevels.lufs).text : undefined}
          deltaColor={trackADeckLevels && trackBDeckLevels ? 
            getDelta(trackADeckLevels.lufs, trackBDeckLevels.lufs).color : undefined}
          showDelta={!!(trackADeckLevels && trackBDeckLevels)}
        />

        {/* RMS Comparison */}
        <ComparisonRow
          label="RMS Levels (dB)"
          valueA={trackADeckLevels ? formatDb(linearToDb(trackADeckLevels.rms)) : '-∞'}
          valueB={trackBDeckLevels ? formatDb(linearToDb(trackBDeckLevels.rms)) : '-∞'}
          deltaText={trackADeckLevels && trackBDeckLevels ? 
            getDelta(linearToDb(trackADeckLevels.rms), linearToDb(trackBDeckLevels.rms)).text : undefined}
          deltaColor={trackADeckLevels && trackBDeckLevels ? 
            getDelta(linearToDb(trackADeckLevels.rms), linearToDb(trackBDeckLevels.rms)).color : undefined}
          showDelta={!!(trackADeckLevels && trackBDeckLevels)}
        />

        {/* Peak Levels */}
        <DualComparisonRow
          label="Peaks (L/R) (dB)"
          valueA1={trackADeckLevels ? formatDb(linearToDb(trackADeckLevels.left)) : '-∞'}
          valueA2={trackADeckLevels ? formatDb(linearToDb(trackADeckLevels.right)) : '-∞'}
          valueB1={trackBDeckLevels ? formatDb(linearToDb(trackBDeckLevels.left)) : '-∞'}
          valueB2={trackBDeckLevels ? formatDb(linearToDb(trackBDeckLevels.right)) : '-∞'}
        />
        </div>
      </div>
    </div>
  );
}