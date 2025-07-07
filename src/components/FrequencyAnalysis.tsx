import React, { useEffect, useRef, useState } from 'react';
import { BarChart } from 'lucide-react';

interface FrequencyAnalysisProps {
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
}

export function FrequencyAnalysis({ color, isActive, isPlaying }: FrequencyAnalysisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);

  const frequencyBands = [
    { name: 'Sub', range: '20-60Hz', color: '#ef4444' },
    { name: 'Bass', range: '60-250Hz', color: '#f97316' },
    { name: 'Low Mid', range: '250Hz-2kHz', color: '#eab308' },
    { name: 'High Mid', range: '2-6kHz', color: '#22c55e' },
    { name: 'Presence', range: '6-12kHz', color: '#3b82f6' },
    { name: 'Brilliance', range: '12-20kHz', color: '#8b5cf6' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!isActive) return;

    // Draw frequency grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (frequency)
    const frequencies = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    frequencies.forEach(freq => {
      const x = Math.log10(freq / 20) / Math.log10(1000) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Horizontal grid lines (dB)
    for (let i = 1; i < 8; i++) {
      const y = (i / 8) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw frequency response curve with fusion gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, color === 'green' ? '#10b981' : '#8b5cf6');
    gradient.addColorStop(0.5, '#059669'); // Teal middle
    gradient.addColorStop(1, color === 'green' ? '#8b5cf6' : '#10b981');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points = [];
    for (let x = 0; x < width; x++) {
      const freq = 20 * Math.pow(1000, x / width);
      let amplitude = 0;
      
      // Generate realistic frequency response (static when not playing)
      const variation = isPlaying ? Math.random() : 0.5; // Static variation when not playing
      
      if (freq < 100) {
        amplitude = variation * 0.3 - 0.4; // Slight low-end rolloff
      } else if (freq < 1000) {
        amplitude = variation * 0.2 - 0.1; // Relatively flat
      } else if (freq < 5000) {
        amplitude = variation * 0.3 + 0.1; // Slight presence boost
      } else {
        amplitude = variation * 0.4 - 0.2; // High frequency variation
      }
      
      const y = height/2 - (amplitude * height/4);
      points.push({ x, y });
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();

    // Add glow effect only when playing
    if (isPlaying) {
      ctx.shadowColor = color === 'green' ? '#10b981' : '#8b5cf6';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw frequency labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    
    frequencies.forEach(freq => {
      const x = Math.log10(freq / 20) / Math.log10(1000) * width;
      const label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
      ctx.fillText(label, x, height - 8);
    });

  }, [color, isActive, isPlaying]);

  const iconBgColor = {
    green: 'bg-emerald-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-5 h-5 ${iconBgColor[color]} rounded-lg shadow-lg`}></div>
            <BarChart className="absolute inset-0 m-auto text-white" size={12} />
          </div>
          <h3 className="text-base font-semibold text-audio-text">Frequency Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-audio-text-dim font-medium">1/3 Octave</span>
          <select className="glass-panel text-white text-xs rounded-xl px-3 py-1 font-mono border border-slate-600">
            <option>RTA</option>
            <option>FFT</option>
          </select>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={250}
        className="w-full h-48 bg-audio-bg rounded-2xl border border-slate-700/50 mb-6"
      />
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {frequencyBands.map((band) => (
          <button
            key={band.name}
            onClick={() => setSelectedBand(selectedBand === band.name ? null : band.name)}
            className={`p-4 rounded-2xl text-left transition-all duration-200 border ${
              selectedBand === band.name 
                ? 'glass-panel ring-2 ring-emerald-500 scale-105 border-emerald-500/50' 
                : 'glass-panel hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-purple-500/10 border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: band.color }}
              />
              <span className="text-sm font-semibold text-white">{band.name}</span>
            </div>
            <div className="text-xs text-audio-text-dim font-mono mb-1">{band.range}</div>
            <div className="text-sm text-emerald-400 font-mono font-bold">
              {(Math.random() * 10 - 5).toFixed(1)} dB
            </div>
          </button>
        ))}
      </div>

      {/* Playback Status Indicator */}
      {!isPlaying && isActive && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-audio-text-dim">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span>File Analysis • Press play for live spectrum</span>
          </div>
        </div>
      )}
    </div>
  );
}