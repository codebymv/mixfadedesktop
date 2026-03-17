import React from 'react';
import { AudioLevels } from '../../utils/audioAnalysis';
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
    <div className="px-3 py-2">
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
  );
}