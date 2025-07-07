import React, { useEffect, useRef } from 'react';
import { Waves } from 'lucide-react';

interface SpectrogramProps {
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
}

export function Spectrogram({ color, isActive, isPlaying }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Generate mock spectrogram data
    
    // Create time-based spectrogram
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const frequency = (height - y) / height;
        const time = x / width;
        
        // Create realistic frequency distribution (static when not playing)
        let intensity = 0;
        const variation = isPlaying ? Math.random() : 0.5; // Static variation when not playing
        
        if (frequency < 0.1) { // Low frequencies
          intensity = variation * 0.8 * Math.sin(time * Math.PI * 4);
        } else if (frequency < 0.3) { // Mid frequencies
          intensity = variation * 0.6 * Math.sin(time * Math.PI * 8);
        } else if (frequency < 0.7) { // High-mid frequencies
          intensity = variation * 0.4 * Math.sin(time * Math.PI * 12);
        } else { // High frequencies
          intensity = variation * 0.2 * Math.sin(time * Math.PI * 16);
        }
        
        intensity = Math.max(0, intensity);
        
        // Reduce intensity when not playing
        if (!isPlaying) {
          intensity *= 0.6;
        }
        
        if (color === 'green') {
          data[index] = 16 * intensity; // R
          data[index + 1] = 185 * intensity; // G
          data[index + 2] = 129 * intensity; // B
        } else {
          data[index] = 139 * intensity; // R
          data[index + 1] = 92 * intensity; // G
          data[index + 2] = 246 * intensity; // B
        }
        data[index + 3] = intensity * 255; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Draw frequency grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    const frequencies = [0.1, 0.2, 0.4, 0.6, 0.8];
    frequencies.forEach(freq => {
      const y = height - (freq * height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    // Draw time grid lines
    for (let i = 1; i < 8; i++) {
      const x = (i / 8) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

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
            <Waves className="absolute inset-0 m-auto text-white" size={12} />
          </div>
          <h3 className="text-base font-semibold text-audio-text">Spectrogram</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-audio-text-dim">
          <span className="font-mono">22kHz</span>
          <div className="w-6 h-3 bg-gradient-to-t from-slate-700 to-slate-400 rounded-lg"></div>
          <span className="font-mono">0Hz</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={250}
        className="w-full h-48 bg-audio-bg rounded-2xl border border-slate-700/50"
      />
      <div className="flex justify-between text-xs text-audio-text-dim mt-3 font-mono">
        <span>0s</span>
        <span>Time →</span>
        <span>Duration</span>
      </div>

      {/* Playback Status Indicator */}
      {!isPlaying && isActive && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-audio-text-dim">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span>File Analysis • Press play for live spectrogram</span>
          </div>
        </div>
      )}
    </div>
  );
}