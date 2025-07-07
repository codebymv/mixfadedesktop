import { renderHook, act } from '@testing-library/react';
import { useAudioAnalysis } from '../../src/hooks/useAudioAnalysis';
import { AudioUtils, RMSAverager, StereoAverager, FrequencyAverager, SpectrogramBuffer } from '../../src/utils/audioAnalysis';
import type { AudioLevels, StereoAnalysis } from '../../src/utils/audioAnalysis';
import type { AudioContextNodes } from '../../src/hooks/useAudioContext';

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn();
const originalPerformance = global.performance;

// Mock console.log to avoid noise in tests
const originalLog = console.log;
console.log = jest.fn();

describe('useAudioAnalysis Hook', () => {
  let mockGetNodes: jest.MockedFunction<() => AudioContextNodes>;
  let mockCallbacks: {
    onAudioLevels: jest.MockedFunction<(levels: AudioLevels) => void>;
    onFrequencyData: jest.MockedFunction<(data: Float32Array) => void>;
    onStereoData: jest.MockedFunction<(data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => void>;
  };
  let mockAnalyserNode: any;
  let mockLeftAnalyser: any;
  let mockRightAnalyser: any;
  let mockTime: number;

  beforeAll(() => {
    // Mock performance globally
    Object.defineProperty(global, 'performance', {
      value: {
        now: mockPerformanceNow
      },
      writable: true,
      configurable: true
    });
  });

  afterAll(() => {
    // Restore original performance and console
    Object.defineProperty(global, 'performance', {
      value: originalPerformance,
      writable: true,
      configurable: true
    });
    console.log = originalLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Use real timers to avoid conflicts
    jest.useRealTimers();
    
    // Reset mock time
    mockTime = 0;
    mockPerformanceNow.mockImplementation(() => mockTime);

    // Create mock analyser nodes
    mockAnalyserNode = {
      frequencyBinCount: 1024,
      getFloatFrequencyData: jest.fn((dataArray: Float32Array) => {
        // Simulate frequency data with some test values
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = -20 + Math.random() * 10; // -20 to -10 dB range
        }
      })
    };

    mockLeftAnalyser = {
      frequencyBinCount: 512,
      getByteTimeDomainData: jest.fn((dataArray: Uint8Array) => {
        // Simulate left channel time domain data
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 128 + Math.sin(i * 0.1) * 20; // Sine wave around 128
        }
      })
    };

    mockRightAnalyser = {
      frequencyBinCount: 512,
      getByteTimeDomainData: jest.fn((dataArray: Uint8Array) => {
        // Simulate right channel time domain data
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 128 + Math.cos(i * 0.1) * 15; // Cosine wave around 128
        }
      })
    };

    mockGetNodes = jest.fn(() => ({
      audioContext: null,
      sourceNode: null,
      analyserNode: mockAnalyserNode,
      gainNode: null,
      splitterNode: null,
      leftAnalyser: mockLeftAnalyser,
      rightAnalyser: mockRightAnalyser
    }));

    mockCallbacks = {
      onAudioLevels: jest.fn(),
      onFrequencyData: jest.fn(),
      onStereoData: jest.fn()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State and Setup', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() =>
        useAudioAnalysis(false, 1, 60, mockGetNodes, mockCallbacks)
      );

      expect(result.current).toHaveProperty('cleanup');
      expect(typeof result.current.cleanup).toBe('function');
    });

    it('should send zero values when not playing', () => {
      renderHook(() =>
        useAudioAnalysis(false, 1, 60, mockGetNodes, mockCallbacks)
      );

      expect(mockCallbacks.onAudioLevels).toHaveBeenCalledWith({
        left: 0,
        right: 0,
        rms: 0,
        lufs: -70,
        leftRms: 0,
        rightRms: 0,
        leftLufs: -70,
        rightLufs: -70
      });
      expect(mockCallbacks.onFrequencyData).toHaveBeenCalledWith(new Float32Array(0));
      expect(mockCallbacks.onStereoData).toHaveBeenCalledWith(
        expect.objectContaining({
          phaseCorrelation: 0,
          stereoWidth: 0,
          balance: 0,
          midLevel: 0,
          sideLevel: 0,
          midLufs: -70,
          sideLufs: -70,
          monoCompatibility: 'EXCELLENT'
        }),
        new Float32Array(0),
        new Float32Array(0)
      );
    });
  });

  describe('Real-time Analysis When Playing', () => {
    it('should start analysis interval when playing', async () => {
      const { result } = renderHook(() =>
        useAudioAnalysis(true, 1, 30, mockGetNodes, mockCallbacks)
      );

      // Wait for the analysis to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
      });

      expect(mockAnalyserNode.getFloatFrequencyData).toHaveBeenCalled();
      expect(mockLeftAnalyser.getByteTimeDomainData).toHaveBeenCalled();
      expect(mockRightAnalyser.getByteTimeDomainData).toHaveBeenCalled();
      expect(mockCallbacks.onFrequencyData).toHaveBeenCalledWith(expect.any(Float32Array));
      expect(mockCallbacks.onAudioLevels).toHaveBeenCalledWith(expect.objectContaining({
        left: expect.any(Number),
        right: expect.any(Number),
        rms: expect.any(Number),
        lufs: expect.any(Number),
        leftRms: expect.any(Number),
        rightRms: expect.any(Number),
        leftLufs: expect.any(Number),
        rightLufs: expect.any(Number)
      }));
      expect(mockCallbacks.onStereoData).toHaveBeenCalledWith(
        expect.objectContaining({
          phaseCorrelation: expect.any(Number),
          stereoWidth: expect.any(Number),
          balance: expect.any(Number),
          midLevel: expect.any(Number),
          sideLevel: expect.any(Number),
          midLufs: expect.any(Number),
          sideLufs: expect.any(Number),
          monoCompatibility: expect.stringMatching(/^(EXCELLENT|GOOD|WARNING|POOR)$/)
        }),
        expect.any(Float32Array),
        expect.any(Float32Array)
      );
    });

    it('should respect configurable update rate', async () => {
      const updateRate = 20; // 20 FPS
      const expectedInterval = 1000 / updateRate; // 50ms

      renderHook(() =>
        useAudioAnalysis(true, 1, updateRate, mockGetNodes, mockCallbacks)
      );

      // Wait for the analysis to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, expectedInterval + 10));
      });
      
      expect(mockAnalyserNode.getFloatFrequencyData).toHaveBeenCalled();
    });

    it('should apply crossfade volume to audio levels', async () => {
      const crossfadeVolume = 0; // Muted

      renderHook(() =>
        useAudioAnalysis(true, crossfadeVolume, 60, mockGetNodes, mockCallbacks)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(mockCallbacks.onAudioLevels).toHaveBeenCalledWith({
        left: 0,
        right: 0,
        leftRms: 0,
        rightRms: 0,
        rms: 0,
        lufs: -70,
        leftLufs: -70,
        rightLufs: -70
      });
    });

    it('should not apply crossfade to stereo analysis', async () => {
      const crossfadeVolume = 0; // Muted

      renderHook(() =>
        useAudioAnalysis(true, crossfadeVolume, 60, mockGetNodes, mockCallbacks)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Stereo analysis should still receive real data even when crossfaded
      expect(mockCallbacks.onStereoData).toHaveBeenCalledWith(
        expect.objectContaining({
          phaseCorrelation: expect.any(Number),
          stereoWidth: expect.any(Number),
          balance: expect.any(Number)
        }),
        expect.any(Float32Array),
        expect.any(Float32Array)
      );
    });
  });

  describe('Cleanup and State Changes', () => {
    it('should cleanup intervals when component unmounts', () => {
      const { result, unmount } = renderHook(() =>
        useAudioAnalysis(true, 1, 60, mockGetNodes, mockCallbacks)
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should cleanup intervals when switching from playing to stopped', () => {
      const { rerender } = renderHook(
        ({ isPlaying }) => useAudioAnalysis(isPlaying, 1, 60, mockGetNodes, mockCallbacks),
        { initialProps: { isPlaying: true } }
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      rerender({ isPlaying: false });

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockCallbacks.onAudioLevels).toHaveBeenLastCalledWith({
        left: 0,
        right: 0,
        rms: 0,
        lufs: -70,
        leftRms: 0,
        rightRms: 0,
        leftLufs: -70,
        rightLufs: -70
      });
    });

    it('should handle missing analyser nodes gracefully', async () => {
      const mockGetNodesWithoutAnalysers = jest.fn(() => ({
        audioContext: null,
        sourceNode: null,
        analyserNode: null,
        gainNode: null,
        splitterNode: null,
        leftAnalyser: null,
        rightAnalyser: null
      }));

      renderHook(() =>
        useAudioAnalysis(true, 1, 60, mockGetNodesWithoutAnalysers, mockCallbacks)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should not crash and should not call any analysis functions
      expect(mockCallbacks.onFrequencyData).not.toHaveBeenCalled();
      expect(mockCallbacks.onAudioLevels).not.toHaveBeenCalled();
      expect(mockCallbacks.onStereoData).not.toHaveBeenCalled();
    });
  });
});

