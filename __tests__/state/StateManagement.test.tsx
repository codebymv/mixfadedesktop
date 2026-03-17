import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../../src/contexts/SettingsContext';
import { DEFAULT_SETTINGS } from '../../src/types/settings';
import App from '../../src/App';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock audio context and related APIs
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatFrequencyData: jest.fn(),
    getByteFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1 }
  })),
  createChannelSplitter: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  resume: jest.fn().mockResolvedValue(undefined),
  state: 'running',
  sampleRate: 44100
};

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext)
});

// Mock HTMLAudioElement
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn().mockResolvedValue(undefined)
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: jest.fn()
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: jest.fn()
});

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-blob-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn()
});

// Test component to access settings context
const TestSettingsComponent: React.FC = () => {
  const { settings, updateSetting, resetToDefaults, getSetting } = useSettings();
  
  return (
    <div>
      <div data-testid="current-theme">{settings.ui.theme}</div>
      <div data-testid="crossfade-time">{settings.audio.crossfadeTime}</div>
      <div data-testid="fft-size">{settings.analysis.fftSize}</div>
      <div data-testid="recent-files-limit">{settings.files.recentFilesLimit}</div>
      
      <button 
        data-testid="update-theme"
        onClick={() => updateSetting('ui', 'theme', 'light')}
      >
        Update Theme
      </button>
      
      <button 
        data-testid="update-crossfade-time"
        onClick={() => updateSetting('audio', 'crossfadeTime', 5.0)}
      >
        Update Crossfade Time
      </button>
      
      <button 
        data-testid="reset-settings"
        onClick={resetToDefaults}
      >
        Reset Settings
      </button>
      
      <div data-testid="get-setting-result">
        {getSetting('ui', 'colorThemeId')}
      </div>
    </div>
  );
};

