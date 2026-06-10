import { useState, useCallback, useRef } from 'react';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import Header from './components/Header';
import { DeckAnalysisWorkspace } from './components/app-shell/DeckAnalysisWorkspace';
import { UploadMixerSection } from './components/app-shell/UploadMixerSection';
import { VisualizerOverlay } from './components/app-shell/VisualizerOverlay';
import type { WaveformPlayerRef } from './components/WaveformPlayer';
import type { AudioLevels, StereoAnalysis } from './utils/audioAnalysis';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useApplyColorTheme } from './hooks/useColorTheme';
import { useCrossfade } from './hooks/useCrossfade';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useVisualizerState } from './hooks/useVisualizerState';
import { useSettings } from './contexts/settings-context';

type ActivityId = 'files' | 'analysis' | 'visualizer' | 'settings' | 'help';

const createEmptyAudioLevels = (): AudioLevels => ({
  left: 0,
  right: 0,
  leftRms: 0,
  rightRms: 0,
  rms: 0,
  lufs: -70,
  leftLufs: -70,
  rightLufs: -70,
});

const createNeutralStereoAnalysis = (): StereoAnalysis => ({
  phaseCorrelation: 0,
  stereoWidth: 0,
  balance: 0,
  midLevel: 0,
  sideLevel: 0,
  midLufs: -70,
  sideLufs: -70,
  monoCompatibility: 'EXCELLENT',
});

