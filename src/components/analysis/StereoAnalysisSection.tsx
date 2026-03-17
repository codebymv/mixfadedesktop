import React from 'react';
import { StereoAnalysis } from '../../utils/audioAnalysis';
import { ComparisonRow } from './ComparisonRow';
import { DualComparisonRow } from './DualComparisonRow';
import { formatCorrelation, formatStereoWidth, formatDb, linearToDb, getDelta, getStereoPercent, getLevelColor } from '../../utils/analysisFormatters';

interface StereoAnalysisSectionProps {
  trackAStereoAnalysis?: StereoAnalysis;
  trackBStereoAnalysis?: StereoAnalysis;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
}

export function StereoAnalysisSection({
  trackAStereoAnalysis,
  trackBStereoAnalysis,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false
}: StereoAnalysisSectionProps) {
  if (!trackAStereoAnalysis && !trackBStereoAnalysis) {
    return (
      <div className="px-3 py-2 text-xs text-white/70">
        No stereo data available
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
        <div className="space-y-3">
        {/* Phase Correlation Comparison */}
        <ComparisonRow
          label="Phase Corr"
          valueA={trackAStereoAnalysis ? formatCorrelation(trackAStereoAnalysis.phaseCorrelation) : '--'}
          valueB={trackBStereoAnalysis ? formatCorrelation(trackBStereoAnalysis.phaseCorrelation) : '--'}
          deltaText={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getDelta(trackAStereoAnalysis.phaseCorrelation, trackBStereoAnalysis.phaseCorrelation).text : undefined}
          deltaColor={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getDelta(trackAStereoAnalysis.phaseCorrelation, trackBStereoAnalysis.phaseCorrelation).color : undefined}
          showDelta={!!(trackAStereoAnalysis && trackBStereoAnalysis)}
        />

        {/* Stereo Width Comparison */}
        <ComparisonRow
          label="Stereo Width (%)"
          valueA={trackAStereoAnalysis ? formatStereoWidth(trackAStereoAnalysis.stereoWidth) : '--'}
          valueB={trackBStereoAnalysis ? formatStereoWidth(trackBStereoAnalysis.stereoWidth) : '--'}
          deltaText={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getStereoPercent(trackAStereoAnalysis.stereoWidth, trackBStereoAnalysis.stereoWidth).text : undefined}
          deltaColor={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getStereoPercent(trackAStereoAnalysis.stereoWidth, trackBStereoAnalysis.stereoWidth).color : undefined}
          showDelta={!!(trackAStereoAnalysis && trackBStereoAnalysis)}
        />

        {/* Mid/Side Levels */}
        <DualComparisonRow
          label="M/S Levels (dB)"
          valueA1={trackAStereoAnalysis ? formatDb(linearToDb(trackAStereoAnalysis.midLevel)) : '-∞'}
          valueA2={trackAStereoAnalysis ? formatDb(linearToDb(trackAStereoAnalysis.sideLevel)) : '-∞'}
          valueB1={trackBStereoAnalysis ? formatDb(linearToDb(trackBStereoAnalysis.midLevel)) : '-∞'}
          valueB2={trackBStereoAnalysis ? formatDb(linearToDb(trackBStereoAnalysis.sideLevel)) : '-∞'}
          colorA1={trackAStereoAnalysis ? getLevelColor(linearToDb(trackAStereoAnalysis.midLevel)) : undefined}
          colorA2={trackAStereoAnalysis ? getLevelColor(linearToDb(trackAStereoAnalysis.sideLevel)) : undefined}
          colorB1={trackBStereoAnalysis ? getLevelColor(linearToDb(trackBStereoAnalysis.midLevel)) : undefined}
          colorB2={trackBStereoAnalysis ? getLevelColor(linearToDb(trackBStereoAnalysis.sideLevel)) : undefined}
        />
        </div>
    </div>
  );
}