import {
  AudioUtils,
  RMSAverager,
  StereoAverager,
  FrequencyAverager,
  SpectrogramAverager,
  SpectrogramBuffer,
  calculateFrequencyMetrics,
  calculateSpectrogramMetrics
} from '../../src/utils/audioAnalysis';

describe('audioAnalysis facade', () => {
  it('exports the expected AudioUtils methods', () => {
    expect(AudioUtils).toEqual(expect.objectContaining({
      linearToDb: expect.any(Function),
      dbToLinear: expect.any(Function),
      rmsToDb: expect.any(Function),
      calculateRMS: expect.any(Function),
      calculateStereoRMS: expect.any(Function),
      estimateLUFS: expect.any(Function),
      estimateChannelLUFS: expect.any(Function),
      calculatePhaseCorrelation: expect.any(Function),
      calculateStereoWidth: expect.any(Function),
      calculateMidSide: expect.any(Function),
      calculateStereoAnalysis: expect.any(Function)
    }));
  });

  it('exports the expected constructors', () => {
    expect(new RMSAverager()).toBeInstanceOf(RMSAverager);
    expect(new StereoAverager()).toBeInstanceOf(StereoAverager);
    expect(new FrequencyAverager()).toBeInstanceOf(FrequencyAverager);
    expect(new SpectrogramAverager()).toBeInstanceOf(SpectrogramAverager);
    expect(new SpectrogramBuffer()).toBeInstanceOf(SpectrogramBuffer);
  });

  it('preserves basic facade behavior', () => {
    expect(AudioUtils.rmsToDb(1)).toBe(0);
    expect(AudioUtils.dbToLinear(-60)).toBe(0);
    expect(calculateFrequencyMetrics(new Float32Array(0)).spectralBalance).toBe('SILENT');
    expect(calculateSpectrogramMetrics(new Float32Array(0), new SpectrogramBuffer()).brightness).toBe(0);
  });
});
