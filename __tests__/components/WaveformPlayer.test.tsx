import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WaveformPlayer, WaveformPlayerRef } from '../../src/components/WaveformPlayer';
import { SettingsProvider } from '../../src/contexts/SettingsContext';
import { AudioLevels, StereoAnalysis } from '../../src/utils/audioAnalysis';

// Mock the hooks
jest.mock('../../src/hooks/useAudioContext');
jest.mock('../../src/hooks/useWaveform');
jest.mock('../../src/hooks/useAudioAnalysis');
jest.mock('../../src/hooks/useAudioMetadata');

// Mock Web Audio API
const mockAudioContext = {
  createAnalyser: jest.fn(),
  createGain: jest.fn(),
  createChannelSplitter: jest.fn(),
  createMediaElementSource: jest.fn(),
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined)
};

const mockAnalyserNode = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getFloatFrequencyData: jest.fn(),
  getByteTimeDomainData: jest.fn(),
  fftSize: 2048,
  frequencyBinCount: 1024
};

const mockGainNode = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  gain: { value: 1 }
};

const mockSplitterNode = {
  connect: jest.fn(),
  disconnect: jest.fn()
};

// Mock audio element
const mockAudioElement = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 100,
  volume: 1,
  muted: false,
  paused: true,
  src: '',
  preload: 'auto'
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLAudioElement
global.HTMLAudioElement = jest.fn(() => mockAudioElement) as any;

// Mock AudioContext
(global as any).AudioContext = jest.fn(() => mockAudioContext);
(global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock the hooks with proper implementations
const mockUseAudioContext = {
  setupAudioContext: jest.fn(),
  updateVolume: jest.fn(),
  getNodes: jest.fn(() => ({
    analyserNode: mockAnalyserNode,
    gainNode: mockGainNode,
    splitterNode: mockSplitterNode,
    leftAnalyser: mockAnalyserNode,
    rightAnalyser: mockAnalyserNode
  })),
  cleanup: jest.fn()
};

const mockUseWaveform = {
  generateStereoWaveformData: jest.fn(),
  drawWaveforms: jest.fn(),
  hasWaveformData: jest.fn(() => true),
  cleanup: jest.fn()
};

const mockUseAudioAnalysis = {
  // Mock returns nothing as it handles callbacks internally
};

const mockUseAudioMetadata = {
  metadata: {
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    bitrate: 320,
    sampleRate: 44100,
    channels: 2,
    format: 'MP3'
  } as any,
  isLoading: false,
  error: null
};

require('../../src/hooks/useAudioContext').useAudioContext = jest.fn(() => mockUseAudioContext);
require('../../src/hooks/useWaveform').useWaveform = jest.fn(() => mockUseWaveform);
require('../../src/hooks/useAudioAnalysis').useAudioAnalysis = jest.fn(() => mockUseAudioAnalysis);
require('../../src/hooks/useAudioMetadata').useAudioMetadata = jest.fn(() => mockUseAudioMetadata);

// Create a test file
const createTestFile = (name: string = 'test-audio.mp3'): File => {
  const content = new Uint8Array([1, 2, 3, 4]); // Mock audio data
  return new File([content], name, { type: 'audio/mpeg' });
};

// Wrapper component with SettingsProvider
const WaveformPlayerWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <SettingsProvider>
    {children}
  </SettingsProvider>
);

