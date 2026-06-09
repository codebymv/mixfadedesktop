export type {
  AudioLevels,
  StereoAnalysis,
  FrequencyAnalysis,
  SmoothedAudioLevels,
  SpectrogramSnapshot,
  SpectrogramAnalysis
} from './types';

export {
  RMSAverager,
  linearToDb,
  dbToLinear,
  rmsToDb,
  calculateRMS,
  calculateStereoRMS,
  estimateLUFS,
  estimateChannelLUFS
} from './levels';

export {
  StereoAverager,
  calculatePhaseCorrelation,
  calculateStereoWidth,
  calculateMidSide,
  calculateStereoAnalysis
} from './stereo';

export {
  FrequencyAverager,
  calculateFrequencyMetrics
} from './frequency';

export {
  SpectrogramAverager,
  SpectrogramBuffer,
  calculateSpectrogramMetrics
} from './spectrogram';

import {
  linearToDb,
  dbToLinear,
  rmsToDb,
  calculateRMS,
  calculateStereoRMS,
  estimateLUFS,
  estimateChannelLUFS
} from './levels';
import {
  calculatePhaseCorrelation,
  calculateStereoWidth,
  calculateMidSide,
  calculateStereoAnalysis
} from './stereo';

export const AudioUtils = {
  linearToDb,
  dbToLinear,
  rmsToDb,
  calculateRMS,
  calculateStereoRMS,
  estimateLUFS,
  estimateChannelLUFS,
  calculatePhaseCorrelation,
  calculateStereoWidth,
  calculateMidSide,
  calculateStereoAnalysis
};
