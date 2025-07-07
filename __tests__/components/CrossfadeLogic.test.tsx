import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../src/App';
import { SettingsProvider } from '../../src/contexts/SettingsContext';

// Mock all the components and hooks
jest.mock('../../src/components/WaveformPlayer', () => {
  const MockWaveformPlayer = React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      togglePlayPause: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      setCurrentTime: jest.fn(),
      getCurrentTime: jest.fn(() => 0),
      getDuration: jest.fn(() => 100),
      isPlaying: jest.fn(() => false),
      setVolume: jest.fn(),
      getVolume: jest.fn(() => 1),
      mute: jest.fn(),
      unmute: jest.fn(),
      isMuted: jest.fn(() => false)
    }));
    
    return (
      <div data-testid={`waveform-player-${props.color}`}>
        <div>WaveformPlayer - {props.label}</div>
        <div>Crossfade Volume: {props.crossfadeVolume}</div>
      </div>
    );
  });
  
  return {
    WaveformPlayer: MockWaveformPlayer
  };
});

jest.mock('../../src/components/FileUpload', () => ({
  FileUpload: ({ label, onFileSelect, file }: any) => (
    <div data-testid={`file-upload-${label.toLowerCase().replace(' ', '-')}`}>
      <div>{label}</div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          } else {
            onFileSelect(null);
          }
        }}
        data-testid={`file-input-${label.toLowerCase().replace(' ', '-')}`}
      />
      {file && <div>File: {file.name}</div>}
    </div>
  )
}));

jest.mock('../../src/components/ABSwitch', () => ({
  ABSwitch: ({ activeTrack, onSwitch, isTransitioning, volumeA, volumeB }: any) => (
    <div data-testid="ab-switch">
      <div>Active Track: {activeTrack}</div>
      <div>Transitioning: {isTransitioning.toString()}</div>
      <div>Volume A: {volumeA.toFixed(2)}</div>
      <div>Volume B: {volumeB.toFixed(2)}</div>
      <button onClick={() => onSwitch('A')} data-testid="switch-to-a">Switch to A</button>
      <button onClick={() => onSwitch('B')} data-testid="switch-to-b">Switch to B</button>
      <button onClick={() => onSwitch('both')} data-testid="crossfade">Crossfade</button>
    </div>
  )
}));