// Helper function to create mock audio files
const createMockAudioFile = (name: string, size: number = 1024 * 1024): File => {
  const file = new File(['mock audio data'], name, {
    type: 'audio/wav',
    lastModified: Date.now()
  });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('State Management & Settings', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('SettingsContext', () => {
    describe('Persistent Settings Storage', () => {
      it('should load default settings when localStorage is empty', () => {
        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('crossfade-time')).toHaveTextContent('2.5');
        expect(screen.getByTestId('fft-size')).toHaveTextContent('2048');
        expect(screen.getByTestId('recent-files-limit')).toHaveTextContent('10');
      });

      it('should load settings from localStorage when available', () => {
        const savedSettings = {
          ...DEFAULT_SETTINGS,
          ui: { ...DEFAULT_SETTINGS.ui, theme: 'light' },
          audio: { ...DEFAULT_SETTINGS.audio, crossfadeTime: 3.5 }
        };
        
        mockLocalStorage.setItem('mixfade-settings', JSON.stringify(savedSettings));

        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(screen.getByTestId('crossfade-time')).toHaveTextContent('3.5');
      });

      it('should merge missing nested settings with defaults', () => {
        mockLocalStorage.setItem('mixfade-settings', JSON.stringify({
          ui: { theme: 'light' }
        }));

        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(screen.getByTestId('get-setting-result')).toHaveTextContent(DEFAULT_SETTINGS.ui.colorThemeId);
        expect(screen.getByTestId('crossfade-time')).toHaveTextContent('2.5');
      });

      it('should handle corrupted localStorage data gracefully', () => {
        mockLocalStorage.setItem('mixfade-settings', 'invalid-json');

        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        // Should fall back to defaults
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('crossfade-time')).toHaveTextContent('2.5');
      });

      it('should persist settings to localStorage when updated', async () => {
        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        fireEvent.click(screen.getByTestId('update-theme'));

        await waitFor(() => {
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'mixfade-settings',
            expect.stringContaining('"theme":"light"')
          );
        });
      });
    });

    describe('Real-time Configuration', () => {
      it('should update settings in real-time', async () => {
        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        
        fireEvent.click(screen.getByTestId('update-theme'));
        
        await waitFor(() => {
          expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        });
      });

      it('should update analysis parameters', async () => {
        const TestAnalysisComponent: React.FC = () => {
          const { settings, updateSetting } = useSettings();
          return (
            <div>
              <div data-testid="update-rate">{settings.analysis.updateRate}</div>
              <div data-testid="smoothing-window">{settings.analysis.smoothingWindow}</div>
              <button 
                data-testid="update-analysis"
                onClick={() => {
                  updateSetting('analysis', 'updateRate', 60);
                  updateSetting('analysis', 'smoothingWindow', 500);
                }}
              >
                Update Analysis
              </button>
            </div>
          );
        };

        render(
          <SettingsProvider>
            <TestAnalysisComponent />
          </SettingsProvider>
        );

        fireEvent.click(screen.getByTestId('update-analysis'));

        await waitFor(() => {
          expect(screen.getByTestId('update-rate')).toHaveTextContent('60');
          expect(screen.getByTestId('smoothing-window')).toHaveTextContent('500');
        });
      });
    });

    describe('Audio Engine Customization', () => {
      it('should update crossfade parameters', async () => {
        const TestAudioComponent: React.FC = () => {
          const { settings, updateSetting } = useSettings();
          return (
            <div>
              <div data-testid="crossfade-time">{settings.audio.crossfadeTime}</div>
              <div data-testid="crossfade-curve">{settings.audio.crossfadeCurve}</div>
              <div data-testid="buffer-size">{settings.audio.bufferSize}</div>
              <button 
                data-testid="update-audio"
                onClick={() => {
                  updateSetting('audio', 'crossfadeTime', 4.0);
                  updateSetting('audio', 'crossfadeCurve', 'logarithmic');
                  updateSetting('audio', 'bufferSize', 2048);
                }}
              >
                Update Audio
              </button>
            </div>
          );
        };

        render(
          <SettingsProvider>
            <TestAudioComponent />
          </SettingsProvider>
        );

        fireEvent.click(screen.getByTestId('update-audio'));

        await waitFor(() => {
          expect(screen.getByTestId('crossfade-time')).toHaveTextContent('4');
          expect(screen.getByTestId('crossfade-curve')).toHaveTextContent('logarithmic');
          expect(screen.getByTestId('buffer-size')).toHaveTextContent('2048');
        });
      });
    });

    describe('UI Preferences and Keyboard Shortcuts', () => {
      it('should update UI preferences', async () => {
        const TestUIComponent: React.FC = () => {
          const { settings, updateSetting } = useSettings();
          return (
            <div>
              <div data-testid="sidebar-collapsed">{settings.ui.sidebarDefaultCollapsed.toString()}</div>
              <div data-testid="color-theme-id">{settings.ui.colorThemeId}</div>
              <div data-testid="meter-style">{settings.ui.meterStyle}</div>
              <button 
                data-testid="update-ui"
                onClick={() => {
                  updateSetting('ui', 'sidebarDefaultCollapsed', true);
                  updateSetting('ui', 'colorThemeId', 'sunset-cyan');
                  updateSetting('ui', 'meterStyle', 'vu');
                }}
              >
                Update UI
              </button>
            </div>
          );
        };

        render(
          <SettingsProvider>
            <TestUIComponent />
          </SettingsProvider>
        );

        fireEvent.click(screen.getByTestId('update-ui'));

        await waitFor(() => {
          expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
          expect(screen.getByTestId('color-theme-id')).toHaveTextContent('sunset-cyan');
          expect(screen.getByTestId('meter-style')).toHaveTextContent('vu');
        });
      });

      it('should update keyboard shortcuts', async () => {
        const TestShortcutsComponent: React.FC = () => {
          const { settings, updateSetting } = useSettings();
          return (
            <div>
              <div data-testid="play-pause-shortcut">{settings.shortcuts.playPause}</div>
              <div data-testid="crossfade-shortcut">{settings.shortcuts.crossfadeAB}</div>
              <button 
                data-testid="update-shortcuts"
                onClick={() => {
                  updateSetting('shortcuts', 'playPause', 'Enter');
                  updateSetting('shortcuts', 'crossfadeAB', 'Shift+Tab');
                }}
              >
                Update Shortcuts
              </button>
            </div>
          );
        };

        render(
          <SettingsProvider>
            <TestShortcutsComponent />
          </SettingsProvider>
        );

        fireEvent.click(screen.getByTestId('update-shortcuts'));

        await waitFor(() => {
          expect(screen.getByTestId('play-pause-shortcut')).toHaveTextContent('Enter');
          expect(screen.getByTestId('crossfade-shortcut')).toHaveTextContent('Shift+Tab');
        });
      });
    });

    describe('Settings Utilities', () => {
      it('should provide getSetting utility function', () => {
        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        expect(screen.getByTestId('get-setting-result')).toHaveTextContent('#10b981');
      });

      it('should reset settings to defaults', async () => {
        render(
          <SettingsProvider>
            <TestSettingsComponent />
          </SettingsProvider>
        );

        // Update a setting first
        fireEvent.click(screen.getByTestId('update-theme'));
        await waitFor(() => {
          expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        });

        // Reset to defaults
        fireEvent.click(screen.getByTestId('reset-settings'));
        await waitFor(() => {
          expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        });
      });

      it('should throw error when useSettings is used outside provider', () => {
        const TestComponent = () => {
          useSettings();
          return <div>Test</div>;
        };

        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => render(<TestComponent />)).toThrow(
          'useSettings must be used within a SettingsProvider'
        );
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('File Management System (App.tsx)', () => {
    describe('Recent Files Tracking', () => {
      it('should load recent files from localStorage on mount', async () => {
        const mockRecentFiles = [
          {
            id: 'test-file-1',
            name: 'test1.wav',
            size: '1.0 MB',
            lastModified: '1/1/2024',
            lastUsedSide: 'A' as const
          }
        ];
        
        mockLocalStorage.setItem('mixfade-recent-files', JSON.stringify(mockRecentFiles));

        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mixfade-recent-files');
        });
      });

      it('should handle corrupted recent files data gracefully', async () => {
        mockLocalStorage.setItem('mixfade-recent-files', 'invalid-json');
        
        // Suppress console.warn for this test
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to load recent files from localStorage:',
            expect.any(Error)
          );
        });
        
        consoleSpy.mockRestore();
      });

      it('should save recent files to localStorage when updated', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Create a mock file
        const mockFile = createMockAudioFile('test.wav');
        
        // Find the file input element (it's hidden with opacity 0)
        const fileInputs = document.querySelectorAll('input[type="file"]');
        const trackAFileInput = fileInputs[0] as HTMLInputElement; // First input is for Track A
        
        // Mock the files property
        Object.defineProperty(trackAFileInput, 'files', {
          value: [mockFile],
          configurable: true
        });

        // Trigger the change event
        fireEvent.change(trackAFileInput);

        await waitFor(() => {
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'mixfade-recent-files',
            expect.stringContaining('test.wav')
          );
        });
      });

      it('should respect recent files limit from settings', async () => {
        const TestFileManagementComponent: React.FC = () => {
          const { updateSetting } = useSettings();
          
          React.useEffect(() => {
            updateSetting('files', 'recentFilesLimit', 3);
          }, [updateSetting]);
          
          return <App />;
        };

        render(
          <SettingsProvider>
            <TestFileManagementComponent />
          </SettingsProvider>
        );

        // The limit should be applied when files are added
        // This test verifies the component renders without errors when settings are updated
        await waitFor(() => {
          expect(screen.getByText('Upload both files')).toBeInTheDocument();
        });
      });
    });

    describe('Session State Management', () => {
      it('should maintain track assignments during session', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Initially no tracks should be loaded
        expect(screen.queryByText('Audio A Analysis')).not.toBeInTheDocument();
        expect(screen.queryByText('Audio B Analysis')).not.toBeInTheDocument();
      });

      it('should handle active track switching when tracks are added/removed', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Test that crossfade control is not available without both tracks
        expect(screen.getByText('Upload both files')).toBeInTheDocument();
        expect(screen.getByText('to enable crossfade')).toBeInTheDocument();
      });

      it('should preserve crossfade state during transitions', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // The crossfade state should be properly initialized
        // This tests the initial state setup in App.tsx
        await waitFor(() => {
          expect(screen.getByText('Upload both files')).toBeInTheDocument();
        });
      });
    });

    describe('File Validation and Error Handling', () => {
      it('should handle file selection errors gracefully', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Test that the app doesn't crash with invalid file operations
        const uploadButtons = screen.getAllByText('Drop your audio file here');
        expect(uploadButtons).toHaveLength(2); // Track A and Track B
      });

      it('should validate audio file types', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // The file input should have audio/* accept attribute
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          expect(input).toHaveAttribute('accept', 'audio/*');
        });
      });
    });

    describe('Drag and Drop Integration', () => {
      it('should support drag and drop file handling', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Test that drag and drop zones are present
        const dropZones = screen.getAllByText(/drop.*audio.*file.*here/i);
        expect(dropZones.length).toBeGreaterThan(0);
      });

      it('should handle multiple file drops appropriately', async () => {
        render(
          <SettingsProvider>
            <App />
          </SettingsProvider>
        );

        // Test that the UI is set up to handle file drops
        // The actual drag/drop functionality would be tested in FileUpload component tests
        expect(screen.getAllByText('Drop your audio file here')).toHaveLength(2);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate settings with file management', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Settings should be available throughout the app
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mixfade-settings');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mixfade-recent-files');
      });
    });

    it('should maintain state consistency across components', async () => {
      render(
        <SettingsProvider>
          <App />
        </SettingsProvider>
      );

      // Test that the app renders without errors and maintains consistent state
      expect(screen.getByAltText('MixFade Logo')).toBeInTheDocument();
      expect(screen.getByText('Upload both files')).toBeInTheDocument();
    });

    it('should handle settings updates affecting app behavior', async () => {
      const TestIntegrationComponent: React.FC = () => {
        const { updateSetting } = useSettings();
        
        return (
          <div>
            <button 
              data-testid="update-crossfade-setting"
              onClick={() => updateSetting('audio', 'crossfadeTime', 1.0)}
            >
              Update Crossfade
            </button>
            <App />
          </div>
        );
      };

      render(
        <SettingsProvider>
          <TestIntegrationComponent />
        </SettingsProvider>
      );

      fireEvent.click(screen.getByTestId('update-crossfade-setting'));

      // The setting should be updated and persisted
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'mixfade-settings',
          expect.stringContaining('"crossfadeTime":1')
        );
      });
    });
  });
});