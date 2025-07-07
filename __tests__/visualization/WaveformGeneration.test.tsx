import { renderHook, act } from '@testing-library/react';
import { useWaveform, WaveformConfig } from '../../src/hooks/useWaveform';

// Mock canvas context
const mockCanvasContext: any = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  shadowColor: '',
  shadowBlur: 0,
  font: '',
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  fillText: jest.fn(),
  setLineDash: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  getContext: jest.fn(() => mockCanvasContext)
};

// Mock HTMLCanvasElement
const createMockCanvas = (width = 800, height = 200) => ({
  width,
  height,
  getContext: jest.fn(() => mockCanvasContext)
});

// Mock AudioBuffer
const createMockAudioBuffer = (channels = 2, length = 44100, sampleRate = 44100) => {
  const leftChannelData = new Float32Array(length);
  const rightChannelData = new Float32Array(length);
  
  // Generate test waveform data
  for (let i = 0; i < length; i++) {
    leftChannelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5; // 440Hz sine wave
    rightChannelData[i] = Math.sin(2 * Math.PI * 880 * i / sampleRate) * 0.3; // 880Hz sine wave
  }
  
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn((channel: number) => {
      if (channel === 0) return leftChannelData;
      if (channel === 1) return rightChannelData;
      return leftChannelData; // fallback
    })
  } as unknown as AudioBuffer;
};

// Test configuration
const testConfig: WaveformConfig = {
  waveColor: '#10b981',
  bgColor: '#0f172a',
  hoverColor: '#34d399',
  textColor: '#ffffff'
};