describe('AudioUtils', () => {
  describe('Basic Audio Calculations', () => {
    it('should convert linear to dB correctly', () => {
      expect(AudioUtils.linearToDb(1)).toBe(0); // 1 = 0 dB
      expect(AudioUtils.linearToDb(0.5)).toBeCloseTo(-6.02, 1); // 0.5 ≈ -6 dB
      expect(AudioUtils.linearToDb(0)).toBe(-60); // 0 = -60 dB (floor)
      expect(AudioUtils.linearToDb(-1)).toBe(-60); // Negative = -60 dB (floor)
    });

    it('should convert dB to linear correctly', () => {
      expect(AudioUtils.dbToLinear(0)).toBe(1); // 0 dB = 1
      expect(AudioUtils.dbToLinear(-6)).toBeCloseTo(0.501, 2); // -6 dB ≈ 0.5
      expect(AudioUtils.dbToLinear(-60)).toBe(0); // -60 dB = 0 (floor)
      expect(AudioUtils.dbToLinear(-100)).toBe(0); // Below floor = 0
    });

    it('should calculate RMS correctly', () => {
      const samples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const rms = AudioUtils.calculateRMS(samples);
      expect(rms).toBeCloseTo(0.5, 3);

      const silentSamples = new Float32Array([0, 0, 0, 0]);
      expect(AudioUtils.calculateRMS(silentSamples)).toBe(0);
    });

    it('should calculate stereo RMS correctly', () => {
      const leftSamples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const rightSamples = new Float32Array([0.3, -0.3, 0.3, -0.3]);
      
      const { leftRms, rightRms, combinedRms } = AudioUtils.calculateStereoRMS(leftSamples, rightSamples);
      
      expect(leftRms).toBeCloseTo(0.5, 3);
      expect(rightRms).toBeCloseTo(0.3, 3);
      expect(combinedRms).toBeGreaterThan(0);
      expect(combinedRms).toBeLessThan(Math.max(leftRms, rightRms));
    });

    it('should estimate LUFS correctly', () => {
      expect(AudioUtils.estimateLUFS(0)).toBe(-70); // Silent = -70 LUFS
      expect(AudioUtils.estimateLUFS(1)).toBeCloseTo(-3, 1); // Full scale ≈ -3 LUFS
      expect(AudioUtils.estimateLUFS(0.5)).toBeCloseTo(-9, 1); // Half scale ≈ -9 LUFS
    });
  });

  describe('Stereo Analysis', () => {
    it('should calculate phase correlation correctly', () => {
      // Perfect correlation (mono)
      const monoLeft = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const monoRight = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      expect(AudioUtils.calculatePhaseCorrelation(monoLeft, monoRight)).toBeCloseTo(1, 2);

      // Perfect anti-correlation
      const antiLeft = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const antiRight = new Float32Array([-0.5, 0.5, -0.5, 0.5]);
      expect(AudioUtils.calculatePhaseCorrelation(antiLeft, antiRight)).toBeCloseTo(-1, 2);

      // No correlation (silence)
      const silentLeft = new Float32Array([0, 0, 0, 0]);
      const silentRight = new Float32Array([0, 0, 0, 0]);
      expect(AudioUtils.calculatePhaseCorrelation(silentLeft, silentRight)).toBe(0);
    });

    it('should calculate stereo width correctly', () => {
      // Mono signal (no stereo width)
      const monoLeft = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const monoRight = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      expect(AudioUtils.calculateStereoWidth(monoLeft, monoRight)).toBeCloseTo(0, 1);

      // Wide stereo signal
      const wideLeft = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const wideRight = new Float32Array([-0.5, 0.5, -0.5, 0.5]);
      const width = AudioUtils.calculateStereoWidth(wideLeft, wideRight);
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(100);
    });

    it('should calculate mid/side channels correctly', () => {
      const leftSamples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const rightSamples = new Float32Array([0.3, -0.3, 0.3, -0.3]);
      
      const { midSamples, sideSamples } = AudioUtils.calculateMidSide(leftSamples, rightSamples);
      
      expect(midSamples.length).toBe(leftSamples.length);
      expect(sideSamples.length).toBe(leftSamples.length);
      
      // Mid should be (L+R)/2
      expect(midSamples[0]).toBeCloseTo((0.5 + 0.3) / 2, 3);
      // Side should be (L-R)/2
      expect(sideSamples[0]).toBeCloseTo((0.5 - 0.3) / 2, 3);
    });

    it('should perform complete stereo analysis', () => {
      const leftSamples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const rightSamples = new Float32Array([0.3, -0.3, 0.3, -0.3]);
      
      const analysis = AudioUtils.calculateStereoAnalysis(leftSamples, rightSamples);
      
      expect(analysis).toHaveProperty('phaseCorrelation');
      expect(analysis).toHaveProperty('stereoWidth');
      expect(analysis).toHaveProperty('balance');
      expect(analysis).toHaveProperty('midLevel');
      expect(analysis).toHaveProperty('sideLevel');
      expect(analysis).toHaveProperty('midLufs');
      expect(analysis).toHaveProperty('sideLufs');
      expect(analysis).toHaveProperty('monoCompatibility');
      
      expect(analysis.phaseCorrelation).toBeGreaterThanOrEqual(-1);
      expect(analysis.phaseCorrelation).toBeLessThanOrEqual(1);
      expect(analysis.stereoWidth).toBeGreaterThanOrEqual(0);
      expect(analysis.stereoWidth).toBeLessThanOrEqual(100);
      expect(analysis.balance).toBeGreaterThanOrEqual(-1);
      expect(analysis.balance).toBeLessThanOrEqual(1);
      expect(['EXCELLENT', 'GOOD', 'WARNING', 'POOR']).toContain(analysis.monoCompatibility);
    });
  });
});

