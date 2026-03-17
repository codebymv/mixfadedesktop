import { useRef, useCallback } from 'react';

export interface WaveformConfig {
  waveColor: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
}

export const useWaveform = () => {
  const leftWaveformData = useRef<Float32Array | null>(null);
  const rightWaveformData = useRef<Float32Array | null>(null);

  // Generate separate L/R waveform data from audio buffer
  const generateStereoWaveformData = useCallback(async (audioBuffer: AudioBuffer) => {
    const width = 800;
    const samples = audioBuffer.length;
    const samplesPerPixel = Math.floor(samples / width);
    
    // Get channel data
    const leftChannelData = audioBuffer.getChannelData(0);
    const rightChannelData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannelData;
    
    // Process left channel
    const leftProcessedData = new Float32Array(width * 2);
    // Optimization: Don't read every single sample if there are too many per pixel
    const step = Math.max(1, Math.floor(samplesPerPixel / 100)); 

    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, samples);
      
      let min = 0;
      let max = 0;
      
      // Use the step size to skip samples, drastically reducing iterations on long files
      for (let i = startSample; i < endSample; i += step) {
        const sample = leftChannelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      leftProcessedData[x * 2] = min;
      leftProcessedData[x * 2 + 1] = max;
    }
    
    // Process right channel
    const rightProcessedData = new Float32Array(width * 2);
    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, samples);
      
      let min = 0;
      let max = 0;
      
      for (let i = startSample; i < endSample; i += step) {
        const sample = rightChannelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      rightProcessedData[x * 2] = min;
      rightProcessedData[x * 2 + 1] = max;
    }
    
    leftWaveformData.current = leftProcessedData;
    rightWaveformData.current = rightProcessedData;
    

    
    return { leftProcessedData, rightProcessedData };
  }, []);

  // Draw waveform on canvas for a specific channel
  const drawChannelWaveform = useCallback((
    canvas: HTMLCanvasElement, 
    waveformData: Float32Array, 
    channelLabel: string,
    config: WaveformConfig,
    currentTime: number,
    duration: number,
    crossfadeVolume: number
  ) => {
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Create gradient with crossfade opacity
    const opacity = crossfadeVolume === 0 ? 0.1 : Math.max(0.3, crossfadeVolume || 1);
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, config.waveColor + Math.round(opacity * 64).toString(16).padStart(2, '0'));
    fillGradient.addColorStop(0.5, config.waveColor + Math.round(opacity * 32).toString(16).padStart(2, '0'));
    fillGradient.addColorStop(1, config.waveColor + Math.round(opacity * 64).toString(16).padStart(2, '0'));

    // Draw waveform
    ctx.strokeStyle = config.waveColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1.5;
    ctx.fillStyle = fillGradient;

    // Draw positive peaks
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const max = waveformData[x * 2 + 1];
      const y = centerY - (max * centerY * 0.9);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Fill area
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const max = waveformData[x * 2 + 1];
      const y = centerY - (max * centerY * 0.9);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    for (let x = width - 1; x >= 0; x--) {
      const min = waveformData[x * 2];
      const y = centerY - (min * centerY * 0.9);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw playback position
    if (duration > 0 && currentTime > 0) {
      const playbackX = (currentTime / duration) * width;
      ctx.strokeStyle = crossfadeVolume === 0 ? '#ffffff40' : '#ffffff';
      ctx.lineWidth = 2;
      if (crossfadeVolume > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.moveTo(playbackX, 0);
      ctx.lineTo(playbackX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw channel label
    ctx.fillStyle = crossfadeVolume === 0 ? '#ffffff40' : '#ffffff80';
    ctx.font = 'bold 12px Inter';
    ctx.fillText(channelLabel, 8, 20);
  }, []);

  // Draw both waveforms
  const drawWaveforms = useCallback((
    leftCanvas: HTMLCanvasElement | null,
    rightCanvas: HTMLCanvasElement | null,
    config: WaveformConfig,
    currentTime: number,
    duration: number,
    crossfadeVolume: number
  ) => {

    if (leftCanvas && leftWaveformData.current) {
      drawChannelWaveform(leftCanvas, leftWaveformData.current, 'L', config, currentTime, duration, crossfadeVolume);
    }
    if (rightCanvas && rightWaveformData.current) {
      drawChannelWaveform(rightCanvas, rightWaveformData.current, 'R', config, currentTime, duration, crossfadeVolume);
    }
  }, [drawChannelWaveform]);

  const hasWaveformData = useCallback(() => {
    const hasData = leftWaveformData.current !== null && rightWaveformData.current !== null;

    return hasData;
  }, []);

  const clearWaveformData = useCallback(() => {
    leftWaveformData.current = null;
    rightWaveformData.current = null;
  }, []);

  return {
    generateStereoWaveformData,
    drawWaveforms,
    hasWaveformData,
    clearWaveformData
  };
};