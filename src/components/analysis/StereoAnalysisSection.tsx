import React from 'react';
import { Radio } from 'lucide-react';
import { StereoAnalysis } from '../../utils/audioAnalysis';
import { AnalysisSectionHeader } from './AnalysisSectionHeader';
import { ComparisonRow } from './ComparisonRow';
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
      <div className="px-3 py-2 bg-slate-800 rounded-md">
        <AnalysisSectionHeader
          icon={Radio}
          title="Stereo"
          isTransitioning={isTransitioning}
          isTrackAPlaying={isTrackAPlaying}
          isTrackBPlaying={isTrackBPlaying}
          gradientId="stereoGradient"
        />
        <div className="text-xs text-white/70">
          No stereo data available
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 bg-slate-800 rounded-md">
      <AnalysisSectionHeader
        icon={Radio}
        title="Stereo"
        isTransitioning={isTransitioning}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        gradientId="stereoGradient"
      />

      <div className="space-y-3">
        {/* Phase Correlation Comparison */}
        <ComparisonRow
          label="Phase Correlation"
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
          label="Stereo Width"
          valueA={trackAStereoAnalysis ? formatStereoWidth(trackAStereoAnalysis.stereoWidth) : '--%'}
          valueB={trackBStereoAnalysis ? formatStereoWidth(trackBStereoAnalysis.stereoWidth) : '--%'}
          deltaText={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getStereoPercent(trackAStereoAnalysis.stereoWidth, trackBStereoAnalysis.stereoWidth).text : undefined}
          deltaColor={trackAStereoAnalysis && trackBStereoAnalysis ? 
            getStereoPercent(trackAStereoAnalysis.stereoWidth, trackBStereoAnalysis.stereoWidth).color : undefined}
          showDelta={!!(trackAStereoAnalysis && trackBStereoAnalysis)}
        />

        {/* Mid/Side Levels */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Mid/Side Levels</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  A
                </span>
                <span className="text-xs font-mono">
                  <span className={trackAStereoAnalysis ? getLevelColor(linearToDb(trackAStereoAnalysis.midLevel)) : 'text-slate-500'}>
                    {trackAStereoAnalysis ? formatDb(linearToDb(trackAStereoAnalysis.midLevel)) : '-∞'}
                  </span>
                  <span className="text-slate-500"> / </span>
                  <span className={trackAStereoAnalysis ? getLevelColor(linearToDb(trackAStereoAnalysis.sideLevel)) : 'text-slate-500'}>
                    {trackAStereoAnalysis ? formatDb(linearToDb(trackAStereoAnalysis.sideLevel)) : '-∞'}
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono">
                  <span className={trackBStereoAnalysis ? getLevelColor(linearToDb(trackBStereoAnalysis.midLevel)) : 'text-slate-500'}>
                    {trackBStereoAnalysis ? formatDb(linearToDb(trackBStereoAnalysis.midLevel)) : '-∞'}
                  </span>
                  <span className="text-slate-500"> / </span>
                  <span className={trackBStereoAnalysis ? getLevelColor(linearToDb(trackBStereoAnalysis.sideLevel)) : 'text-slate-500'}>
                    {trackBStereoAnalysis ? formatDb(linearToDb(trackBStereoAnalysis.sideLevel)) : '-∞'}
                  </span>
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