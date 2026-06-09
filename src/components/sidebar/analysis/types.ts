import type {
  AudioLevels,
  FrequencyAnalysis,
  SpectrogramAnalysis,
  StereoAnalysis
} from '../../../utils/audioAnalysis';

export interface AnalysisSnapshot {
  id: string;
  timestamp: number;
  trackAFile?: string;
  trackBFile?: string;
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  trackAFrequencyAnalysis?: FrequencyAnalysis;
  trackBFrequencyAnalysis?: FrequencyAnalysis;
  trackAStereoAnalysis?: StereoAnalysis;
  trackBStereoAnalysis?: StereoAnalysis;
  trackASpectrogramAnalysis?: SpectrogramAnalysis;
  trackBSpectrogramAnalysis?: SpectrogramAnalysis;
}

export interface AnalysisPanelProps {
  trackAFile?: File;
  trackBFile?: File;
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  isTransitioning?: boolean;
  volumeA?: number;
  volumeB?: number;
}
