import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ABSwitch } from './components/ABSwitch';
import { WaveformPlayer, WaveformPlayerRef } from './components/WaveformPlayer';
import { AnalysisTabs } from './components/AnalysisTabs';
import { AudioLevels, StereoAnalysis } from './utils/audioAnalysis';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { VisualizerMode, DEFAULT_VIS_SEED, getPresetEntryForSeed } from './components/VisualizerMode';
import type { SavedSeed } from './components/sidebar/VisualizerPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useApplyColorTheme } from './hooks/useColorTheme';
import { useSettings } from './contexts/SettingsContext';
import Header from './components/Header';
import type { DeckSide, RecentFile } from './types/recentFile';

type ActivityId = 'files' | 'analysis' | 'visualizer' | 'settings' | 'help';

const getRecentFileId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const ACCEPTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.flac', '.aiff', '.aif', '.m4a', '.aac', '.ogg'];
const isAcceptedAudioDrop = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type.startsWith('audio/') || ACCEPTED_AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
};

const createRecentFileEntry = (file: File, lastUsedSide: DeckSide | null): RecentFile => ({
  id: getRecentFileId(file),
  name: file.name,
  size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
  lastModified: new Date(file.lastModified).toLocaleDateString(),
  lastUsedSide,
  file,
});

function App() {
  // Load settings
  const { settings } = useSettings();
  const activeColorTheme = useApplyColorTheme();

  // Removed getCurrentSettings - using settings directly

  // Clean: removed noisy debug logs

  const [trackA, setTrackA] = useState<File | null>(null);
  const [trackB, setTrackB] = useState<File | null>(null);
  const [activeTrack, setActiveTrack] = useState<'A' | 'B' | 'both'>('A');
  const [isTrackAPlaying, setIsTrackAPlaying] = useState(false);
  const [isTrackBPlaying, setIsTrackBPlaying] = useState(false);
  const [trackAAudioLevels, setTrackAAudioLevels] = useState<AudioLevels>({ left: 0, right: 0, leftRms: 0, rightRms: 0, rms: 0, lufs: -70, leftLufs: -70, rightLufs: -70 });
  const [trackBAudioLevels, setTrackBAudioLevels] = useState<AudioLevels>({ left: 0, right: 0, leftRms: 0, rightRms: 0, rms: 0, lufs: -70, leftLufs: -70, rightLufs: -70 });
  const [trackAFrequencyData, setTrackAFrequencyData] = useState<Float32Array>(new Float32Array(0));
  const [trackBFrequencyData, setTrackBFrequencyData] = useState<Float32Array>(new Float32Array(0));
  const [trackAStereoData, setTrackAStereoData] = useState<StereoAnalysis>({ phaseCorrelation: 0, stereoWidth: 0, balance: 0, midLevel: 0, sideLevel: 0, midLufs: -70, sideLufs: -70, monoCompatibility: 'EXCELLENT' });
  const [trackBStereoData, setTrackBStereoData] = useState<StereoAnalysis>({ phaseCorrelation: 0, stereoWidth: 0, balance: 0, midLevel: 0, sideLevel: 0, midLufs: -70, sideLufs: -70, monoCompatibility: 'EXCELLENT' });
  const [trackALeftSamples, setTrackALeftSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackARightSamples, setTrackARightSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackBLeftSamples, setTrackBLeftSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackBRightSamples, setTrackBRightSamples] = useState<Float32Array>(new Float32Array(0));

  // Deck persistent volume state
  const [deckAVolume, setDeckAVolume] = useState(1.0);
  const [deckBVolume, setDeckBVolume] = useState(1.0);
  const [deckAMuted, setDeckAMuted] = useState(false);
  const [deckBMuted, setDeckBMuted] = useState(false);

  // Playback sync tracking
  const [isLinkedPlayback, setIsLinkedPlayback] = useState(false);

  // Recent files state
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Crossfade state
  const [volumeA, setVolumeA] = useState(1);
  const [volumeB, setVolumeB] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [crossfadeDirection, setCrossfadeDirection] = useState<'A→B' | 'B→A' | null>(null);
  const transitionRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for controlling waveform players
  const waveformPlayerARef = useRef<WaveformPlayerRef>(null);
  const waveformPlayerBRef = useRef<WaveformPlayerRef>(null);

  // Navigation state
  const [activeActivity, setActiveActivity] = useState<ActivityId>('files');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visualizerSeed, setVisualizerSeed] = useState(DEFAULT_VIS_SEED);
  const rollVisualizerSeed = useCallback(() => setVisualizerSeed((Math.random() * 0xFFFFFFFF) >>> 0), []);
  const resetVisualizerSeed = useCallback(() => setVisualizerSeed(DEFAULT_VIS_SEED), []);

  // Saved seeds — persisted to localStorage
  const SAVED_SEEDS_KEY = 'mixfade-vis-seeds';
  const [savedVisualizerSeeds, setSavedVisualizerSeeds] = useState<SavedSeed[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEEDS_KEY);
      return stored ? (JSON.parse(stored) as SavedSeed[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(SAVED_SEEDS_KEY, JSON.stringify(savedVisualizerSeeds));
  }, [savedVisualizerSeeds]);

  const saveVisualizerSeed = useCallback(() => {
    setSavedVisualizerSeeds(prev => {
      if (prev.some(s => s.seed === visualizerSeed)) return prev; // no dupes
      const [name] = getPresetEntryForSeed(visualizerSeed);
      return [...prev, { id: Date.now().toString(), seed: visualizerSeed, name, savedAt: Date.now() }];
    });
  }, [visualizerSeed]);

  const loadVisualizerSeed = useCallback((seed: number) => setVisualizerSeed(seed), []);

  const deleteVisualizerSeed = useCallback((id: string) => {
    setSavedVisualizerSeeds(prev => prev.filter(s => s.id !== id));
  }, []);
  const visualizerAudioNodesA = waveformPlayerARef.current?.getAudioNodes() ?? null;
  const visualizerAudioNodesB = waveformPlayerBRef.current?.getAudioNodes() ?? null;
  const visualizerMixA = deckAMuted ? 0 : deckAVolume * volumeA;
  const visualizerMixB = deckBMuted ? 0 : deckBVolume * volumeB;

  const handleActivityChange = useCallback((activityId: string) => {
    setActiveActivity(activityId as ActivityId);
    // Auto-collapse sidebar when switching to visualizer
    if (activityId === 'visualizer') {
      setSidebarCollapsed(true);
    } else if (sidebarCollapsed) {
      // Auto-open sidebar when switching away from visualizer
      setSidebarCollapsed(false);
    }
  }, [sidebarCollapsed]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);


  const hasAnyAudio = trackA || trackB;
  const hasBothAudio = trackA && trackB;

  // Stereo data handlers that also capture L/R samples for vectorscope
  const handleTrackAStereoData = useCallback((data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => {
    setTrackAStereoData(data);
    if (leftSamples) setTrackALeftSamples(leftSamples);
    if (rightSamples) setTrackARightSamples(rightSamples);
  }, []);

  const handleTrackBStereoData = useCallback((data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => {
    setTrackBStereoData(data);
    if (leftSamples) setTrackBLeftSamples(leftSamples);
    if (rightSamples) setTrackBRightSamples(rightSamples);
  }, []);

  // Recent files are session-only - they clear when the app restarts
  // This eliminates the confusion of files being in localStorage but not accessible
  // since File objects can't be persisted across sessions

  // Add file to recent files
  const addToRecentFiles = useCallback((file: File, side: DeckSide) => {
    const fileId = getRecentFileId(file);

    setRecentFiles(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(f => f.id !== fileId);

      // Keep only the configured number of recent files
      return [createRecentFileEntry(file, side), ...filtered].slice(0, settings.files.recentFilesLimit);
    });
  }, [settings.files.recentFilesLimit]);

  const stageDroppedFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setRecentFiles(prev => {
      const uniqueDroppedFiles = Array.from(new Map(files.map(file => [getRecentFileId(file), file])).values());
      const droppedIds = new Set(uniqueDroppedFiles.map(getRecentFileId));
      const filtered = prev.filter(file => !droppedIds.has(file.id));

      const stagedFiles = uniqueDroppedFiles.map(file => {
        const existingFile = prev.find(existing => existing.id === getRecentFileId(file));
        return createRecentFileEntry(file, existingFile?.lastUsedSide ?? null);
      });

      return [...stagedFiles, ...filtered].slice(0, settings.files.recentFilesLimit);
    });
  }, [settings.files.recentFilesLimit]);

  // Enhanced track setters that also update recent files
  const setTrackAWithRecent = useCallback((file: File | null) => {
    setTrackA(file);
    if (file) {
      addToRecentFiles(file, 'A');
    }
  }, [addToRecentFiles]);

  const setTrackBWithRecent = useCallback((file: File | null) => {
    setTrackB(file);
    if (file) {
      addToRecentFiles(file, 'B');
    }
  }, [addToRecentFiles]);

  // Load file from recent files (session-only, so file is always available)
  const loadFileFromRecent = useCallback((recentFile: RecentFile) => {
    console.log('loadFileFromRecent called for:', recentFile.name);

    // Since recent files are session-only, the File object should always be available
    if (recentFile.file) {
      if (!recentFile.lastUsedSide) {
        console.warn('Recent file has no deck assignment yet:', recentFile.name);
        return;
      }

      console.log('Loading in-memory File object for', recentFile.name);
      if (recentFile.lastUsedSide === 'A') {
        setTrackAWithRecent(recentFile.file);
      } else {
        setTrackBWithRecent(recentFile.file);
      }
    } else {
      // This should never happen with session-only recent files
      console.error('File object missing from recent file - this should not happen with session-only files');
    }
  }, [setTrackAWithRecent, setTrackBWithRecent]);

  // Handlers for syncing timeline scrubbing between decks
  const handleDeckATimeSeek = useCallback((time: number) => {
    if (isLinkedPlayback && waveformPlayerBRef.current) {
      waveformPlayerBRef.current.setCurrentTime(time);
    }
  }, [isLinkedPlayback]);

  const handleDeckBTimeSeek = useCallback((time: number) => {
    if (isLinkedPlayback && waveformPlayerARef.current) {
      waveformPlayerARef.current.setCurrentTime(time);
    }
  }, [isLinkedPlayback]);

  // Keyboard shortcut functions
  const handlePlayPause = useCallback(() => {
    // If timelines are linked, pressing spacebar toggles both simultaneously
    if (isLinkedPlayback) {
      if (waveformPlayerARef.current && waveformPlayerBRef.current) {
        // Toggle based on Deck A's current state to ensure they remain perfectly mirrored
        const isPlaying = waveformPlayerARef.current.isPlaying();
        if (isPlaying) {
          waveformPlayerARef.current.pause();
          waveformPlayerBRef.current.pause();
        } else {
          waveformPlayerARef.current.play();
          waveformPlayerBRef.current.play();
        }
      }
      return;
    }

    if (activeTrack === 'A' && waveformPlayerARef.current) {
      waveformPlayerARef.current.togglePlayPause();
    } else if (activeTrack === 'B' && waveformPlayerBRef.current) {
      waveformPlayerBRef.current.togglePlayPause();
    } else if (activeTrack === 'both') {
      // If both are active, toggle both
      if (waveformPlayerARef.current) waveformPlayerARef.current.togglePlayPause();
      if (waveformPlayerBRef.current) waveformPlayerBRef.current.togglePlayPause();
    }
  }, [activeTrack, isLinkedPlayback]);




  // DJ-style crossfade transition using settings (no useCallback to avoid stale closures)
  const performCrossfade = (fromTrack: 'A' | 'B', toTrack: 'A' | 'B') => {
    console.log(`🎚️ performCrossfade called: ${fromTrack} → ${toTrack}`);
    console.log(`🔍 Before crossfade - isTransitioning: ${isTransitioning}, transitionRef: ${transitionRef.current ? 'active' : 'null'}`);

    // Clear any existing transition first
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
      console.log('🧹 Cleared existing transition');
    }

    if (isTransitioning) {
      console.log('⚠️ Crossfade blocked - already transitioning');
      return; // Prevent multiple transitions
    }

    console.log('✅ Starting crossfade transition');
    setIsTransitioning(true);
    setCrossfadeDirection(fromTrack === 'A' ? 'A→B' : 'B→A');
    // Access settings directly from current scope (no caching)
    console.log(`🔍 CROSSFADE DEBUG: settings.audio.crossfadeTime = ${settings.audio.crossfadeTime}`);
    const currentCrossfadeTime = settings.audio.crossfadeTime;
    const currentUpdateRate = settings.analysis.updateRate;

    const transitionDuration = currentCrossfadeTime * 1000; // Convert seconds to milliseconds
    const steps = Math.max(30, Math.floor(currentUpdateRate)); // Use updateRate for smoothness
    const stepDuration = transitionDuration / steps;

    console.log(`🎚️ CROSSFADE: ${currentCrossfadeTime}s with ${settings.audio.crossfadeCurve} curve`);

    let currentStep = 0;

    const transition = () => {
      currentStep++;
      const linearProgress = currentStep / steps;

      // Apply selected crossfade curve using latest settings
      const curve = settings.audio.crossfadeCurve;
      let fadeOut, fadeIn;

      switch (curve) {
        case 'linear':
          fadeOut = 1 - linearProgress;
          fadeIn = linearProgress;
          break;
        case 'logarithmic': {
          const logProgress = Math.log(linearProgress * 9 + 1) / Math.log(10);
          fadeOut = 1 - logProgress;
          fadeIn = logProgress;
          break;
        }
        case 'equal-power':
        default: {
          const angle = linearProgress * (Math.PI / 2);
          fadeOut = Math.cos(angle);
          fadeIn = Math.sin(angle);
          break;
        }
      }

      if (fromTrack === 'A' && toTrack === 'B') {
        console.log(`🎚️ A→B Step ${currentStep}: fadeOut=${fadeOut.toFixed(3)}, fadeIn=${fadeIn.toFixed(3)} → volumeA=${fadeOut.toFixed(3)}, volumeB=${fadeIn.toFixed(3)}`);
        setVolumeA(fadeOut);
        setVolumeB(fadeIn);
      } else if (fromTrack === 'B' && toTrack === 'A') {
        console.log(`🎚️ B→A Step ${currentStep}: fadeOut=${fadeOut.toFixed(3)}, fadeIn=${fadeIn.toFixed(3)} → volumeA=${fadeIn.toFixed(3)}, volumeB=${fadeOut.toFixed(3)}`);
        setVolumeA(fadeIn);
        setVolumeB(fadeOut);
      }

      if (currentStep < steps) {
        transitionRef.current = setTimeout(transition, stepDuration);
      } else {
        // Clear transition state completely
        transitionRef.current = null;
        setIsTransitioning(false);
        setCrossfadeDirection(null);
        console.log('✅ Crossfade completed, transition state cleared');
        // Set final state with precise values
        if (toTrack === 'A') {
          setVolumeA(1);
          setVolumeB(0);
          setActiveTrack('A');
        } else {
          setVolumeA(0);
          setVolumeB(1);
          setActiveTrack('B');
        }
      }
    };

    // Start the first step after a small delay to allow state to settle
    transitionRef.current = setTimeout(transition, stepDuration);
  }; // End of performCrossfade function

  // Handle track switching with crossfade logic (no useCallback to avoid stale closures)
  const handleTrackSwitch = (track: 'A' | 'B' | 'both') => {
    console.log(`🎯 handleTrackSwitch called with track: ${track}, current activeTrack: ${activeTrack}`);
    console.log(`🔍 Current state - volumeA: ${volumeA}, volumeB: ${volumeB}, isTransitioning: ${isTransitioning}`);
    console.log(`🔍 Track files - trackA: ${trackA ? 'loaded' : 'null'}, trackB: ${trackB ? 'loaded' : 'null'}`);

    if (track === 'both') {
      // For crossfade, don't clear existing transition - let performCrossfade handle prevention
      // Crossfade from current active track to the other
      if (activeTrack === 'A') {
        console.log('🔄 CROSSFADE TRIGGER: A → B');
        performCrossfade('A', 'B');
      } else if (activeTrack === 'B') {
        console.log('🔄 CROSSFADE TRIGGER: B → A');
        performCrossfade('B', 'A');
      } else {
        console.log(`⚠️ Unexpected activeTrack state: ${activeTrack}, defaulting to A`);
        // If already in transition or both, default to A
        setVolumeA(1);
        setVolumeB(0);
        setActiveTrack('A');
      }
    } else {
      console.log(`🔄 Direct track selection: ${track}`);
      // Clear any existing transition for direct selection
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
        transitionRef.current = null;
        setIsTransitioning(false);
        setCrossfadeDirection(null);
      }

      // Direct selection - immediate switch
      setActiveTrack(track);
      if (track === 'A') {
        setVolumeA(1);
        setVolumeB(0);
      } else {
        setVolumeA(0);
        setVolumeB(1);
      }
    }
  };

  // Set up keyboard shortcuts (after all functions are defined)
  useKeyboardShortcuts({
    'space': handlePlayPause,
    'tab': () => {
      if (hasBothAudio) {
        handleTrackSwitch('both');
      }
    },
    // Navigation shortcuts
    'ctrl+b': handleSidebarToggle,
    'ctrl+shift+e': () => handleActivityChange('files'),
    'ctrl+shift+a': () => handleActivityChange('analysis'),
    'ctrl+shift+v': () => handleActivityChange('visualizer'),
    'ctrl+,': () => handleActivityChange('settings'),
    'f1': () => handleActivityChange('help'),
    'escape': () => {
      if (activeActivity === 'visualizer') {
        handleActivityChange('files');
      }
    },
  });

  // Handle active track switching when tracks are added/removed
  useEffect(() => {
    // If no tracks are loaded, reset to defaults
    if (!trackA && !trackB) {
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
      return;
    }

    // If only Track A exists
    if (trackA && !trackB) {
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
      return;
    }

    // If only Track B exists
    if (!trackA && trackB) {
      setActiveTrack('B');
      setVolumeA(0);
      setVolumeB(1);
      return;
    }

    // If both tracks exist, ensure activeTrack is set to a valid value
    if (trackA && trackB && (activeTrack === 'both' || !activeTrack)) {
      console.log('🔧 Both tracks loaded, setting activeTrack to A as default');
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
    }
  }, [trackA, trackB, activeTrack]);

  // Cleanup transition on unmount
  React.useEffect(() => {
    return () => {
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen text-white flex">
      {/* Activity Bar */}
      <ActivityBar
        activeId={activeActivity}
        onActivityChange={handleActivityChange}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleSidebarToggle}
      />

      {/* Sidebar */}
      <Sidebar
        activeActivity={activeActivity}
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        recentFiles={recentFiles}
        onLoadFileFromRecent={loadFileFromRecent}
        onAddDroppedFiles={stageDroppedFiles}
        onLoadToA={setTrackAWithRecent}
        onLoadToB={setTrackBWithRecent}
        // Analysis data
        trackAFile={trackA || undefined}
        trackBFile={trackB || undefined}
        trackADeckLevels={trackAAudioLevels}
        trackBDeckLevels={trackBAudioLevels}
        trackAStereoData={trackAStereoData}
        trackBStereoData={trackBStereoData}
        trackAFrequencyData={trackAFrequencyData}
        trackBFrequencyData={trackBFrequencyData}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        // Crossfade data
        isTransitioning={isTransitioning}
        volumeA={volumeA}
        volumeB={volumeB}
        // Visualizer seed
        visualizerSeed={visualizerSeed}
        onRollVisualizerSeed={rollVisualizerSeed}
        onResetVisualizerSeed={resetVisualizerSeed}
        savedVisualizerSeeds={savedVisualizerSeeds}
        onSaveVisualizerSeed={saveVisualizerSeed}
        onLoadVisualizerSeed={loadVisualizerSeed}
        onDeleteVisualizerSeed={deleteVisualizerSeed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative theme-main-shell-background">
        {/* Header */}
        <Header isEmpty={!hasAnyAudio} />

        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${hasAnyAudio && !hasBothAudio ? 'p-3 space-y-3' : 'p-6 space-y-6'
          }`}>
          {/* File Upload Section with Crossfade Control */}
          <section className={`${!hasAnyAudio ? 'min-h-[60vh] flex items-center justify-center' : ''}`}>
            <div className={`${!hasAnyAudio ? 'w-full max-w-6xl' : ''}`}>
              {/* Single Row: Upload A - Crossfade - Upload B */}
              <div className={`grid grid-cols-1 lg:grid-cols-5 items-center transition-all duration-300 ${hasAnyAudio && !hasBothAudio ? 'gap-3' : 'gap-6'
                }`}>
                {/* Audio A Upload - 2 columns */}
                <div className="lg:col-span-2">
                  <FileUpload
                    label="Deck A"
                    color="green"
                    file={trackA}
                    onFileSelect={setTrackAWithRecent}
                  />
                </div>

                {/* Crossfade Control - 1 column, centered */}
                <div className="lg:col-span-1 flex justify-center">
                  {hasBothAudio ? (
                    <ABSwitch
                      activeTrack={activeTrack}
                      onSwitch={handleTrackSwitch}
                      isTransitioning={isTransitioning}
                      volumeA={volumeA}
                      volumeB={volumeB}
                      crossfadeDirection={crossfadeDirection}
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center">
                      <div className="text-audio-text-dim text-sm text-center">
                        <div className="w-16 h-16 rounded-2xl border-2 border-gradient-to-r from-emerald-500/20 to-purple-500/20 flex items-center justify-center mb-2 mx-auto">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={activeColorTheme.deckA.base} />
                                <stop offset="100%" stopColor={activeColorTheme.deckB.base} />
                              </linearGradient>
                            </defs>
                            <Activity size={24} stroke="url(#iconGradient)" />
                          </svg>
                        </div>
                        <p>Upload both files</p>
                        <p className="text-xs">to enable crossfade</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio B Upload - 2 columns */}
                <div className="lg:col-span-2">
                  <FileUpload
                    label="Deck B"
                    color="purple"
                    file={trackB}
                    onFileSelect={setTrackBWithRecent}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Only show analysis sections when audio is uploaded */}
          {hasAnyAudio && (
            <>
              {/* Waveform Players */}
              <section className={hasAnyAudio && !hasBothAudio ? 'space-y-4' : 'space-y-6'}>
                <div className={`grid grid-cols-1 xl:grid-cols-2 transition-all duration-300 ${hasAnyAudio && !hasBothAudio ? 'gap-3' : 'gap-6'
                  }`}>
                  {/* Always render first grid item (Track A position) */}
                  <div className="relative min-h-[200px] rounded-xl transition-all duration-150">
                    {trackA && (
                      <WaveformPlayer
                        ref={waveformPlayerARef}
                        file={trackA}
                        color="green"
                        label="Deck A"
                        onPlayStateChange={setIsTrackAPlaying}
                        onAudioLevels={setTrackAAudioLevels}
                        onFrequencyData={setTrackAFrequencyData}
                        onStereoData={handleTrackAStereoData}
                        crossfadeVolume={volumeA}
                        deckVolume={deckAVolume}
                        onDeckVolumeChange={setDeckAVolume}
                        isMuted={deckAMuted}
                        onMuteChange={setDeckAMuted}
                        isLinkedPlayback={isLinkedPlayback}
                        onTimeSeek={handleDeckATimeSeek}
                        onToggleLinkedPlayback={() => setIsLinkedPlayback(!isLinkedPlayback)}
                      />
                    )}
                  </div>

                  {/* Always render second grid item (Track B position) */}
                  <div className="relative min-h-[200px] rounded-xl transition-all duration-150">
                    {trackB && (
                      <WaveformPlayer
                        ref={waveformPlayerBRef}
                        file={trackB}
                        color="purple"
                        label="Deck B"
                        isSidebarCollapsed={sidebarCollapsed}
                        onPlayStateChange={setIsTrackBPlaying}
                        onAudioLevels={setTrackBAudioLevels}
                        onFrequencyData={setTrackBFrequencyData}
                        onStereoData={handleTrackBStereoData}
                        crossfadeVolume={volumeB}
                        deckVolume={deckBVolume}
                        onDeckVolumeChange={setDeckBVolume}
                        isMuted={deckBMuted}
                        onMuteChange={setDeckBMuted}
                        isLinkedPlayback={isLinkedPlayback}
                        onTimeSeek={handleDeckBTimeSeek}
                        onToggleLinkedPlayback={() => setIsLinkedPlayback(!isLinkedPlayback)}
                      />
                    )}
                  </div>
                </div>
              </section>

              {/* Analysis Tabs */}
              <section className={hasAnyAudio && !hasBothAudio ? 'space-y-2' : 'space-y-4'}>
                <div className={`grid grid-cols-1 md:grid-cols-2 transition-all duration-300 ${hasAnyAudio && !hasBothAudio ? 'gap-3' : 'gap-6'
                  }`}>
                  {/* Always render first grid item (Track A position) */}
                  <div style={{ height: '365px' }}>
                    {trackA && (
                      <AnalysisTabs
                        label="Deck A Analysis"
                        color="green"
                        audioLevels={trackAAudioLevels}
                        frequencyData={trackAFrequencyData}
                        stereoData={trackAStereoData}
                        leftSamples={trackALeftSamples}
                        rightSamples={trackARightSamples}
                        isPlaying={isTrackAPlaying}
                        crossfadeVolume={volumeA}
                      />
                    )}
                  </div>

                  {/* Always render second grid item (Track B position) */}
                  <div style={{ height: '365px' }}>
                    {trackB && (
                      <AnalysisTabs
                        label="Deck B Analysis"
                        color="purple"
                        audioLevels={trackBAudioLevels}
                        frequencyData={trackBFrequencyData}
                        stereoData={trackBStereoData}
                        leftSamples={trackBLeftSamples}
                        rightSamples={trackBRightSamples}
                        isPlaying={isTrackBPlaying}
                        crossfadeVolume={volumeB}
                      />
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Visualizer Overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-150 ${
            activeActivity === 'visualizer'
              ? 'z-50 opacity-100 pointer-events-auto'
              : 'z-0 opacity-0 pointer-events-none'
          }`}
          aria-hidden={activeActivity !== 'visualizer'}
        >
          <VisualizerMode
            trackAFile={trackA}
            trackBFile={trackB}
            audioNodesA={visualizerAudioNodesA}
            audioNodesB={visualizerAudioNodesB}
            isTrackAPlaying={isTrackAPlaying}
            isTrackBPlaying={isTrackBPlaying}
            volumeA={visualizerMixA}
            volumeB={visualizerMixB}
            isTransitioning={isTransitioning}
            isActive={activeActivity === 'visualizer'}
            seed={visualizerSeed}
          />
        </div>
      </div>
    </div>
  );
}

export default App;