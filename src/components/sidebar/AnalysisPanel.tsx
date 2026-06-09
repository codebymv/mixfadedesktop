import { Activity, TrendingUp, Radio, Waves } from 'lucide-react';
import { LevelsAnalysisSection } from '../analysis/LevelsAnalysisSection';
import { FrequencyAnalysisSection } from '../analysis/FrequencyAnalysisSection';
import { StereoAnalysisSection } from '../analysis/StereoAnalysisSection';
import { SpectrogramAnalysisSection } from '../analysis/SpectrogramAnalysisSection';
import { formatDb, linearToDb, formatCorrelation, formatStereoWidth, formatBrightness, formatActivity } from '../../utils/analysisFormatters';
import { CollapsibleCard } from './analysis/CollapsibleCard';
import { useCollapsedSections } from './analysis/useCollapsedSections';
import { useSmoothedAnalysis } from './analysis/useSmoothedAnalysis';
import type { AnalysisPanelProps } from './analysis/types';

export function AnalysisPanel({
  trackAFile,
  trackBFile,
  trackADeckLevels,
  trackBDeckLevels,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  // Crossfade data
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0
}: AnalysisPanelProps) {
  const { collapsed, toggle } = useCollapsedSections();
  const currentAnalysis = useSmoothedAnalysis({
    trackAFile,
    trackBFile,
    trackADeckLevels,
    trackBDeckLevels,
    trackAStereoData,
    trackBStereoData,
    trackAFrequencyData,
    trackBFrequencyData,
    isTrackAPlaying,
    isTrackBPlaying,
    isTransitioning,
    volumeA,
    volumeB
  });

  // Helper functions moved to utils/analysisFormatters.ts

  // ── Collapsed summaries ──────────────────────────────────────────────────
  const ca = currentAnalysis;

  const levelsSummary = (() => {
    const aLufs = ca.trackADeckLevels ? formatDb(ca.trackADeckLevels.lufs) : '--';
    const bLufs = ca.trackBDeckLevels ? formatDb(ca.trackBDeckLevels.lufs) : '--';
    const aRms  = ca.trackADeckLevels ? formatDb(linearToDb(ca.trackADeckLevels.rms)) : '--';
    const bRms  = ca.trackBDeckLevels ? formatDb(linearToDb(ca.trackBDeckLevels.rms)) : '--';
    return `A ${aLufs} LUFS · ${aRms} RMS  /  B ${bLufs} LUFS · ${bRms} RMS`;
  })();

  const freqSummary = (() => {
    const aBass = ca.trackAFrequencyAnalysis ? formatDb(ca.trackAFrequencyAnalysis.bassEnergy) : '--';
    const bBass = ca.trackBFrequencyAnalysis ? formatDb(ca.trackBFrequencyAnalysis.bassEnergy) : '--';
    const aMid  = ca.trackAFrequencyAnalysis ? formatDb(ca.trackAFrequencyAnalysis.midEnergy) : '--';
    const bMid  = ca.trackBFrequencyAnalysis ? formatDb(ca.trackBFrequencyAnalysis.midEnergy) : '--';
    return `Bass A ${aBass} / B ${bBass}  ·  Mid A ${aMid} / B ${bMid}`;
  })();

  const stereoSummary = (() => {
    const aCorr  = ca.trackAStereoAnalysis ? formatCorrelation(ca.trackAStereoAnalysis.phaseCorrelation) : '--';
    const bCorr  = ca.trackBStereoAnalysis ? formatCorrelation(ca.trackBStereoAnalysis.phaseCorrelation) : '--';
    const aWidth = ca.trackAStereoAnalysis ? formatStereoWidth(ca.trackAStereoAnalysis.stereoWidth) : '--';
    const bWidth = ca.trackBStereoAnalysis ? formatStereoWidth(ca.trackBStereoAnalysis.stereoWidth) : '--';
    return `Corr A ${aCorr} / B ${bCorr}  ·  Width A ${aWidth}% / B ${bWidth}%`;
  })();

  const spectrogramSummary = (() => {
    const aBright = ca.trackASpectrogramAnalysis ? formatBrightness(ca.trackASpectrogramAnalysis.brightness) : '--';
    const bBright = ca.trackBSpectrogramAnalysis ? formatBrightness(ca.trackBSpectrogramAnalysis.brightness) : '--';
    const aAct    = ca.trackASpectrogramAnalysis ? formatActivity(ca.trackASpectrogramAnalysis.activity) : '--';
    const bAct    = ca.trackBSpectrogramAnalysis ? formatActivity(ca.trackBSpectrogramAnalysis.activity) : '--';
    return `Bright A ${aBright} / B ${bBright}  ·  Act A ${aAct}% / B ${bAct}%`;
  })();

  return (
    <div className="p-4 space-y-6">
      {/* A/B Analysis */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">A/B Analysis</h3>

        {ca.trackADeckLevels || ca.trackBDeckLevels ? (
          <div className="space-y-1">
            {/* ── Levels ── */}
            <CollapsibleCard
              title="Levels"
              icon={<TrendingUp size={12} />}
              summary={levelsSummary}
              isCollapsed={!!collapsed['levels']}
              onToggle={() => toggle('levels')}
            >
              <LevelsAnalysisSection
                trackADeckLevels={ca.trackADeckLevels}
                trackBDeckLevels={ca.trackBDeckLevels}
              />
            </CollapsibleCard>

            {/* ── Frequencies ── */}
            <CollapsibleCard
              title="Frequencies"
              icon={<Activity size={12} />}
              summary={freqSummary}
              isCollapsed={!!collapsed['frequencies']}
              onToggle={() => toggle('frequencies')}
            >
              <FrequencyAnalysisSection
                trackAFrequencyAnalysis={ca.trackAFrequencyAnalysis}
                trackBFrequencyAnalysis={ca.trackBFrequencyAnalysis}
              />
            </CollapsibleCard>

            {/* ── Stereo ── */}
            <CollapsibleCard
              title="Stereo"
              icon={<Radio size={12} />}
              summary={stereoSummary}
              isCollapsed={!!collapsed['stereo']}
              onToggle={() => toggle('stereo')}
            >
              <StereoAnalysisSection
                trackAStereoAnalysis={ca.trackAStereoAnalysis}
                trackBStereoAnalysis={ca.trackBStereoAnalysis}
              />
            </CollapsibleCard>

            {/* ── Spectrogram ── */}
            <CollapsibleCard
              title="Spectrogram"
              icon={<Waves size={12} />}
              summary={spectrogramSummary}
              isCollapsed={!!collapsed['spectrogram']}
              onToggle={() => toggle('spectrogram')}
            >
              <SpectrogramAnalysisSection
                trackASpectrogramAnalysis={ca.trackASpectrogramAnalysis}
                trackBSpectrogramAnalysis={ca.trackBSpectrogramAnalysis}
              />
            </CollapsibleCard>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity size={32} className="text-white/60 mx-auto mb-3" />
            <p className="text-sm text-white font-medium">No analysis data</p>
            <p className="text-xs text-white/70 mt-1">Load and play audio files to see analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
