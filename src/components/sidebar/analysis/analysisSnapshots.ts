import type {
  AudioLevels,
  FrequencyAnalysis,
  SpectrogramAnalysis,
  StereoAnalysis
} from '../../../utils/audioAnalysis';
import type { AnalysisSnapshot } from './types';

interface AnalysisFiles {
  trackAFile?: File;
  trackBFile?: File;
}

interface RawAnalysisData {
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
}

export interface SmoothedAnalysisValues {
  trackASmoothed: AudioLevels | null;
  trackBSmoothed: AudioLevels | null;
  trackAFreqSmoothed: FrequencyAnalysis | null;
  trackBFreqSmoothed: FrequencyAnalysis | null;
  trackAStereoSmoothed: StereoAnalysis | null;
  trackBStereoSmoothed: StereoAnalysis | null;
  trackASpectrogramSmoothed: SpectrogramAnalysis | null;
  trackBSpectrogramSmoothed: SpectrogramAnalysis | null;
}

export interface CrossfadeAnalysisValues {
  preCrossfadeTrackA: AudioLevels | null;
  preCrossfadeTrackB: AudioLevels | null;
  preCrossfadeFreqA: FrequencyAnalysis | null;
  preCrossfadeFreqB: FrequencyAnalysis | null;
  preCrossfadeStereoA: StereoAnalysis | null;
  preCrossfadeStereoB: StereoAnalysis | null;
  preCrossfadeSpectrogramA: SpectrogramAnalysis | null;
  preCrossfadeSpectrogramB: SpectrogramAnalysis | null;
}

interface SelectAnalysisSnapshotParams {
  files: AnalysisFiles;
  raw: RawAnalysisData;
  smoothed: SmoothedAnalysisValues;
  crossfade: CrossfadeAnalysisValues;
  recentAnalysis: AnalysisSnapshot[];
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  isTransitioning: boolean;
  volumeA: number;
  volumeB: number;
}

export function hasSmoothedAnalysis(values: SmoothedAnalysisValues): boolean {
  return Boolean(
    values.trackASmoothed ||
    values.trackBSmoothed ||
    values.trackAFreqSmoothed ||
    values.trackBFreqSmoothed ||
    values.trackAStereoSmoothed ||
    values.trackBStereoSmoothed ||
    values.trackASpectrogramSmoothed ||
    values.trackBSpectrogramSmoothed
  );
}

export function buildAnalysisSnapshot(
  id: string,
  files: AnalysisFiles,
  raw: RawAnalysisData,
  values: SmoothedAnalysisValues
): AnalysisSnapshot {
  return {
    id,
    timestamp: Date.now(),
    trackAFile: files.trackAFile?.name,
    trackBFile: files.trackBFile?.name,
    trackADeckLevels: values.trackASmoothed || undefined,
    trackBDeckLevels: values.trackBSmoothed || undefined,
    trackAStereoData: raw.trackAStereoData,
    trackBStereoData: raw.trackBStereoData,
    trackAFrequencyData: raw.trackAFrequencyData,
    trackBFrequencyData: raw.trackBFrequencyData,
    trackAFrequencyAnalysis: values.trackAFreqSmoothed || undefined,
    trackBFrequencyAnalysis: values.trackBFreqSmoothed || undefined,
    trackAStereoAnalysis: values.trackAStereoSmoothed || undefined,
    trackBStereoAnalysis: values.trackBStereoSmoothed || undefined,
    trackASpectrogramAnalysis: values.trackASpectrogramSmoothed || undefined,
    trackBSpectrogramAnalysis: values.trackBSpectrogramSmoothed || undefined
  };
}

export function selectAnalysisSnapshot({
  files,
  raw,
  smoothed,
  crossfade,
  recentAnalysis,
  isTrackAPlaying,
  isTrackBPlaying,
  isTransitioning,
  volumeA,
  volumeB
}: SelectAnalysisSnapshotParams): AnalysisSnapshot {
  if (isTransitioning) {
    return buildAnalysisSnapshot('crossfade', files, raw, {
      trackASmoothed: crossfade.preCrossfadeTrackA || smoothed.trackASmoothed,
      trackBSmoothed: crossfade.preCrossfadeTrackB || smoothed.trackBSmoothed,
      trackAFreqSmoothed: crossfade.preCrossfadeFreqA || smoothed.trackAFreqSmoothed,
      trackBFreqSmoothed: crossfade.preCrossfadeFreqB || smoothed.trackBFreqSmoothed,
      trackAStereoSmoothed: crossfade.preCrossfadeStereoA || smoothed.trackAStereoSmoothed,
      trackBStereoSmoothed: crossfade.preCrossfadeStereoB || smoothed.trackBStereoSmoothed,
      trackASpectrogramSmoothed: crossfade.preCrossfadeSpectrogramA || smoothed.trackASpectrogramSmoothed,
      trackBSpectrogramSmoothed: crossfade.preCrossfadeSpectrogramB || smoothed.trackBSpectrogramSmoothed
    });
  }

  if ((isTrackAPlaying || isTrackBPlaying) && (crossfade.preCrossfadeTrackA || crossfade.preCrossfadeTrackB)) {
    return buildAnalysisSnapshot('post-crossfade', files, raw, {
      trackASmoothed: isTrackFadedOut(volumeA) && crossfade.preCrossfadeTrackA ? crossfade.preCrossfadeTrackA : smoothed.trackASmoothed,
      trackBSmoothed: isTrackFadedOut(volumeB) && crossfade.preCrossfadeTrackB ? crossfade.preCrossfadeTrackB : smoothed.trackBSmoothed,
      trackAFreqSmoothed: isTrackFadedOut(volumeA) && crossfade.preCrossfadeFreqA ? crossfade.preCrossfadeFreqA : smoothed.trackAFreqSmoothed,
      trackBFreqSmoothed: isTrackFadedOut(volumeB) && crossfade.preCrossfadeFreqB ? crossfade.preCrossfadeFreqB : smoothed.trackBFreqSmoothed,
      trackAStereoSmoothed: isTrackFadedOut(volumeA) && crossfade.preCrossfadeStereoA ? crossfade.preCrossfadeStereoA : smoothed.trackAStereoSmoothed,
      trackBStereoSmoothed: isTrackFadedOut(volumeB) && crossfade.preCrossfadeStereoB ? crossfade.preCrossfadeStereoB : smoothed.trackBStereoSmoothed,
      trackASpectrogramSmoothed: isTrackFadedOut(volumeA) && crossfade.preCrossfadeSpectrogramA ? crossfade.preCrossfadeSpectrogramA : smoothed.trackASpectrogramSmoothed,
      trackBSpectrogramSmoothed: isTrackFadedOut(volumeB) && crossfade.preCrossfadeSpectrogramB ? crossfade.preCrossfadeSpectrogramB : smoothed.trackBSpectrogramSmoothed
    });
  }

  if (isTrackAPlaying || isTrackBPlaying) {
    return buildAnalysisSnapshot('current', files, raw, smoothed);
  }

  const currentFileCombo = `${files.trackAFile?.name || 'none'}-${files.trackBFile?.name || 'none'}`;
  const recentSnapshot = recentAnalysis.find(snap =>
    `${snap.trackAFile || 'none'}-${snap.trackBFile || 'none'}` === currentFileCombo
  );

  if (recentSnapshot) {
    return recentSnapshot;
  }

  return buildAnalysisSnapshot('current', files, raw, smoothed);
}

function isTrackFadedOut(volume: number): boolean {
  return volume < 0.1;
}
