import React, { useRef, useEffect } from 'react';

interface FrequencyVisualizerProps {
  frequencyData: Float32Array; // Array of frequency data (e.g., from AnalyserNode)
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}

export function FrequencyVisualizer({ frequencyData, isActive, isPlaying, crossfadeVolume = 1 }: FrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate frequency analysis metrics
  const calculateFrequencyMetrics = () => {
    if (!frequencyData || frequencyData.length === 0 || !isActive || !isPlaying) {
      return {
        bassEnergy: -60,
        midEnergy: -60,
        highEnergy: -60,
        peakFreq: 0,
        peakFreqBand: 'bass',
        spectralBalance: 'SILENT'
      };
    }

    const sampleRate = 48000;
    const nyquistFreq = sampleRate / 2;
    const freqResolution = nyquistFreq / frequencyData.length;

    // Use the same approach as the visual spectrum for consistency
    let bassMax = -Infinity, midMax = -Infinity, highMax = -Infinity;
    let bassSum = 0, midSum = 0, highSum = 0;
    let bassCount = 0, midCount = 0, highCount = 0;
    let peakMagnitude = -Infinity;
    let peakFreq = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * freqResolution;
      const magnitudeDb = frequencyData[i]; // Raw dB value from analyser

      // Track peak frequency
      if (magnitudeDb > peakMagnitude) {
        peakMagnitude = magnitudeDb;
        peakFreq = freq;
      }

      // Find maximum values in each band (like the visual does)
      // and also accumulate for averaging
      if (freq >= 20 && freq < 200) { // Bass
        bassMax = Math.max(bassMax, magnitudeDb);
        bassSum += magnitudeDb;
        bassCount++;
      } else if (freq >= 200 && freq < 2000) { // Mid  
        midMax = Math.max(midMax, magnitudeDb);
        midSum += magnitudeDb;
        midCount++;
      } else if (freq >= 2000 && freq <= nyquistFreq) { // High
        highMax = Math.max(highMax, magnitudeDb);
        highSum += magnitudeDb;
        highCount++;
      }
    }

    // Use a blend of maximum and average for more representative values
    const bassEnergy = bassCount > 0 ? Math.max(bassMax, bassSum / bassCount) : -60;
    const midEnergy = midCount > 0 ? Math.max(midMax, midSum / midCount) : -60;
    const highEnergy = highCount > 0 ? Math.max(highMax, highSum / highCount) : -60;

    // Determine which frequency band the peak belongs to
    let peakFreqBand = 'bass';
    if (peakFreq >= 200 && peakFreq < 2000) {
      peakFreqBand = 'mid';
    } else if (peakFreq >= 2000 && peakFreq < 8000) {
      peakFreqBand = 'upperMid';
    } else if (peakFreq >= 8000) {
      peakFreqBand = 'high';
    }

    // Determine spectral balance
    let spectralBalance = 'BALANCED';
    const bassToHigh = bassEnergy - highEnergy;
    if (bassToHigh > 6) spectralBalance = 'BASS-HEAVY';
    else if (bassToHigh < -6) spectralBalance = 'BRIGHT';

    return {
      bassEnergy: Math.max(-60, bassEnergy),
      midEnergy: Math.max(-60, midEnergy), 
      highEnergy: Math.max(-60, highEnergy),
      peakFreq: Math.round(peakFreq),
      peakFreqBand,
      spectralBalance
    };
  };

  const metrics = calculateFrequencyMetrics();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!isActive || !isPlaying || frequencyData.length === 0) {
      return;
    }

    // Professional audio frequency analysis constants
    const sampleRate = 48000; // Assume 48kHz sample rate (standard for professional audio)
    const nyquistFreq = sampleRate / 2; // 24kHz max frequency
    const minFreq = 20; // 20Hz minimum
    const maxFreq = 20000; // 20kHz maximum
    
    // Calculate frequency resolution of the FFT data
    const freqResolution = nyquistFreq / frequencyData.length;
    
    // Professional frequency markers for logarithmic scale
    const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    
    // Convert frequency to logarithmic position (0-1)
    const freqToLogPosition = (freq: number): number => {
      return Math.log10(Math.max(freq, minFreq) / minFreq) / Math.log10(maxFreq / minFreq);
    };
    
    // Draw frequency analysis with logarithmic scaling
    const numBars = Math.floor(width / 2); // 2 pixels per bar for smooth rendering
    
    for (let i = 0; i < numBars; i++) {
      // Calculate the frequency range for this bar (logarithmic distribution)
      const leftPos = i / numBars;
      const rightPos = (i + 1) / numBars;
      
      // Convert positions back to frequencies
      const leftFreq = minFreq * Math.pow(maxFreq / minFreq, leftPos);
      const rightFreq = minFreq * Math.pow(maxFreq / minFreq, rightPos);
      
      // Find corresponding FFT bins
      const leftBin = Math.floor(leftFreq / freqResolution);
      const rightBin = Math.floor(rightFreq / freqResolution);
      
      // Average the magnitude across the frequency range for this bar
      let avgMagnitude = 0;
      let binCount = 0;
      
      for (let bin = leftBin; bin <= Math.min(rightBin, frequencyData.length - 1); bin++) {
        if (bin >= 0 && bin < frequencyData.length) {
          avgMagnitude += frequencyData[bin];
          binCount++;
        }
      }
      
      if (binCount > 0) {
        avgMagnitude /= binCount;
      }
      
      // Convert dB to normalized height (professional dB range: -60dB to 0dB)
      const dbValue = avgMagnitude;
      const normalizedHeight = Math.max(0, Math.min(1, (dbValue + 60) / 60));
      const barHeight = normalizedHeight * height;
      
      // Professional color coding based on frequency ranges
      let color;
      const centerFreq = Math.sqrt(leftFreq * rightFreq); // Geometric mean
      
      if (centerFreq < 200) {
        // Sub-bass and bass: Red
        color = `hsl(0, 100%, ${50 + normalizedHeight * 30}%)`;
      } else if (centerFreq < 2000) {
        // Midrange: Orange to Yellow
        const hue = 15 + (Math.log10(centerFreq / 200) / Math.log10(10)) * 45; // 15° to 60°
        color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
      } else if (centerFreq < 8000) {
        // Upper midrange: Yellow to Green
        const hue = 60 + (Math.log10(centerFreq / 2000) / Math.log10(4)) * 60; // 60° to 120°
        color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
      } else {
        // Treble: Blue to Purple
        const hue = 200 + (Math.log10(centerFreq / 8000) / Math.log10(2.5)) * 80; // 200° to 280°
        color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
      }
      
      ctx.fillStyle = color;
      
      // Draw the bar
      const barX = i * (width / numBars);
      const barWidth = Math.ceil(width / numBars);
      
      ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
    }
    
    // Draw frequency grid lines for reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    freqMarkers.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = freqToLogPosition(freq) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });
    
  }, [frequencyData, isActive, isPlaying]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with frequency analysis metrics */}
      <div className="flex items-center justify-between mb-2 text-xs font-mono">
        <div className="text-audio-text-dim">
          Peak: <span className={`font-bold ${
            metrics.peakFreqBand === 'bass' ? 'text-red-400' :
            metrics.peakFreqBand === 'mid' ? 'text-orange-400' :
            metrics.peakFreqBand === 'upperMid' ? 'text-green-400' :
            metrics.peakFreqBand === 'high' ? 'text-purple-400' :
            'text-white'
          }`}>{metrics.peakFreq >= 1000 ? `${(metrics.peakFreq/1000).toFixed(1)}k` : `${metrics.peakFreq}`}</span> Hz
        </div>
        <div className="text-audio-text-dim">
          Bass: <span className="text-white font-bold">{metrics.bassEnergy.toFixed(1)}</span> dB
        </div>
        <div className="text-audio-text-dim">
          Mid: <span className="text-white font-bold">{metrics.midEnergy.toFixed(1)}</span> dB
        </div>
        {typeof crossfadeVolume === 'number' && crossfadeVolume < 1 && (
          <div className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent font-bold">
            X-FADE: {Math.round(crossfadeVolume * 100)}%
          </div>
        )}
        <div className="text-audio-text-dim">
          High: <span className="text-white font-bold">{metrics.highEnergy.toFixed(1)}</span> dB
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 space-y-3">
        <div className="bg-slate-800 rounded-2xl overflow-hidden" style={{ height: '120px' }}>
          <canvas ref={canvasRef} className="bg-slate-900 w-full h-full block"></canvas>
        </div>
      </div>
      
      {/* Footer scale */}
      <div className="flex justify-between text-xs text-audio-text-dim mt-2 font-mono relative">
        <span>20</span>
        <span>50</span>
        <span>100</span>
        <span>500</span>
        <span>1k</span>
        <span>5k</span>
        <span>10k</span>
        <span className="text-white font-bold">20k</span>
      </div>
      
      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-audio-text-dim">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-red-500 rounded"></div>
              <span>Bass</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded"></div>
              <span>Mid</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-gradient-to-r from-yellow-500 to-green-500 rounded"></div>
              <span>Upper Mid</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              <span>Highs</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${
            crossfadeVolume === 0 ? 'text-red-400' :
            isPlaying ? 'text-green-400' : 'text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              crossfadeVolume === 0 ? 'bg-red-500' :
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
            }`}></div>
            <span className="font-mono">
              {crossfadeVolume === 0 ? 'MUTED' :
               isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
