import React, { useRef, useEffect } from 'react';
import { WaveformConfig } from '../../hooks/useWaveform';

interface WaveformDisplayProps {
  isLoading: boolean;
  config: WaveformConfig;
  currentTime: number;
  duration: number;
  crossfadeVolume: number;
  onWaveformClick: (clickTime: number) => void;
  canPlay: boolean;
  waveformHook: {
    drawWaveforms: (leftCanvas: HTMLCanvasElement | null, rightCanvas: HTMLCanvasElement | null, config: WaveformConfig, currentTime: number, duration: number, crossfadeVolume: number) => void;
    hasWaveformData: () => boolean;
  };
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  isLoading,
  config,
  currentTime,
  duration,
  crossfadeVolume,
  onWaveformClick,
  canPlay,
  waveformHook
}) => {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const { drawWaveforms, hasWaveformData } = waveformHook;

  // Redraw waveforms when time or other properties change
  useEffect(() => {
    if (!isLoading && hasWaveformData()) {
      drawWaveforms(
        leftCanvasRef.current,
        rightCanvasRef.current,
        config,
        currentTime,
        duration,
        crossfadeVolume
      );
    }
  }, [currentTime, duration, crossfadeVolume, config, isLoading, drawWaveforms, hasWaveformData]);

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration || !canPlay) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    
    onWaveformClick(clickTime);
  };

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-audio-bg rounded-2xl border border-slate-700/50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-audio-text-dim">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading stereo waveforms...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Left Channel Waveform */}
      <canvas
        ref={leftCanvasRef}
        width={800}
        height={60}
        className="w-full h-16 bg-audio-bg rounded-t-2xl border border-b-0 border-slate-700/50 cursor-pointer hover:border-slate-600 transition-colors"
        onClick={handleWaveformClick}
      />
      {/* Right Channel Waveform */}
      <canvas
        ref={rightCanvasRef}
        width={800}
        height={60}
        className="w-full h-16 bg-audio-bg rounded-b-2xl border border-t-0 border-slate-700/50 cursor-pointer hover:border-slate-600 transition-colors"
        onClick={handleWaveformClick}
      />
    </>
  );
};