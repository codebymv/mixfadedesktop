import type { RefObject } from 'react';
import { AnalysisTabs } from '../AnalysisTabs';
import { WaveformPlayer } from '../WaveformPlayer';
import type { WaveformPlayerRef } from '../WaveformPlayer';
import type { AudioLevels, StereoAnalysis } from '../../utils/audioAnalysis';

type StereoDataHandler = (
  data: StereoAnalysis,
  leftSamples?: Float32Array,
  rightSamples?: Float32Array
) => void;

interface DeckAnalysisWorkspaceProps {
  hasAnyAudio: boolean;
  hasBothAudio: boolean;
  trackA: File | null;
  trackB: File | null;
  waveformPlayerARef: RefObject<WaveformPlayerRef>;
  waveformPlayerBRef: RefObject<WaveformPlayerRef>;
  sidebarCollapsed: boolean;
  trackAAudioLevels: AudioLevels;
  trackBAudioLevels: AudioLevels;
  trackAFrequencyData: Float32Array;
  trackBFrequencyData: Float32Array;
  trackAStereoData: StereoAnalysis;
  trackBStereoData: StereoAnalysis;
  trackALeftSamples: Float32Array;
  trackARightSamples: Float32Array;
  trackBLeftSamples: Float32Array;
  trackBRightSamples: Float32Array;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  volumeA: number;
  volumeB: number;
  deckAVolume: number;
  deckBVolume: number;
  deckAMuted: boolean;
  deckBMuted: boolean;
  deckALooping: boolean;
  deckBLooping: boolean;
  isLinkedPlayback: boolean;
  isLinkPlaybackDisabled: boolean;
  onTrackAPlayStateChange: (isPlaying: boolean) => void;
  onTrackBPlayStateChange: (isPlaying: boolean) => void;
  onTrackAAudioLevels: (levels: AudioLevels) => void;
  onTrackBAudioLevels: (levels: AudioLevels) => void;
  onTrackAFrequencyData: (data: Float32Array) => void;
  onTrackBFrequencyData: (data: Float32Array) => void;
  onTrackAStereoData: StereoDataHandler;
  onTrackBStereoData: StereoDataHandler;
  onDeckAVolumeChange: (volume: number) => void;
  onDeckBVolumeChange: (volume: number) => void;
  onDeckAMuteChange: (isMuted: boolean) => void;
  onDeckBMuteChange: (isMuted: boolean) => void;
  onDeckALoopChange: (isLooping: boolean) => void;
  onDeckBLoopChange: (isLooping: boolean) => void;
  onDeckATimeSeek: (time: number) => void;
  onDeckBTimeSeek: (time: number) => void;
  onToggleLinkedPlayback: () => void;
}

export function DeckAnalysisWorkspace({
  hasAnyAudio,
  hasBothAudio,
  trackA,
  trackB,
  waveformPlayerARef,
  waveformPlayerBRef,
  sidebarCollapsed,
  trackAAudioLevels,
  trackBAudioLevels,
  trackAFrequencyData,
  trackBFrequencyData,
  trackAStereoData,
  trackBStereoData,
  trackALeftSamples,
  trackARightSamples,
  trackBLeftSamples,
  trackBRightSamples,
  isTrackAPlaying,
  isTrackBPlaying,
  volumeA,
  volumeB,
  deckAVolume,
  deckBVolume,
  deckAMuted,
  deckBMuted,
  deckALooping,
  deckBLooping,
  isLinkedPlayback,
  isLinkPlaybackDisabled,
  onTrackAPlayStateChange,
  onTrackBPlayStateChange,
  onTrackAAudioLevels,
  onTrackBAudioLevels,
  onTrackAFrequencyData,
  onTrackBFrequencyData,
  onTrackAStereoData,
  onTrackBStereoData,
  onDeckAVolumeChange,
  onDeckBVolumeChange,
  onDeckAMuteChange,
  onDeckBMuteChange,
  onDeckALoopChange,
  onDeckBLoopChange,
  onDeckATimeSeek,
  onDeckBTimeSeek,
  onToggleLinkedPlayback,
}: DeckAnalysisWorkspaceProps) {
  if (!hasAnyAudio) return null;

  const compactClass = hasAnyAudio && !hasBothAudio;

  return (
    <>
      <section className={compactClass ? 'space-y-4' : 'space-y-6'}>
        <div className={`grid grid-cols-1 xl:grid-cols-2 transition-all duration-300 ${
          compactClass ? 'gap-3' : 'gap-6'
        }`}>
          <div className="relative min-h-[200px] rounded-xl transition-all duration-150">
            {trackA && (
              <WaveformPlayer
                ref={waveformPlayerARef}
                file={trackA}
                color="green"
                label="Deck A"
                onPlayStateChange={onTrackAPlayStateChange}
                onAudioLevels={onTrackAAudioLevels}
                onFrequencyData={onTrackAFrequencyData}
                onStereoData={onTrackAStereoData}
                crossfadeVolume={volumeA}
                deckVolume={deckAVolume}
                onDeckVolumeChange={onDeckAVolumeChange}
                isMuted={deckAMuted}
                onMuteChange={onDeckAMuteChange}
                isLooping={deckALooping}
                onLoopChange={onDeckALoopChange}
                isLinkedPlayback={isLinkedPlayback}
                isLinkPlaybackDisabled={isLinkPlaybackDisabled}
                onTimeSeek={onDeckATimeSeek}
                onToggleLinkedPlayback={onToggleLinkedPlayback}
              />
            )}
          </div>

          <div className="relative min-h-[200px] rounded-xl transition-all duration-150">
            {trackB && (
              <WaveformPlayer
                ref={waveformPlayerBRef}
                file={trackB}
                color="purple"
                label="Deck B"
                isSidebarCollapsed={sidebarCollapsed}
                onPlayStateChange={onTrackBPlayStateChange}
                onAudioLevels={onTrackBAudioLevels}
                onFrequencyData={onTrackBFrequencyData}
                onStereoData={onTrackBStereoData}
                crossfadeVolume={volumeB}
                deckVolume={deckBVolume}
                onDeckVolumeChange={onDeckBVolumeChange}
                isMuted={deckBMuted}
                onMuteChange={onDeckBMuteChange}
                isLooping={deckBLooping}
                onLoopChange={onDeckBLoopChange}
                isLinkedPlayback={isLinkedPlayback}
                isLinkPlaybackDisabled={isLinkPlaybackDisabled}
                onTimeSeek={onDeckBTimeSeek}
                onToggleLinkedPlayback={onToggleLinkedPlayback}
              />
            )}
          </div>
        </div>
      </section>

      <section className={compactClass ? 'space-y-2' : 'space-y-4'}>
        <div className={`grid grid-cols-1 md:grid-cols-2 transition-all duration-300 ${
          compactClass ? 'gap-3' : 'gap-6'
        }`}>
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
  );
}