// Mock other components
jest.mock('../../src/components/AnalysisTabs', () => ({
  AnalysisTabs: ({ label, crossfadeVolume }: any) => (
    <div data-testid={`analysis-tabs-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div>{label}</div>
      <div>Crossfade Volume: {crossfadeVolume}</div>
    </div>
  )
}));

jest.mock('../../src/components/Sidebar', () => ({
  Sidebar: (props: any) => (
    <div data-testid="sidebar">
      <div>Sidebar</div>
      <div>Transitioning: {props.isTransitioning?.toString()}</div>
      <div>Volume A: {props.volumeA?.toFixed(2)}</div>
      <div>Volume B: {props.volumeB?.toFixed(2)}</div>
    </div>
  )
}));

jest.mock('../../src/components/ActivityBar', () => ({
  ActivityBar: () => <div data-testid="activity-bar">ActivityBar</div>
}));

jest.mock('../../src/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>
}));

// Mock hooks
jest.mock('../../src/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn()
}));

// Create test files
const createTestFile = (name: string): File => {
  const content = new Uint8Array([1, 2, 3, 4]);
  return new File([content], name, { type: 'audio/mpeg' });
};

// Mock timers
jest.useFakeTimers();

describe('Dual-Track Architecture & Crossfade Logic', () => {
  let testFileA: File;
  let testFileB: File;

  beforeEach(() => {
    testFileA = createTestFile('track-a.mp3');
    testFileB = createTestFile('track-b.mp3');
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Dual-Track Architecture', () => {
    it('should render both track upload areas', () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      expect(screen.getByTestId('file-upload-audio-a')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload-audio-b')).toBeInTheDocument();
    });

    it('should show crossfade placeholder when no files are loaded', () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      expect(screen.getByText('Upload both files')).toBeInTheDocument();
      expect(screen.getByText('to enable crossfade')).toBeInTheDocument();
    });

    it('should load files into separate tracks', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload file to Track A
      const fileInputA = screen.getByTestId('file-input-audio-a');
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
      });

      expect(screen.getByText('File: track-a.mp3')).toBeInTheDocument();

      // Upload file to Track B
      const fileInputB = screen.getByTestId('file-input-audio-b');
      await act(async () => {
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });

      expect(screen.getByText('File: track-b.mp3')).toBeInTheDocument();
    });

    it('should render WaveformPlayer components when files are loaded', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });

      expect(screen.getByTestId('waveform-player-green')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-player-purple')).toBeInTheDocument();
      expect(screen.getByText('WaveformPlayer - Audio A')).toBeInTheDocument();
      expect(screen.getByText('WaveformPlayer - Audio B')).toBeInTheDocument();
    });

    it('should render analysis tabs for both tracks', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });

      expect(screen.getByTestId('analysis-tabs-audio-a-analysis')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-tabs-audio-b-analysis')).toBeInTheDocument();
    });
  });

  describe('Crossfade Control Visibility', () => {
    it('should show ABSwitch when both files are loaded', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });

      expect(screen.getByTestId('ab-switch')).toBeInTheDocument();
      expect(screen.queryByText('Upload both files')).not.toBeInTheDocument();
    });

    it('should not show ABSwitch when only one file is loaded', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload only file A
      const fileInputA = screen.getByTestId('file-input-audio-a');
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
      });

      expect(screen.queryByTestId('ab-switch')).not.toBeInTheDocument();
      expect(screen.getByText('Upload both files')).toBeInTheDocument();
    });
  });

  describe('Volume Control and Synchronization', () => {
    beforeEach(async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });
    });

    it('should initialize with Track A at full volume and Track B muted', () => {
      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Active Track: A');
      expect(abSwitch).toHaveTextContent('Volume A: 1.00');
      expect(abSwitch).toHaveTextContent('Volume B: 0.00');
    });

    it('should switch to Track B when clicked', async () => {
      const switchToBButton = screen.getByTestId('switch-to-b');
      
      await act(async () => {
        fireEvent.click(switchToBButton);
      });

      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Active Track: B');
      expect(abSwitch).toHaveTextContent('Volume A: 0.00');
      expect(abSwitch).toHaveTextContent('Volume B: 1.00');
    });

    it('should switch back to Track A when clicked', async () => {
      // First switch to B
      const switchToBButton = screen.getByTestId('switch-to-b');
      await act(async () => {
        fireEvent.click(switchToBButton);
      });

      // Then switch back to A
      const switchToAButton = screen.getByTestId('switch-to-a');
      await act(async () => {
        fireEvent.click(switchToAButton);
      });

      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Active Track: A');
      expect(abSwitch).toHaveTextContent('Volume A: 1.00');
      expect(abSwitch).toHaveTextContent('Volume B: 0.00');
    });

    it('should pass crossfade volumes to WaveformPlayer components', () => {
      // Check initial volumes in WaveformPlayer components
      const waveformPlayerA = screen.getByTestId('waveform-player-green');
      const waveformPlayerB = screen.getByTestId('waveform-player-purple');
      
      expect(waveformPlayerA).toHaveTextContent('Crossfade Volume: 1');
      expect(waveformPlayerB).toHaveTextContent('Crossfade Volume: 0');
    });

    it('should pass crossfade volumes to AnalysisTabs components', () => {
      // Check initial volumes in AnalysisTabs components
      const analysisTabsA = screen.getByTestId('analysis-tabs-audio-a-analysis');
      const analysisTabsB = screen.getByTestId('analysis-tabs-audio-b-analysis');
      
      expect(analysisTabsA).toHaveTextContent('Crossfade Volume: 1');
      expect(analysisTabsB).toHaveTextContent('Crossfade Volume: 0');
    });
  });

  describe('Equal-Power Crossfade Curves', () => {
    beforeEach(async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });
    });

    it('should initiate crossfade transition when crossfade button is clicked', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Transitioning: true');
    });

    it('should perform smooth volume transition during crossfade', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      const abSwitch = screen.getByTestId('ab-switch');
      // Initially transitioning
      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Advance timers to simulate crossfade progress
      act(() => {
        jest.advanceTimersByTime(500); // Advance by 500ms
      });

      // Should still be transitioning
      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Complete the transition
      act(() => {
        jest.advanceTimersByTime(2000); // Complete the 2-second default transition
      });

      // Should finish transitioning
      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Active Track: B');
      expect(abSwitch).toHaveTextContent('Volume A: 0.00');
      expect(abSwitch).toHaveTextContent('Volume B: 1.00');
    });

    it('should crossfade from B to A when starting from Track B', async () => {
      // First switch to Track B
      const switchToBButton = screen.getByTestId('switch-to-b');
      await act(async () => {
        fireEvent.click(switchToBButton);
      });

      // Verify we're on Track B
      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Active Track: B');
      expect(abSwitch).toHaveTextContent('Volume A: 0.00');
      expect(abSwitch).toHaveTextContent('Volume B: 1.00');
      expect(abSwitch).toHaveTextContent('Transitioning: false');

      // Then initiate crossfade (should go from B to A)
      const crossfadeButton = screen.getByTestId('crossfade');
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      // Verify transition started
      expect(abSwitch).toHaveTextContent('Transitioning: true');

      // Complete the transition
      act(() => {
        jest.advanceTimersByTime(2500); // Use longer time to ensure completion
      });

      // Verify final state
      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Active Track: A');
      expect(abSwitch).toHaveTextContent('Volume A: 1.00');
      expect(abSwitch).toHaveTextContent('Volume B: 0.00');
    });

    it('should prevent multiple simultaneous crossfades', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      const abSwitch = screen.getByTestId('ab-switch');
      
      // Verify initial state
      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Active Track: A');
      
      // Start first crossfade
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Try to start another crossfade immediately while first is in progress
      // (Don't advance timers - test the immediate prevention)
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      // Should still be in the original transition (second click should be ignored)
      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Complete the transition
      act(() => {
        jest.advanceTimersByTime(2500); // Complete full transition
      });

      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Active Track: B');
    });
  });

  describe('Real-time Transition State Management', () => {
    beforeEach(async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });
    });

    it('should update transition state in sidebar during crossfade', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      const sidebar = screen.getByTestId('sidebar');
      
      // Verify initial state
      expect(sidebar).toHaveTextContent('Transitioning: false');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      expect(sidebar).toHaveTextContent('Transitioning: true');
      
      // Complete transition
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      expect(sidebar).toHaveTextContent('Transitioning: false');
    });

    it('should update volume states in sidebar during crossfade', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      const sidebar = screen.getByTestId('sidebar');
      
      // During transition, volumes should be changing
      act(() => {
        jest.advanceTimersByTime(1000); // Halfway through transition
      });

      // Volumes should be somewhere between 0 and 1
      const volumeAText = sidebar.textContent?.match(/Volume A: ([\d.]+)/)?.[1];
      const volumeBText = sidebar.textContent?.match(/Volume B: ([\d.]+)/)?.[1];
      
      if (volumeAText && volumeBText) {
        const volumeA = parseFloat(volumeAText);
        const volumeB = parseFloat(volumeBText);
        
        expect(volumeA).toBeGreaterThan(0);
        expect(volumeA).toBeLessThan(1);
        expect(volumeB).toBeGreaterThan(0);
        expect(volumeB).toBeLessThan(1);
      }
    });

    it('should clear transition when switching tracks directly', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      
      // Start crossfade
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      const abSwitch = screen.getByTestId('ab-switch');
      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Switch directly to Track A (should interrupt crossfade)
      const switchToAButton = screen.getByTestId('switch-to-a');
      await act(async () => {
        fireEvent.click(switchToAButton);
      });

      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Active Track: A');
      expect(abSwitch).toHaveTextContent('Volume A: 1.00');
      expect(abSwitch).toHaveTextContent('Volume B: 0.00');
    });
  });

  describe('Visual Feedback During Crossfade Operations', () => {
    beforeEach(async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });
    });

    it('should show transition state in ABSwitch component', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      const abSwitch = screen.getByTestId('ab-switch');
      
      // Verify initial state
      expect(abSwitch).toHaveTextContent('Transitioning: false');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Complete transition
      act(() => {
        jest.advanceTimersByTime(2500); // Use longer time to ensure completion
      });

      expect(abSwitch).toHaveTextContent('Transitioning: false');
    });

    it('should show real-time volume changes in ABSwitch component', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      const abSwitch = screen.getByTestId('ab-switch');
      
      // Verify initial state
      expect(abSwitch).toHaveTextContent('Volume A: 1.00');
      expect(abSwitch).toHaveTextContent('Volume B: 0.00');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      // Verify transition started
      expect(abSwitch).toHaveTextContent('Transitioning: true');
      
      // Advance partway through transition
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Volumes should have changed
      const volumeAMatch = abSwitch.textContent?.match(/Volume A: ([\d.]+)/);
      const volumeBMatch = abSwitch.textContent?.match(/Volume B: ([\d.]+)/);
      
      if (volumeAMatch && volumeBMatch) {
        const volumeA = parseFloat(volumeAMatch[1]);
        const volumeB = parseFloat(volumeBMatch[1]);
        
        expect(volumeA).toBeLessThan(1);
        expect(volumeB).toBeGreaterThan(0);
      }
      
      // Complete transition
      act(() => {
        jest.advanceTimersByTime(1500); // Complete the remaining time
      });
      
      expect(abSwitch).toHaveTextContent('Transitioning: false');
      expect(abSwitch).toHaveTextContent('Volume A: 0.00');
      expect(abSwitch).toHaveTextContent('Volume B: 1.00');
    });

    it('should update crossfade volumes in WaveformPlayer components during transition', async () => {
      const crossfadeButton = screen.getByTestId('crossfade');
      
      await act(async () => {
        fireEvent.click(crossfadeButton);
      });

      // Advance partway through transition
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const waveformPlayerA = screen.getByTestId('waveform-player-green');
      const waveformPlayerB = screen.getByTestId('waveform-player-purple');
      
      // Extract volume values from the components
      const volumeAMatch = waveformPlayerA.textContent?.match(/Crossfade Volume: ([\d.]+)/);
      const volumeBMatch = waveformPlayerB.textContent?.match(/Crossfade Volume: ([\d.]+)/);
      
      if (volumeAMatch && volumeBMatch) {
        const volumeA = parseFloat(volumeAMatch[1]);
        const volumeB = parseFloat(volumeBMatch[1]);
        
        expect(volumeA).toBeLessThan(1);
        expect(volumeB).toBeGreaterThan(0);
      }
    });
  });

  describe('Track State Management', () => {
    it('should handle single track scenarios correctly', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload only Track A
      const fileInputA = screen.getByTestId('file-input-audio-a');
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
      });

      // Should default to Track A active
      expect(screen.getByTestId('waveform-player-green')).toBeInTheDocument();
      expect(screen.queryByTestId('waveform-player-purple')).not.toBeInTheDocument();
    });

    it('should handle track removal correctly', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Upload both files first
      const fileInputA = screen.getByTestId('file-input-audio-a');
      const fileInputB = screen.getByTestId('file-input-audio-b');
      
      await act(async () => {
        fireEvent.change(fileInputA, { target: { files: [testFileA] } });
        fireEvent.change(fileInputB, { target: { files: [testFileB] } });
      });

      // Verify both tracks are loaded and crossfade controls are visible
      expect(screen.getByTestId('ab-switch')).toBeInTheDocument();
      expect(screen.queryByText('Upload both files')).not.toBeInTheDocument();
      
      // Remove Track B by simulating file removal with null
      await act(async () => {
        fireEvent.change(fileInputB, { target: { files: null } });
      });

      // Allow time for state updates
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should hide crossfade controls
      expect(screen.queryByTestId('ab-switch')).not.toBeInTheDocument();
      expect(screen.getByText('Upload both files')).toBeInTheDocument();
    });
  });
});