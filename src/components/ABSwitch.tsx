import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ABSwitchProps {
  activeTrack: 'A' | 'B' | 'both';
  onSwitch: (track: 'A' | 'B' | 'both') => void;
  isTransitioning?: boolean;
  volumeA?: number;
  volumeB?: number;
  crossfadeDirection?: 'A→B' | 'B→A' | null;
}

export function ABSwitch({ 
  activeTrack,
  onSwitch, 
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0,
  crossfadeDirection = null
}: ABSwitchProps) {
  
  // Determine which track is currently dominant
  const getDominantTrack = () => {
    if (volumeA > volumeB) return 'A';
    if (volumeB > volumeA) return 'B';
    return 'both';
  };

  // Use activeTrack when not transitioning, volume-based logic during transitions
  const dominantTrack = isTransitioning ? getDominantTrack() : activeTrack;

  return (
    <div className="glass-panel rounded-3xl p-4 border border-slate-600 w-full">
      <div className="flex items-stretch justify-between gap-2">
        <button
          onClick={() => onSwitch('A')}
          className={`flex-grow h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-lg font-bold relative overflow-hidden ${
            dominantTrack === 'A' && !isTransitioning
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white neon-glow-fusion scale-110 shadow-lg'
              : 'glass-panel border-slate-600 text-audio-text-dim hover:border-emerald-500 hover:text-white hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-purple-500/10'
          }`}
          style={{ outline: 'none', outlineWidth: 0 }}
          disabled={isTransitioning}
        >
          A
          {/* Volume indicator overlay */}
          {isTransitioning && (
            <div 
              className="absolute bottom-0 left-0 bg-emerald-500/30 transition-all duration-100"
              style={{ 
                height: `${volumeA * 100}%`,
                width: '100%'
              }}
            />
          )}
        </button>
        
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onSwitch('both')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-1 border relative text-xs ${
              isTransitioning
                ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white shadow-lg neon-glow-fusion border-transparent animate-pulse'
                : 'glass-panel text-audio-text-dim hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-purple-500/20 hover:text-white border-slate-600 hover:border-transparent'
            }`}
            style={{ outline: 'none', outlineWidth: 0 }}
            disabled={isTransitioning}
          >
            {isTransitioning ? (
              <>
                <ArrowLeftRight size={12} className="animate-pulse" />
                <span className="font-mono text-xs">
                  {crossfadeDirection || 'A→B'}
                </span>
              </>
            ) : (
              <>
                <ArrowLeftRight size={12} />
                <span className="font-mono text-xs">
                  {activeTrack === 'B' ? 'B→A' : 'A→B'}
                </span>
              </>
            )}
          </button>
          <div className="text-xs text-audio-text-dim font-medium tracking-wider uppercase">
            Crossfade
          </div>
        </div>
        
        <button
          onClick={() => onSwitch('B')}
          className={`flex-grow h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-lg font-bold relative overflow-hidden ${
            dominantTrack === 'B' && !isTransitioning
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 text-white neon-glow-fusion scale-110 shadow-lg'
              : 'glass-panel border-slate-600 text-audio-text-dim hover:border-purple-500 hover:text-white hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-purple-500/10'
          }`}
          style={{ outline: 'none', outlineWidth: 0 }}
          disabled={isTransitioning}
        >
          B
          {/* Volume indicator overlay */}
          {isTransitioning && (
            <div 
              className="absolute bottom-0 left-0 bg-purple-500/30 transition-all duration-100"
              style={{ 
                height: `${volumeB * 100}%`,
                width: '100%'
              }}
            />
          )}
        </button>
      </div>
      
      {/* Real-time volume display during transition */}
      
    </div>
  );
}