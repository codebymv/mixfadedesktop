import type { ChangeEvent } from 'react';
import { Link as LinkIcon, Repeat } from 'lucide-react';
import { PlaybackControls } from './PlaybackControls';
import { VolumeControls } from './VolumeControls';
import type { WaveformPlayerConfig } from './waveformPlayerTypes';

interface WaveformPlayerHeaderProps {
  fileName: string;
  baseName: string;
  extension: string;
  isPlaying: boolean;
  canPlay: boolean;
  isLooping: boolean;
  isLinkedPlayback?: boolean;
  isLinkPlaybackDisabled?: boolean;
  crossfadeVolume: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  config: WaveformPlayerConfig;
  metadata: {
    formatTime: (time: number) => string;
  };
  onTogglePlayPause: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onToggleLinkedPlayback?: () => void;
}

export function WaveformPlayerHeader({
  fileName,
  baseName,
  extension,
  isPlaying,
  canPlay,
  isLooping,
  isLinkedPlayback,
  isLinkPlaybackDisabled,
  crossfadeVolume,
  volume,
  isMuted,
  currentTime,
  duration,
  config,
  metadata,
  onTogglePlayPause,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleLinkedPlayback
}: WaveformPlayerHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-3">
        <PlaybackControls
          isPlaying={isPlaying}
          canPlay={canPlay}
          onTogglePlayPause={onTogglePlayPause}
          config={config}
          crossfadeVolume={crossfadeVolume}
        />
        <h3 className={`text-lg font-semibold ${config.textColor} ${crossfadeVolume === 0 ? 'opacity-50' : ''} truncate flex-grow`} title={fileName}>
          {baseName}
        </h3>
        <div className={`text-[10px] font-bold font-mono px-2 py-1 rounded bg-slate-950/40 ${config.textColor} uppercase tracking-wider ml-auto`}>
          {extension}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onToggleLinkedPlayback && (
          <button
            onClick={onToggleLinkedPlayback}
            disabled={isLinkPlaybackDisabled}
            className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLinkedPlayback
                ? `${config.lightBgColor} ${config.textColor} ${config.borderColor} ${config.glowShadow}`
                : 'glass-panel text-audio-text-dim hover:text-white border-transparent hover:border-slate-600'
            }`}
            title={isLinkPlaybackDisabled ? 'Load tracks on both decks to link playback' : (isLinkedPlayback ? 'Unlink Decks' : 'Link Deck Playback')}
            style={{ outline: 'none', outlineWidth: 0 }}
          >
            <LinkIcon size={16} className={isLinkedPlayback ? '' : 'opacity-50'} />
          </button>
        )}

        <button
          onClick={onToggleLoop}
          className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center flex-shrink-0 ${
            isLooping
              ? `${config.lightBgColor} ${config.textColor} ${config.borderColor} ${config.glowShadow}`
              : 'glass-panel text-audio-text-dim hover:text-white border-transparent hover:border-slate-600'
          }`}
          title={isLooping ? 'Disable Loop' : 'Enable Loop'}
          style={{ outline: 'none', outlineWidth: 0 }}
        >
          <Repeat size={16} className={isLooping ? '' : 'opacity-50'} />
        </button>

        <div className="flex-grow flex items-center min-w-[60px]">
          <VolumeControls
            volume={volume}
            isMuted={isMuted}
            config={{
              waveColor: config.waveColor
            }}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />
        </div>

        <div className="text-xs text-audio-text-dim font-mono bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700 whitespace-nowrap ml-auto">
          {metadata.formatTime(currentTime)} / {metadata.formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
