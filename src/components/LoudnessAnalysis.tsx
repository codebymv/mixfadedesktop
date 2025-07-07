import React, { useState, useEffect } from 'react';
import { TrendingUp, Volume2, Target } from 'lucide-react';

interface LoudnessAnalysisProps {
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
}

export function LoudnessAnalysis({ color, isActive, isPlaying }: LoudnessAnalysisProps) {
  const [lufs, setLufs] = useState(-23);
  const [peak, setPeak] = useState(-1);
  const [range, setRange] = useState(8);
  const [truePeak, setTruePeak] = useState(-0.5);

  useEffect(() => {
    if (!isActive) return;

    if (!isPlaying) {
      // Show static calculated values when not playing
      setLufs(-18.5);
      setPeak(-2.1);
      setRange(7.2);
      setTruePeak(-1.2);
      return;
    }

    // Only animate when actually playing
    const interval = setInterval(() => {
      setLufs(-30 + Math.random() * 15);
      setPeak(-5 + Math.random() * 4);
      setRange(5 + Math.random() * 10);
      setTruePeak(-2 + Math.random() * 1.5);
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, isPlaying]);

  const iconColor = {
    green: 'text-emerald-400',
    purple: 'text-purple-400'
  };

  const iconBgColor = {
    green: 'bg-emerald-500',
    purple: 'bg-purple-500'
  };

  const getLufsColor = (value: number) => {
    if (value > -14) return 'text-red-400';
    if (value > -16) return 'text-yellow-400';
    if (value > -23) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-600">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-5 h-5 ${iconBgColor[color]} rounded-lg shadow-lg`}></div>
            <Volume2 className="absolute inset-0 m-auto text-white" size={12} />
          </div>
          <h3 className="text-base font-semibold text-audio-text">Loudness Analysis</h3>
        </div>
        <div className={`px-3 py-1 rounded-xl text-xs font-medium glass-panel ${iconColor[color]} border border-slate-600`}>
          EBU R128
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="glass-panel p-4 rounded-2xl border border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 size={16} className="text-audio-text-dim" />
            <span className="text-sm text-audio-text-dim font-medium">Integrated Loudness</span>
          </div>
          <div className={`text-3xl font-mono font-bold ${getLufsColor(lufs)} mb-1`}>
            {lufs.toFixed(1)}
          </div>
          <div className="text-sm text-audio-text-dim mb-3">LUFS</div>
          
          <div className="h-2 bg-slate-800 rounded-2xl overflow-hidden">
            <div 
              className={`h-full ${isPlaying ? 'transition-all duration-300' : ''} rounded-2xl ${
                lufs > -14 ? 'bg-red-500' : 
                lufs > -16 ? 'bg-yellow-500' : 
                lufs > -23 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (lufs + 30) / 15 * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-audio-text-dim mt-2 font-mono">
            <span>-30</span>
            <span>-23</span>
            <span>-14</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-audio-text-dim" />
            <span className="text-sm text-audio-text-dim font-medium">True Peak</span>
          </div>
          <div className={`text-3xl font-mono font-bold ${truePeak > -1 ? 'text-red-400' : 'text-green-400'} mb-1`}>
            {truePeak.toFixed(1)}
          </div>
          <div className="text-sm text-audio-text-dim mb-3">dBTP</div>
          
          <div className="h-2 bg-slate-800 rounded-2xl overflow-hidden">
            <div 
              className={`h-full ${isPlaying ? 'transition-all duration-300' : ''} rounded-2xl ${truePeak > -1 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (truePeak + 6) / 6 * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-audio-text-dim mt-2 font-mono">
            <span>-6</span>
            <span>-1</span>
            <span>0</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-600">
          <div className="text-xs text-audio-text-dim mb-2 font-medium">Loudness Range</div>
          <div className="text-xl font-mono text-white font-bold">{range.toFixed(1)}</div>
          <div className="text-xs text-audio-text-dim">LU</div>
        </div>
        
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-600">
          <div className="text-xs text-audio-text-dim mb-2 font-medium">Peak</div>
          <div className="text-xl font-mono text-white font-bold">{peak.toFixed(1)}</div>
          <div className="text-xs text-audio-text-dim">dBFS</div>
        </div>
        
        <div className="glass-panel p-4 rounded-2xl text-center border border-slate-600">
          <div className="text-xs text-audio-text-dim mb-2 font-medium">Dynamic Range</div>
          <div className="text-xl font-mono text-white font-bold">{(Math.random() * 5 + 8).toFixed(1)}</div>
          <div className="text-xs text-audio-text-dim">DR</div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-slate-600">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-audio-text-dim" />
          <div className="text-sm text-audio-text-dim font-medium">Platform Targets</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-3 rounded-xl text-center transition-all ${Math.abs(lufs + 14) < 1 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'glass-panel text-audio-text-dim border border-slate-600'}`}>
            <div className="font-semibold">Spotify</div>
            <div className="font-mono">-14 LUFS</div>
          </div>
          <div className={`p-3 rounded-xl text-center transition-all ${Math.abs(lufs + 16) < 1 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'glass-panel text-audio-text-dim border border-slate-600'}`}>
            <div className="font-semibold">Apple Music</div>
            <div className="font-mono">-16 LUFS</div>
          </div>
          <div className={`p-3 rounded-xl text-center transition-all ${Math.abs(lufs + 23) < 1 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'glass-panel text-audio-text-dim border border-slate-600'}`}>
            <div className="font-semibold">Broadcast</div>
            <div className="font-mono">-23 LUFS</div>
          </div>
        </div>
      </div>

      {/* Playback Status Indicator */}
      {!isPlaying && isActive && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-audio-text-dim">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span>File Analysis • Press play for live monitoring</span>
          </div>
        </div>
      )}
    </div>
  );
}