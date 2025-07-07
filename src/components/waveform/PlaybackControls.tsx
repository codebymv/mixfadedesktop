import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  canPlay: boolean;
  crossfadeVolume: number;
  config: {
    bgColor: string;
    hoverColor: string;
  };
  onTogglePlayPause: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  canPlay,
  crossfadeVolume,
  config,
  onTogglePlayPause
}) => {
  return (
    <div className="flex items-center">
      <button
        onClick={onTogglePlayPause}
        className={`p-3 rounded-2xl transition-all duration-200 ${config.bgColor} ${config.hoverColor} text-white shadow-lg neon-glow-fusion disabled:opacity-50 disabled:cursor-not-allowed ${
          crossfadeVolume === 0 ? 'opacity-60' : ''
        }`}
        disabled={!canPlay}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
    </div>
  );
};