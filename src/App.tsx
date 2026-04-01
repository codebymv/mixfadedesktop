import React, { useState, useCallback, useRef } from 'react';
import { Activity } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ABSwitch } from './components/ABSwitch';
import { WaveformPlayer, WaveformPlayerRef } from './components/WaveformPlayer';
import { AnalysisTabs } from './components/AnalysisTabs';
import { AudioLevels, StereoAnalysis } from './utils/audioAnalysis';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { VisualizerMode } from './components/VisualizerMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useApplyColorTheme } from './hooks/useColorTheme';
import { useCrossfade } from './hooks/useCrossfade';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useVisualizerState } from './hooks/useVisualizerState';
import { useSettings } from './contexts/SettingsContext';
import Header from './components/Header';

type ActivityId = 'files' | 'analysis' | 'visualizer' | 'settings' | 'help';

const ACCEPTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.flac', '.aiff', '.aif', '.m4a', '.aac', '.ogg'];
const isAcceptedAudioDrop = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type.startsWith('audio/') || ACCEPTED_AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
};

function App() {
  // Load settings
  const { settings } = useSettings();
  const activeColorTheme = useApplyColorTheme();

  // Removed getCurrentSettings - using settings directly

  // Clean: removed noisy debug logs

  const [trackA, setTrackA] = useState<File | null>(null);
  const [trackB, setTrackB] = useState<File | null>(null);
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

  // Refs for controlling waveform players
  const waveformPlayerARef = useRef<WaveformPlayerRef>(null);
  const waveformPlayerBRef = useRef<WaveformPlayerRef>(null);
  const lastNonVisualizerActivityRef = useRef<ActivityId>('files');
  const {
    activeTrack,
    volumeA,
    volumeB,
    isTransitioning,
    crossfadeDirection: currentCrossfadeDirection,
    handleTrackSwitch,
  } = useCrossfade({
    hasTrackA: Boolean(trackA),
    hasTrackB: Boolean(trackB),
    crossfadeTime: settings.audio.crossfadeTime,
    crossfadeCurve: settings.audio.crossfadeCurve,
    updateRate: settings.analysis.updateRate,
  });
  const {
    recentFiles,
    stageDroppedFiles,
    setTrackAWithRecent,
    setTrackBWithRecent,
    loadFileFromRecent,
  } = useRecentFiles({
    recentFilesLimit: settings.files.recentFilesLimit,
    setTrackA,
    setTrackB,
  });

  // Navigation state
  const [activeActivity, setActiveActivity] = useState<ActivityId>('files');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hoisted loop state for each deck
  const [deckALooping, setDeckALooping] = useState(false);
  const [deckBLooping, setDeckBLooping] = useState(false);
  const {
    isVisualizerWindowOpen,
    visualizerSeed,
    savedVisualizerSeeds,
    visualizerAudioNodesA,
    visualizerAudioNodesB,
    visualizerMixA,
    visualizerMixB,
    rollVisualizerSeed,
    saveVisualizerSeed,
    loadVisualizerSeed,
    deleteVisualizerSeed,
    toggleVisualizerLoop,
    handleExternalVisualizerReady,
    handleExternalVisualizerWindowStateChange,
    openExternalVisualizerWindow,
  } = useVisualizerState({
    activeActivity,
    setActiveActivity,
    lastNonVisualizerActivityRef,
    waveformPlayerARef,
    waveformPlayerBRef,
    trackA,
    trackB,
    isTrackAPlaying,
    isTrackBPlaying,
    deckAVolume,
    deckBVolume,
    deckAMuted,
    deckBMuted,
    volumeA,
    volumeB,
    setDeckALooping,
    setDeckBLooping,
  });
  const handleActivityChange = useCallback((activityId: string) => {
    const nextActivity = activityId as ActivityId;
    setActiveActivity(nextActivity);
    if (nextActivity !== 'visualizer') {
      lastNonVisualizerActivityRef.current = nextActivity;
    }
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);


  const hasAnyAudio = trackA || trackB;
  const hasBothAudio = trackA && trackB;
  const isLinkPlaybackDisabled = !hasBothAudio;

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
        savedVisualizerSeeds={savedVisualizerSeeds}
        onSaveVisualizerSeed={saveVisualizerSeed}
        onLoadVisualizerSeed={loadVisualizerSeed}
        onDeleteVisualizerSeed={deleteVisualizerSeed}
        onOpenVisualizerWindow={openExternalVisualizerWindow}
        isVisualizerWindowOpen={isVisualizerWindowOpen}
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
                      crossfadeDirection={currentCrossfadeDirection}
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
                        isLooping={deckALooping}
                        onLoopChange={setDeckALooping}
                        isLinkedPlayback={isLinkedPlayback}
                        isLinkPlaybackDisabled={isLinkPlaybackDisabled}
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
                        isLooping={deckBLooping}
                        onLoopChange={setDeckBLooping}
                        isLinkedPlayback={isLinkedPlayback}
                        isLinkPlaybackDisabled={isLinkPlaybackDisabled}
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
            activeActivity === 'visualizer' && !isVisualizerWindowOpen
              ? 'z-50 opacity-100 pointer-events-auto'
              : 'z-0 opacity-0 pointer-events-none'
          }`}
          aria-hidden={activeActivity !== 'visualizer' || isVisualizerWindowOpen}
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
            isActive={activeActivity === 'visualizer' && !isVisualizerWindowOpen}
            seed={visualizerSeed}
            onPlayPause={handlePlayPause}
            isLoopingA={deckALooping}
            isLoopingB={deckBLooping}
            onToggleLoop={toggleVisualizerLoop}
            onRollSeed={rollVisualizerSeed}
            onSaveSeed={saveVisualizerSeed}
            isSeedSaved={savedVisualizerSeeds.some(s => s.seed === visualizerSeed)}
            onExternalWindowReady={handleExternalVisualizerReady}
            onExternalWindowStateChange={handleExternalVisualizerWindowStateChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;