describe('Analysis Averaging Classes', () => {
  let mockTime: number;
  let originalPerformanceNow: () => number;

  beforeAll(() => {
    // Store original performance.now
    originalPerformanceNow = performance.now;
    // Override with our mock
    performance.now = jest.fn(() => mockTime);
  });

  afterAll(() => {
    // Restore original performance.now
    performance.now = originalPerformanceNow;
  });

  beforeEach(() => {
    // Reset the mockTime
    mockTime = 0;
    // Ensure the mock returns the current mockTime value
    (performance.now as jest.Mock).mockImplementation(() => mockTime);
  });

  describe('RMSAverager', () => {
    let averager: RMSAverager;

    beforeEach(() => {
      // Ensure mock is set up before creating averager
      mockTime = 0;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      averager = new RMSAverager(100, 10); // 100ms window, 10ms update interval
    });

    it('should initialize with zero values', () => {
      const smoothed = averager.getSmoothedValues();
      expect(smoothed.leftRmsSmoothed).toBe(0);
      expect(smoothed.rightRmsSmoothed).toBe(0);
      expect(smoothed.rmsSmoothed).toBe(0);
      expect(smoothed.lufsSmoothed).toBe(-70);
    });

    it('should add samples and calculate smoothed values', () => {
      // Add first sample at time 0
      mockTime = 0;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      // Create averager with mocked timing
      const testAverager = new RMSAverager(100, 10);
      
      const firstResult = testAverager.addSample(0.5, 0.3, 0.4, -10, -12, -14);
      expect(firstResult).toBe(true);
      
      // Add second sample after interval (15ms > 10ms interval)
      mockTime = 15;
      const secondResult = testAverager.addSample(0.6, 0.4, 0.5, -8, -10, -12);
      expect(secondResult).toBe(true);
      
      const smoothed = testAverager.getSmoothedValues();
      expect(smoothed.leftRmsSmoothed).toBeGreaterThan(0);
      expect(smoothed.rightRmsSmoothed).toBeGreaterThan(0);
      expect(smoothed.rmsSmoothed).toBeGreaterThan(0);
      expect(smoothed.lufsSmoothed).toBeGreaterThan(-70);
    });

    it('should respect update interval', () => {
      mockTime = 0;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      expect(averager.addSample(0.5, 0.3, 0.4, -10, -12, -14)).toBe(true);
      
      // Try to add sample before interval
      mockTime = 5;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      expect(averager.addSample(0.6, 0.4, 0.5, -8, -10, -12)).toBe(false);
    });

    it('should reset correctly', () => {
      averager.addSample(0.5, 0.3, 0.4, -10, -12, -14);
      averager.reset();
      
      const smoothed = averager.getSmoothedValues();
      expect(smoothed.leftRmsSmoothed).toBe(0);
      expect(smoothed.lufsSmoothed).toBe(-70);
    });
  });

  describe('StereoAverager', () => {
    let averager: StereoAverager;
    let testStereoData: StereoAnalysis;

    beforeEach(() => {
      mockTime = 0;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      averager = new StereoAverager(100, 10);
      testStereoData = {
        phaseCorrelation: 0.8,
        stereoWidth: 50,
        balance: 0.1,
        midLevel: 0.5,
        sideLevel: 0.2,
        midLufs: -10,
        sideLufs: -20,
        monoCompatibility: 'GOOD'
      };
    });

    it('should add samples and calculate smoothed values', () => {
      expect(averager.addSample(testStereoData)).toBe(true);
      
      const smoothed = averager.getSmoothedValues();
      expect(smoothed.phaseCorrelation).toBeCloseTo(0.8, 2);
      expect(smoothed.stereoWidth).toBeCloseTo(50, 1);
      expect(smoothed.balance).toBeCloseTo(0.1, 2);
    });

    it('should respect update interval', () => {
      mockTime = 0;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      expect(averager.addSample(testStereoData)).toBe(true);
      
      mockTime = 5;
      (performance.now as jest.Mock).mockImplementation(() => mockTime);
      expect(averager.addSample(testStereoData)).toBe(false);
    });
  });
});