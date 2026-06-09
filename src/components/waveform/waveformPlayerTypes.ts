import type { AudioLevels, StereoAnalysis } from '../../utils/audioAnalysis';
import type { AudioContextNodes } from '../../hooks/useAudioContext';

export interface WaveformPlayerProps {
  file: File;
  color: 'green' | 'purple';
  label: string;
  isSidebarCollapsed?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onAudioLevels?: (levels: AudioLevels) => void;
  onFrequencyData?: (data: Float32Array) => void;
  onStereoData?: (data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => void;
  crossfadeVolume?: number;
  deckVolume?: number;
  onDeckVolumeChange?: (volume: number) => void;
  isMuted?: boolean;
  onMuteChange?: (isMuted: boolean) => void;
  isLooping?: boolean;
  onLoopChange?: (isLooping: boolean) => void;
  isLinkedPlayback?: boolean;
  isLinkPlaybackDisabled?: boolean;
  onTimeSeek?: (time: number) => void;
  onToggleLinkedPlayback?: () => void;
}

export interface WaveformPlayerRef {
  togglePlayPause: () => void;
  play: () => void;
  pause: () => void;
  setCurrentTime: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  setVolume: (vol: number) => void;
  getVolume: () => number;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  setLoop: (looping: boolean) => void;
  getLoop: () => boolean;
  getAudioNodes: () => AudioContextNodes;
}

export interface WaveformPlayerConfig {
  waveColor: string;
  bgColor: string;
  lightBgColor: string;
  hoverColor: string;
  textColor: string;
  borderColor: string;
  glowShadow: string;
}