function App() {
  const { settings } = useSettings();
  const activeColorTheme = useApplyColorTheme();

  const [trackA, setTrackA] = useState<File | null>(null);
  const [trackB, setTrackB] = useState<File | null>(null);
  const [isTrackAPlaying, setIsTrackAPlaying] = useState(false);
  const [isTrackBPlaying, setIsTrackBPlaying] = useState(false);
  const [trackAAudioLevels, setTrackAAudioLevels] = useState<AudioLevels>(createEmptyAudioLevels);
  const [trackBAudioLevels, setTrackBAudioLevels] = useState<AudioLevels>(createEmptyAudioLevels);
  const [trackAFrequencyData, setTrackAFrequencyData] = useState<Float32Array>(new Float32Array(0));
  const [trackBFrequencyData, setTrackBFrequencyData] = useState<Float32Array>(new Float32Array(0));
  const [trackAStereoData, setTrackAStereoData] = useState<StereoAnalysis>(createNeutralStereoAnalysis);
  const [trackBStereoData, setTrackBStereoData] = useState<StereoAnalysis>(createNeutralStereoAnalysis);
  const [trackALeftSamples, setTrackALeftSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackARightSamples, setTrackARightSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackBLeftSamples, setTrackBLeftSamples] = useState<Float32Array>(new Float32Array(0));
  const [trackBRightSamples, setTrackBRightSamples] = useState<Float32Array>(new Float32Array(0));
  const [deckAVolume, setDeckAVolume] = useState(1.0);
  const [deckBVolume, setDeckBVolume] = useState(1.0);
  const [deckAMuted, setDeckAMuted] = useState(false);
  const [deckBMuted, setDeckBMuted] = useState(false);
  const [isLinkedPlayback, setIsLinkedPlayback] = useState(false);
  const [activeActivity, setActiveActivity] = useState<ActivityId>('files');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deckALooping, setDeckALooping] = useState(false);
  const [deckBLooping, setDeckBLooping] = useState(false);

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

  const handleTrackAStereoData = useCallback((
    data: StereoAnalysis,
    leftSamples?: Float32Array,
    rightSamples?: Float32Array
  ) => {
    setTrackAStereoData(data);
    if (leftSamples) setTrackALeftSamples(leftSamples);
    if (rightSamples) setTrackARightSamples(rightSamples);
  }, []);

  const handleTrackBStereoData = useCallback((
    data: StereoAnalysis,
    leftSamples?: Float32Array,
    rightSamples?: Float32Array
  ) => {
    setTrackBStereoData(data);
    if (leftSamples) setTrackBLeftSamples(leftSamples);
    if (rightSamples) setTrackBRightSamples(rightSamples);
  }, []);

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

  const handleToggleLinkedPlayback = useCallback(() => {
    setIsLinkedPlayback(linked => !linked);
  }, []);

  const hasAnyAudio = trackA || trackB;
  const hasBothAudio = trackA && trackB;
  const isLinkPlaybackDisabled = !hasBothAudio;
  const shouldRenderVisualizer = activeActivity === 'visualizer' || isVisualizerWindowOpen;
  const isVisualizerOverlayVisible = activeActivity === 'visualizer' && !isVisualizerWindowOpen;

  const handlePlayPause = useCallback(() => {
    if (isLinkedPlayback) {
      if (waveformPlayerARef.current && waveformPlayerBRef.current) {
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
      if (waveformPlayerARef.current) waveformPlayerARef.current.togglePlayPause();
      if (waveformPlayerBRef.current) waveformPlayerBRef.current.togglePlayPause();
    }
  }, [activeTrack, isLinkedPlayback]);

  useKeyboardShortcuts({
    space: handlePlayPause,
    tab: () => {
      if (hasBothAudio) {
        handleTrackSwitch('both');
      }
    },
    'ctrl+b': handleSidebarToggle,
    'ctrl+shift+e': () => handleActivityChange('files'),
    'ctrl+shift+a': () => handleActivityChange('analysis'),
    'ctrl+shift+v': () => handleActivityChange('visualizer'),
    'ctrl+,': () => handleActivityChange('settings'),
    f1: () => handleActivityChange('help'),
    escape: () => {
      if (activeActivity === 'visualizer') {
        handleActivityChange('files');
      }
    },
  });

  return (
    <div className="h-screen text-white flex">
      <ActivityBar
        activeId={activeActivity}
        onActivityChange={handleActivityChange}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleSidebarToggle}
      />

      <Sidebar
        activeActivity={activeActivity}
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        recentFiles={recentFiles}
        onLoadFileFromRecent={loadFileFromRecent}
        onAddDroppedFiles={stageDroppedFiles}
        onLoadToA={setTrackAWithRecent}
        onLoadToB={setTrackBWithRecent}
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
        isTransitioning={isTransitioning}
        volumeA={volumeA}
        volumeB={volumeB}
        visualizerSeed={visualizerSeed}
        onRollVisualizerSeed={rollVisualizerSeed}
        savedVisualizerSeeds={savedVisualizerSeeds}
        onSaveVisualizerSeed={saveVisualizerSeed}
        onLoadVisualizerSeed={loadVisualizerSeed}
        onDeleteVisualizerSeed={deleteVisualizerSeed}
        onOpenVisualizerWindow={openExternalVisualizerWindow}
        isVisualizerWindowOpen={isVisualizerWindowOpen}
      />

      <div className="flex-1 flex flex-col relative theme-main-shell-background">
        <Header isEmpty={!hasAnyAudio} />

        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
          hasAnyAudio && !hasBothAudio ? 'p-3 space-y-3' : 'p-6 space-y-6'
        }`}>
          <UploadMixerSection
            trackA={trackA}
            trackB={trackB}
            hasAnyAudio={Boolean(hasAnyAudio)}
            hasBothAudio={Boolean(hasBothAudio)}
            activeColorTheme={activeColorTheme}
            activeTrack={activeTrack}
            isTransitioning={isTransitioning}
            volumeA={volumeA}
            volumeB={volumeB}
            crossfadeDirection={currentCrossfadeDirection}
            onTrackASelect={setTrackAWithRecent}
            onTrackBSelect={setTrackBWithRecent}
            onTrackSwitch={handleTrackSwitch}
          />

          <DeckAnalysisWorkspace
            hasAnyAudio={Boolean(hasAnyAudio)}
            hasBothAudio={Boolean(hasBothAudio)}
            trackA={trackA}
            trackB={trackB}
            waveformPlayerARef={waveformPlayerARef}
            waveformPlayerBRef={waveformPlayerBRef}
            sidebarCollapsed={sidebarCollapsed}
            trackAAudioLevels={trackAAudioLevels}
            trackBAudioLevels={trackBAudioLevels}
            trackAFrequencyData={trackAFrequencyData}
            trackBFrequencyData={trackBFrequencyData}
            trackAStereoData={trackAStereoData}
            trackBStereoData={trackBStereoData}
            trackALeftSamples={trackALeftSamples}
            trackARightSamples={trackARightSamples}
            trackBLeftSamples={trackBLeftSamples}
            trackBRightSamples={trackBRightSamples}
            isTrackAPlaying={isTrackAPlaying}
            isTrackBPlaying={isTrackBPlaying}
            volumeA={volumeA}
            volumeB={volumeB}
            deckAVolume={deckAVolume}
            deckBVolume={deckBVolume}
            deckAMuted={deckAMuted}
            deckBMuted={deckBMuted}
            deckALooping={deckALooping}
            deckBLooping={deckBLooping}
            isLinkedPlayback={isLinkedPlayback}
            isLinkPlaybackDisabled={Boolean(isLinkPlaybackDisabled)}
            onTrackAPlayStateChange={setIsTrackAPlaying}
            onTrackBPlayStateChange={setIsTrackBPlaying}
            onTrackAAudioLevels={setTrackAAudioLevels}
            onTrackBAudioLevels={setTrackBAudioLevels}
            onTrackAFrequencyData={setTrackAFrequencyData}
            onTrackBFrequencyData={setTrackBFrequencyData}
            onTrackAStereoData={handleTrackAStereoData}
            onTrackBStereoData={handleTrackBStereoData}
            onDeckAVolumeChange={setDeckAVolume}
            onDeckBVolumeChange={setDeckBVolume}
            onDeckAMuteChange={setDeckAMuted}
            onDeckBMuteChange={setDeckBMuted}
            onDeckALoopChange={setDeckALooping}
            onDeckBLoopChange={setDeckBLooping}
            onDeckATimeSeek={handleDeckATimeSeek}
            onDeckBTimeSeek={handleDeckBTimeSeek}
            onToggleLinkedPlayback={handleToggleLinkedPlayback}
          />
        </div>

        <VisualizerOverlay
          isVisible={isVisualizerOverlayVisible}
          shouldRenderVisualizer={shouldRenderVisualizer}
          trackA={trackA}
          trackB={trackB}
          audioNodesA={visualizerAudioNodesA}
          audioNodesB={visualizerAudioNodesB}
          isTrackAPlaying={isTrackAPlaying}
          isTrackBPlaying={isTrackBPlaying}
          volumeA={visualizerMixA}
          volumeB={visualizerMixB}
          isTransitioning={isTransitioning}
          seed={visualizerSeed}
          isLoopingA={deckALooping}
          isLoopingB={deckBLooping}
          onToggleLoop={toggleVisualizerLoop}
          onRollSeed={rollVisualizerSeed}
          onSaveSeed={saveVisualizerSeed}
          onPlayPause={handlePlayPause}
          isSeedSaved={savedVisualizerSeeds.some(seedEntry => seedEntry.seed === visualizerSeed)}
          onExternalWindowReady={handleExternalVisualizerReady}
          onExternalWindowStateChange={handleExternalVisualizerWindowStateChange}
        />
      </div>
    </div>
  );
}

export default App;
