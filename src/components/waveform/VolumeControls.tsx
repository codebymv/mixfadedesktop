import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeControlsProps {
  volume: number;
  isMuted: boolean;
  config: {
    waveColor: string;
  };
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
}

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  volume,
  isMuted,
  config,
  onVolumeChange,
  onToggleMute
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={onToggleMute}
        className="p-2 glass-panel rounded-xl hover:bg-gradient-to-br hover:from-[var(--theme-deck-a-base)]/20 hover:to-[var(--theme-deck-b-base)]/20 transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 hover:border-transparent flex-shrink-0"
      >
        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      
      <div className="flex items-center gap-3 flex-grow">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={onVolumeChange}
          className="flex-grow min-w-[60px] h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${config.waveColor} 0%, ${config.waveColor} ${(isMuted ? 0 : volume) * 100}%, #334155 ${(isMuted ? 0 : volume) * 100}%, #334155 100%)`
          }}
        />
        <span className="text-xs text-audio-text-dim font-mono w-10 text-right flex-shrink-0">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
  );
};