describe('WaveformPlayer Component', () => {
  let mockOnPlayStateChange: jest.Mock;
  let mockOnAudioLevels: jest.Mock;
  let mockOnFrequencyData: jest.Mock;
  let mockOnStereoData: jest.Mock;
  let testFile: File;
  let playerRef: React.RefObject<WaveformPlayerRef>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mock functions
    mockOnPlayStateChange = jest.fn();
    mockOnAudioLevels = jest.fn();
    mockOnFrequencyData = jest.fn();
    mockOnStereoData = jest.fn();
    
    // Create test file
    testFile = createTestFile();
    
    // Reset audio element mock
    Object.assign(mockAudioElement, {
      currentTime: 0,
      duration: 100,
      volume: 1,
      muted: false,
      paused: true,
      src: ''
    });
    
    // Reset hook mocks
    mockUseAudioContext.setupAudioContext.mockClear();
    mockUseAudioContext.updateVolume.mockClear();
    mockUseWaveform.generateStereoWaveformData.mockClear();
    mockUseWaveform.drawWaveforms.mockClear();
  });

  describe('Component Initialization and Setup', () => {
    it('should render without errors', () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      expect(screen.getByText('Test Audio')).toBeInTheDocument();
    });

    it('should initialize audio context when audio is ready', async () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      // Simulate audio can play event
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.canPlay(audioElement);
        }
      });

      expect(mockUseAudioContext.setupAudioContext).toHaveBeenCalled();
    });

    it('should generate waveform data when audio loads', async () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      // Simulate audio loaded data event
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedData(audioElement);
        }
      });

      expect(mockUseWaveform.generateStereoWaveformData).toHaveBeenCalled();
    });
  });

  describe('Crossfade Volume Integration', () => {
    it('should apply crossfade volume to audio element', async () => {
      const crossfadeVolume = 0.5;
      
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            crossfadeVolume={crossfadeVolume}
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      await waitFor(() => {
        expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Boolean),
          crossfadeVolume
        );
      });
    });

    it('should mute audio when crossfade volume is 0', async () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            crossfadeVolume={0}
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      await waitFor(() => {
        expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Boolean),
          0
        );
      });
    });

    it('should update volume when crossfade volume changes', async () => {
      const { rerender } = render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            crossfadeVolume={1}
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      // Change crossfade volume
      rerender(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            crossfadeVolume={0.3}
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      await waitFor(() => {
        expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Boolean),
          0.3
        );
      });
    });
  });

  describe('Playback Controls', () => {
    it('should handle play/pause toggle', async () => {
      const TestComponent = () => {
        const ref = React.useRef<WaveformPlayerRef>(null);
        
        return (
          <WaveformPlayerWrapper>
            <div>
              <WaveformPlayer
                ref={ref}
                file={testFile}
                color="green"
                label="Test Audio"
                onPlayStateChange={mockOnPlayStateChange}
                onAudioLevels={mockOnAudioLevels}
                onFrequencyData={mockOnFrequencyData}
                onStereoData={mockOnStereoData}
              />
              <button onClick={() => ref.current?.togglePlayPause()}>Toggle</button>
            </div>
          </WaveformPlayerWrapper>
        );
      };

      render(<TestComponent />);

      // Simulate audio can play
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.canPlay(audioElement);
        }
      });

      // Click toggle button
      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);

      expect(mockAudioElement.play).toHaveBeenCalled();
    });

    it('should handle time seeking', async () => {
      const TestComponent = () => {
        const ref = React.useRef<WaveformPlayerRef>(null);
        
        return (
          <WaveformPlayerWrapper>
            <div>
              <WaveformPlayer
                ref={ref}
                file={testFile}
                color="green"
                label="Test Audio"
                onPlayStateChange={mockOnPlayStateChange}
                onAudioLevels={mockOnAudioLevels}
                onFrequencyData={mockOnFrequencyData}
                onStereoData={mockOnStereoData}
              />
              <button onClick={() => ref.current?.setCurrentTime(50)}>Seek</button>
            </div>
          </WaveformPlayerWrapper>
        );
      };

      render(<TestComponent />);

      const seekButton = screen.getByText('Seek');
      fireEvent.click(seekButton);

      expect(mockAudioElement.currentTime).toBe(50);
    });
  });

  describe('Real-time Waveform Rendering', () => {
    it('should render stereo waveform canvases', () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      const canvases = screen.getAllByRole('img'); // Canvas elements have img role
      expect(canvases).toHaveLength(2); // Left and right channel canvases
    });

    it('should update waveform display when time changes', async () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      // Simulate time update
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          mockAudioElement.currentTime = 25;
          fireEvent.timeUpdate(audioElement);
        }
      });

      expect(mockUseWaveform.drawWaveforms).toHaveBeenCalled();
    });

    it('should handle waveform click for seeking', async () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      // Simulate audio can play and has duration
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          mockAudioElement.duration = 100;
          fireEvent.canPlay(audioElement);
          fireEvent.loadedData(audioElement);
        }
      });

      // Click on waveform canvas
      const canvas = screen.getAllByRole('img')[0];
      fireEvent.click(canvas, {
        clientX: 200, // Simulate click at 50% of 400px width
        currentTarget: {
          getBoundingClientRect: () => ({ left: 0, width: 400 })
        }
      });

      expect(mockAudioElement.currentTime).toBe(50); // 50% of 100s duration
    });
  });

  describe('Audio Metadata Display', () => {
    it('should display audio metadata when available', () => {
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      expect(screen.getByText('Test Track')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('should show loading state when metadata is loading', () => {
      // Mock loading state
      mockUseAudioMetadata.isLoading = true;
      mockUseAudioMetadata.metadata = null;
      
      render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Volume Controls', () => {
    it('should handle volume changes', async () => {
      const TestComponent = () => {
        const ref = React.useRef<WaveformPlayerRef>(null);
        
        return (
          <WaveformPlayerWrapper>
            <div>
              <WaveformPlayer
                ref={ref}
                file={testFile}
                color="green"
                label="Test Audio"
                onPlayStateChange={mockOnPlayStateChange}
                onAudioLevels={mockOnAudioLevels}
                onFrequencyData={mockOnFrequencyData}
                onStereoData={mockOnStereoData}
              />
              <button onClick={() => ref.current?.setVolume(0.5)}>Set Volume</button>
            </div>
          </WaveformPlayerWrapper>
        );
      };

      render(<TestComponent />);

      const volumeButton = screen.getByText('Set Volume');
      fireEvent.click(volumeButton);

      expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
        0.5,
        expect.any(Boolean),
        expect.any(Number)
      );
    });

    it('should handle mute/unmute', async () => {
      const TestComponent = () => {
        const ref = React.useRef<WaveformPlayerRef>(null);
        
        return (
          <WaveformPlayerWrapper>
            <div>
              <WaveformPlayer
                ref={ref}
                file={testFile}
                color="green"
                label="Test Audio"
                onPlayStateChange={mockOnPlayStateChange}
                onAudioLevels={mockOnAudioLevels}
                onFrequencyData={mockOnFrequencyData}
                onStereoData={mockOnStereoData}
              />
              <button onClick={() => ref.current?.mute()}>Mute</button>
              <button onClick={() => ref.current?.unmute()}>Unmute</button>
            </div>
          </WaveformPlayerWrapper>
        );
      };

      render(<TestComponent />);

      // Test mute
      const muteButton = screen.getByText('Mute');
      fireEvent.click(muteButton);

      expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
        expect.any(Number),
        true,
        expect.any(Number)
      );

      // Test unmute
      const unmuteButton = screen.getByText('Unmute');
      fireEvent.click(unmuteButton);

      expect(mockUseAudioContext.updateVolume).toHaveBeenCalledWith(
        expect.any(Number),
        false,
        expect.any(Number)
      );
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('should cleanup resources when component unmounts', () => {
      const { unmount } = render(
        <WaveformPlayerWrapper>
          <WaveformPlayer
            file={testFile}
            color="green"
            label="Test Audio"
            onPlayStateChange={mockOnPlayStateChange}
            onAudioLevels={mockOnAudioLevels}
            onFrequencyData={mockOnFrequencyData}
            onStereoData={mockOnStereoData}
          />
        </WaveformPlayerWrapper>
      );

      unmount();

      expect(mockUseAudioContext.cleanup).toHaveBeenCalled();
      expect(mockUseWaveform.cleanup).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle audio play errors gracefully', async () => {
      // Mock play to reject
      mockAudioElement.play.mockRejectedValueOnce(new Error('Play failed'));
      
      const TestComponent = () => {
        const ref = React.useRef<WaveformPlayerRef>(null);
        
        return (
          <WaveformPlayerWrapper>
            <div>
              <WaveformPlayer
                ref={ref}
                file={testFile}
                color="green"
                label="Test Audio"
                onPlayStateChange={mockOnPlayStateChange}
                onAudioLevels={mockOnAudioLevels}
                onFrequencyData={mockOnFrequencyData}
                onStereoData={mockOnStereoData}
              />
              <button onClick={() => ref.current?.play()}>Play</button>
            </div>
          </WaveformPlayerWrapper>
        );
      };

      render(<TestComponent />);

      // Simulate audio can play
      await act(async () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.canPlay(audioElement);
        }
      });

      // Try to play
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);

      // Should not throw error
      expect(mockAudioElement.play).toHaveBeenCalled();
    });
  });
});