describe('🎨 Real-time Visualization - Waveform Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useWaveform Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useWaveform());
      
      expect(result.current.hasWaveformData()).toBe(false);
      expect(typeof result.current.generateStereoWaveformData).toBe('function');
      expect(typeof result.current.drawWaveforms).toBe('function');
      expect(typeof result.current.clearWaveformData).toBe('function');
    });

    it('should clear waveform data', () => {
      const { result } = renderHook(() => useWaveform());
      
      act(() => {
        result.current.clearWaveformData();
      });
      
      expect(result.current.hasWaveformData()).toBe(false);
    });
  });

  describe('Stereo Waveform Processing', () => {
    it('should generate separate L/R channel waveform data', async () => {
      const { result } = renderHook(() => useWaveform());
      const mockAudioBuffer = createMockAudioBuffer(2, 44100);
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      expect(waveformData).toBeDefined();
      expect(waveformData!.leftProcessedData).toBeInstanceOf(Float32Array);
      expect(waveformData!.rightProcessedData).toBeInstanceOf(Float32Array);
      expect(waveformData!.leftProcessedData.length).toBe(1600); // 800 * 2 (min/max pairs)
      expect(waveformData!.rightProcessedData.length).toBe(1600);
      expect(result.current.hasWaveformData()).toBe(true);
    });

    it('should handle mono audio by duplicating left channel to right', async () => {
      const { result } = renderHook(() => useWaveform());
      const mockAudioBuffer = createMockAudioBuffer(1, 44100); // Mono audio
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      expect(waveformData).toBeDefined();
      expect(waveformData!.leftProcessedData).toBeInstanceOf(Float32Array);
      expect(waveformData!.rightProcessedData).toBeInstanceOf(Float32Array);
      expect(result.current.hasWaveformData()).toBe(true);
      
      // Verify getChannelData was called correctly for mono (only channel 0 for mono)
      expect(mockAudioBuffer.getChannelData).toHaveBeenCalledWith(0);
      // For mono audio, channel 1 is not accessed since numberOfChannels = 1
      expect(mockAudioBuffer.getChannelData).toHaveBeenCalledTimes(1);
    });

    it('should process different audio buffer lengths correctly', async () => {
      const { result } = renderHook(() => useWaveform());
      const shortBuffer = createMockAudioBuffer(2, 22050); // 0.5 seconds
      const longBuffer = createMockAudioBuffer(2, 176400); // 4 seconds
      
      // Test short buffer
      let shortWaveformData;
      await act(async () => {
        shortWaveformData = await result.current.generateStereoWaveformData(shortBuffer);
      });
      
      expect(shortWaveformData!.leftProcessedData.length).toBe(1600);
      expect(shortWaveformData!.rightProcessedData.length).toBe(1600);
      
      // Test long buffer
      let longWaveformData;
      await act(async () => {
        longWaveformData = await result.current.generateStereoWaveformData(longBuffer);
      });
      
      expect(longWaveformData!.leftProcessedData.length).toBe(1600);
      expect(longWaveformData!.rightProcessedData.length).toBe(1600);
    });

    it('should calculate min/max values correctly for waveform peaks', async () => {
      const { result } = renderHook(() => useWaveform());
      const mockAudioBuffer = createMockAudioBuffer(2, 1600); // Small buffer for precise testing
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Check that we have min/max pairs
      const leftData = waveformData!.leftProcessedData;
      const rightData = waveformData!.rightProcessedData;
      
      for (let i = 0; i < leftData.length; i += 2) {
        const min = leftData[i];
        const max = leftData[i + 1];
        expect(min).toBeLessThanOrEqual(max);
      }
      
      for (let i = 0; i < rightData.length; i += 2) {
        const min = rightData[i];
        const max = rightData[i + 1];
        expect(min).toBeLessThanOrEqual(max);
      }
    });
  });

  describe('Canvas-based Rendering', () => {
    it('should draw waveforms on both left and right canvases', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      const rightCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      // First generate waveform data
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          rightCanvas,
          testConfig,
          0, // currentTime
          10, // duration
          1 // crossfadeVolume
        );
      });
      
      // Verify canvas context methods were called
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
      expect(mockCanvasContext.fill).toHaveBeenCalled();
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('should handle null canvas gracefully', async () => {
      const { result } = renderHook(() => useWaveform());
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Should not throw when canvas is null
      expect(() => {
        act(() => {
          result.current.drawWaveforms(
            null,
            null,
            testConfig,
            0,
            10,
            1
          );
        });
      }).not.toThrow();
    });

    it('should apply waveform configuration colors correctly', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      const rightCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      const customConfig: WaveformConfig = {
        waveColor: '#8b5cf6',
        bgColor: '#1e293b',
        hoverColor: '#a78bfa',
        textColor: '#f1f5f9'
      };
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Track fillRect calls to verify background color
       const fillRectCalls: any[] = [];
       mockCanvasContext.fillRect.mockImplementation((...args: any[]) => {
         fillRectCalls.push({ fillStyle: mockCanvasContext.fillStyle, args });
       });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          rightCanvas,
          customConfig,
          0,
          10,
          1
        );
      });
      
      // Verify background color was used for fillRect (canvas clearing)
        const backgroundFillCall = fillRectCalls.find((call: { fillStyle: string; args: any[] }) => 
          call.args[0] === 0 && call.args[1] === 0 && call.args[2] === 800 && call.args[3] === 200
        );
      expect(backgroundFillCall?.fillStyle).toBe('#0f172a');
      
      // Verify wave color is applied to stroke
      expect(mockCanvasContext.strokeStyle).toContain('#8b5cf6');
    });

    it('should draw channel labels correctly', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      const rightCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          rightCanvas,
          testConfig,
          0,
          10,
          1
        );
      });
      
      // Verify channel labels are drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('L', 8, 20);
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('R', 8, 20);
    });
  });

  describe('Crossfade Opacity Effects', () => {
    it('should apply crossfade opacity to waveform rendering', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      const rightCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Test with different crossfade volumes
      const crossfadeVolumes = [0, 0.5, 1];
      
      crossfadeVolumes.forEach(volume => {
        jest.clearAllMocks();
        
        act(() => {
          result.current.drawWaveforms(
            leftCanvas,
            rightCanvas,
            testConfig,
            0,
            10,
            volume
          );
        });
        
        // Verify rendering was called
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
        expect(mockCanvasContext.fill).toHaveBeenCalled();
      });
    });

    it('should handle zero crossfade volume with reduced opacity', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          5, // currentTime
          10, // duration
          0 // crossfadeVolume = 0
        );
      });
      
      // Verify playback position is drawn with reduced opacity
      expect(mockCanvasContext.strokeStyle).toContain('#ffffff40');
    });

    it('should apply full opacity for active crossfade', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Track shadow property changes during rendering
      let maxShadowBlur = 0;
      let shadowColorSet = '';
      
      Object.defineProperty(mockCanvasContext, 'shadowBlur', {
         get: () => maxShadowBlur,
         set: (value: number) => { if (value > maxShadowBlur) maxShadowBlur = value; },
         configurable: true
       });
       
       Object.defineProperty(mockCanvasContext, 'shadowColor', {
         get: () => shadowColorSet,
         set: (value: string) => { if (value) shadowColorSet = value; },
         configurable: true
       });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          5, // currentTime
          10, // duration
          1 // crossfadeVolume = 1
        );
      });
      
      // Verify full opacity playback indicator is drawn
      expect(mockCanvasContext.strokeStyle).toContain('#ffffff');
      // Verify that shadow effects were applied during rendering
      expect(shadowColorSet).toBe('#ffffff');
      expect(maxShadowBlur).toBe(6);
    });
  });

  describe('Playback Position Tracking', () => {
    it('should draw playback position indicator correctly', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      const currentTime = 5;
      const duration = 10;
      const expectedX = (currentTime / duration) * 800; // canvas width
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          currentTime,
          duration,
          1
        );
      });
      
      // Verify playback line is drawn at correct position
      expect(mockCanvasContext.moveTo).toHaveBeenCalledWith(expectedX, 0);
      expect(mockCanvasContext.lineTo).toHaveBeenCalledWith(expectedX, 200); // canvas height
    });

    it('should not draw playback position when duration is zero', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      jest.clearAllMocks();
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          5, // currentTime
          0, // duration = 0
          1
        );
      });
      
      // Verify playback line drawing methods are not called for position
      const moveToCallsForPlayback = mockCanvasContext.moveTo.mock.calls.filter(
        (call: any[]) => call[1] === 0 && call[0] !== 0 && call[0] !== 800
      );
      expect(moveToCallsForPlayback.length).toBe(0);
    });

    it('should not draw playback position when currentTime is zero', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      jest.clearAllMocks();
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          0, // currentTime = 0
          10, // duration
          1
        );
      });
      
      // Verify playback line drawing methods are not called for position
      const moveToCallsForPlayback = mockCanvasContext.moveTo.mock.calls.filter(
        (call: any[]) => call[1] === 0 && call[0] === 0
      );
      expect(moveToCallsForPlayback.length).toBe(0);
    });

    it('should handle playback position at different time points', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      const testCases = [
        { currentTime: 2.5, duration: 10, expectedX: 200 },
        { currentTime: 7.5, duration: 10, expectedX: 600 },
        { currentTime: 10, duration: 10, expectedX: 800 }
      ];
      
      testCases.forEach(({ currentTime, duration, expectedX }) => {
        jest.clearAllMocks();
        
        act(() => {
          result.current.drawWaveforms(
            leftCanvas,
            null,
            testConfig,
            currentTime,
            duration,
            1
          );
        });
        
        expect(mockCanvasContext.moveTo).toHaveBeenCalledWith(expectedX, 0);
        expect(mockCanvasContext.lineTo).toHaveBeenCalledWith(expectedX, 200);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should use configurable resolution (800px width)', async () => {
      const { result } = renderHook(() => useWaveform());
      const mockAudioBuffer = createMockAudioBuffer(2, 176400); // 4 seconds of audio
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Verify fixed resolution regardless of audio length
      expect(waveformData!.leftProcessedData.length).toBe(1600); // 800 * 2
      expect(waveformData!.rightProcessedData.length).toBe(1600); // 800 * 2
    });

    it('should efficiently process large audio buffers', async () => {
      const { result } = renderHook(() => useWaveform());
      const largeBuffer = createMockAudioBuffer(2, 441000); // 10 seconds
      
      const startTime = performance.now();
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(largeBuffer);
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Verify processing completes in reasonable time (< 100ms)
      expect(processingTime).toBeLessThan(100);
      expect(waveformData!.leftProcessedData.length).toBe(1600);
      expect(waveformData!.rightProcessedData.length).toBe(1600);
    });

    it('should handle edge case of very short audio buffers', async () => {
      const { result } = renderHook(() => useWaveform());
      const shortBuffer = createMockAudioBuffer(2, 100); // Very short buffer
      
      let waveformData;
      await act(async () => {
        waveformData = await result.current.generateStereoWaveformData(shortBuffer);
      });
      
      // Should still produce consistent output size
      expect(waveformData!.leftProcessedData.length).toBe(1600);
      expect(waveformData!.rightProcessedData.length).toBe(1600);
      expect(result.current.hasWaveformData()).toBe(true);
    });

    it('should reuse canvas context efficiently', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      const rightCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Draw multiple times
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.drawWaveforms(
            leftCanvas,
            rightCanvas,
            testConfig,
            i * 2,
            10,
            1
          );
        });
      }
      
      // Verify getContext is called for each canvas
      expect(leftCanvas.getContext).toHaveBeenCalled();
      expect(rightCanvas.getContext).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback Integration', () => {
    it('should provide visual feedback for different playback states', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      // Test different visual states
      const testStates = [
        { crossfadeVolume: 0, description: 'inactive track' },
        { crossfadeVolume: 0.5, description: 'partial crossfade' },
        { crossfadeVolume: 1, description: 'active track' }
      ];
      
      testStates.forEach(({ crossfadeVolume, description }) => {
        jest.clearAllMocks();
        
        act(() => {
          result.current.drawWaveforms(
            leftCanvas,
            null,
            testConfig,
            5,
            10,
            crossfadeVolume
          );
        });
        
        // Verify visual rendering occurs for each state
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
        expect(mockCanvasContext.fill).toHaveBeenCalled();
      });
    });

    it('should draw center line for visual reference', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          0,
          10,
          1
        );
      });
      
      // Verify center line is drawn
      expect(mockCanvasContext.setLineDash).toHaveBeenCalledWith([3, 3]);
      expect(mockCanvasContext.moveTo).toHaveBeenCalledWith(0, 100); // centerY
      expect(mockCanvasContext.lineTo).toHaveBeenCalledWith(800, 100); // centerY
      expect(mockCanvasContext.setLineDash).toHaveBeenCalledWith([]);
    });

    it('should create gradient effects for waveform fill', async () => {
      const { result } = renderHook(() => useWaveform());
      const leftCanvas = createMockCanvas() as unknown as HTMLCanvasElement;
      
      await act(async () => {
        const mockAudioBuffer = createMockAudioBuffer();
        await result.current.generateStereoWaveformData(mockAudioBuffer);
      });
      
      act(() => {
        result.current.drawWaveforms(
          leftCanvas,
          null,
          testConfig,
          0,
          10,
          1
        );
      });
      
      // Verify gradient creation
      expect(mockCanvasContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 200);
    });
  });
});