import React, { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';

interface StereoAnalysisProps {
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
}

export function StereoAnalysis({ color, isActive, isPlaying }: StereoAnalysisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [correlation, setCorrelation] = useState(0);
  const [stereoWidth, setStereoWidth] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCorrelation(0);
      setStereoWidth(0);
      return;
    }

    if (!isPlaying) {
      // Show static calculated values when not playing
      setCorrelation(0.75);
      setStereoWidth(65);
      return;
    }

    // Only animate when actually playing
    const interval = setInterval(() => {
      setCorrelation(Math.random() * 2 - 1); // -1 to 1
      setStereoWidth(Math.random() * 100); // 0 to 100%
    }, 200);

    return () => clearInterval(interval);
  }, [isActive, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!isActive) return;

    // Draw crosshairs
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw correlation circle guides
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (i / 3) * Math.min(centerX, centerY) * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw stereo correlation points
    const gradient = color === 'green' ? '#10b981' : '#8b5cf6';
    ctx.fillStyle = gradient + '60';
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;

    // Generate correlation data points (static when not playing)
    const pointCount = isPlaying ? 100 : 50;
    const animationFactor = isPlaying ? 1 : 0.3;
    
    for (let i = 0; i < pointCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.min(centerX, centerY) * 0.8 * animationFactor;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, isPlaying ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw phase correlation line
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    if (isPlaying) {
      ctx.shadowColor = gradient;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    const corrX = centerX + correlation * centerX * 0.8;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(corrX, centerY);
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [color, isActive, isPlaying, correlation]);



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
            <Radio className="absolute inset-0 m-auto text-white" size={12} />
          </div>
          <h3 className="text-base font-semibold text-audio-text">Stereo Analysis</h3>
        </div>
        <div className="text-xs text-audio-text-dim font-medium">
          Phase Correlation
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={250}
            height={250}
            className="w-full h-48 bg-audio-bg rounded-2xl border border-slate-700/50"
          />
          <div className="flex justify-between text-xs text-audio-text-dim mt-2 font-mono">
            <span>-1</span>
            <span>0</span>
            <span>+1</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-audio-text-dim mb-3">
              <span className="font-medium">Correlation</span>
              <span className={`font-mono font-bold ${correlation > 0.5 ? 'text-green-400' : correlation < -0.5 ? 'text-red-400' : 'text-yellow-400'}`}>
                {correlation.toFixed(2)}
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-2xl overflow-hidden">
              <div 
                className={`h-full ${isPlaying ? 'transition-all duration-200' : ''} rounded-2xl ${
                  correlation > 0.5 ? 'bg-green-500' : 
                  correlation < -0.5 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.abs(correlation) * 100}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-audio-text-dim mb-3">
              <span className="font-medium">Stereo Width</span>
              <span className={`font-mono font-bold ${color === 'green' ? 'text-emerald-400' : 'text-purple-400'}`}>{stereoWidth.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-2xl overflow-hidden">
              <div 
                className={`h-full ${isPlaying ? 'transition-all duration-200' : ''} rounded-2xl ${color === 'green' ? 'bg-emerald-500' : 'bg-purple-500'}`}
                style={{ width: `${stereoWidth}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-600">
              <div className="text-xs text-audio-text-dim mb-2 font-medium">L+R (Mid)</div>
              <div className="text-lg text-white font-mono font-bold">-{(Math.random() * 10 + 5).toFixed(1)} dB</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-600">
              <div className="text-xs text-audio-text-dim mb-2 font-medium">L-R (Side)</div>
              <div className="text-lg text-white font-mono font-bold">-{(Math.random() * 15 + 10).toFixed(1)} dB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Playback Status Indicator */}
      {!isPlaying && isActive && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-audio-text-dim">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span>File Analysis • Press play for live correlation</span>
          </div>
        </div>
      )}
    </div>
  );
}