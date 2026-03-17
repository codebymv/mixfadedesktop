import React, { useRef, useEffect, useState } from 'react';
import { StereoAnalysis, StereoAverager } from '../utils/audioAnalysis';
import { getStereoCorrelationColor, getStereoWidthColor, getLRBalanceColor, formatBalanceLabel, formatDb, formatMixPercent, formatSignedCorrelation, formatStereoWidth, formatMonoCompatibilityLabel, getLevelColor, getLevelBgColor, getMixToneClass, getMonoCompatibilityToneClass, linearToDb } from '../utils/analysisFormatters';
import { InsightMetricCard } from './analysis/InsightMetricCard';

interface StereoAnalyzerProps {
  stereoData: StereoAnalysis;
  leftSamples?: Float32Array;    // NEW: Real-time left channel samples
  rightSamples?: Float32Array;   // NEW: Real-time right channel samples
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}

export function StereoAnalyzer({ 
  stereoData, 
  leftSamples,
  rightSamples,
  isActive, 
  isPlaying, 
  crossfadeVolume = 1 
}: StereoAnalyzerProps) {
  const vectorscopeRef = useRef<HTMLCanvasElement>(null);
  const samplesBuffer = useRef<Array<{x: number, y: number, age: number}>>([]);
  const maxSamples = 200; // Professional vectorscope sample count
  
  // Separate instant and smoothed values (like LevelMeter)
  const [instantData, setInstantData] = useState<StereoAnalysis>({
    phaseCorrelation: 0,
    stereoWidth: 0,
    balance: 0,
    midLevel: 0,
    sideLevel: 0,
    midLufs: -70,
    sideLufs: -70,
    monoCompatibility: 'EXCELLENT'
  });

  const [displayData, setDisplayData] = useState<StereoAnalysis>({
    phaseCorrelation: 0,
    stereoWidth: 0,
    balance: 0,
    midLevel: 0,
    sideLevel: 0,
    midLufs: -70,
    sideLufs: -70,
    monoCompatibility: 'EXCELLENT'
  });

  // Stereo averaging instance
  const stereoAverager = useRef<StereoAverager | null>(null);

  // Initialize stereo averager
  useEffect(() => {
    if (!stereoAverager.current) {
      // 300ms window, update every 50ms for smooth but readable values
      stereoAverager.current = new StereoAverager(300, 50);
    }
  }, []);

  // Reset averager when playback stops
  useEffect(() => {
    if (!isPlaying && stereoAverager.current) {
      stereoAverager.current.reset();
    }
  }, [isPlaying]);

  // Update stereo data from real audio analysis
  useEffect(() => {
    if (!isActive) {
      const neutralData = {
        phaseCorrelation: 0,
        stereoWidth: 0,
        balance: 0,
        midLevel: 0,
        sideLevel: 0,
        midLufs: -70,
        sideLufs: -70,
        monoCompatibility: 'EXCELLENT' as const
      };
      setInstantData(neutralData);
      setDisplayData(neutralData);
      return;
    }

    if (stereoData && isPlaying) {
      // Update instant data (used for vectorscope responsiveness)
      setInstantData(stereoData);
      
      // Add to stereo averager and update smoothed values for display
      if (stereoAverager.current) {
        const shouldUpdate = stereoAverager.current.addSample(stereoData);
        
        if (shouldUpdate) {
          const smoothed = stereoAverager.current.getSmoothedValues();
          setDisplayData(smoothed);
        }
      }
    } else {
      // When not playing, show zero values
      const neutralData = {
        phaseCorrelation: 0,
        stereoWidth: 0,
        balance: 0,
        midLevel: 0,
        sideLevel: 0,
        midLufs: -70,
        sideLufs: -70,
        monoCompatibility: 'EXCELLENT' as const
      };
      setInstantData(neutralData);
      setDisplayData(neutralData);
      
      // Clear samples buffer when not playing
      samplesBuffer.current = [];
    }
  }, [isActive, isPlaying, stereoData]);

  // Update samples buffer for vectorscope when new samples arrive
  useEffect(() => {
    if (isActive && isPlaying && leftSamples && rightSamples) {
      const sampleStep = Math.max(1, Math.floor(leftSamples.length / 50)); // Subsample for performance
      const newSamples: Array<{x: number, y: number, age: number}> = [];
      
      for (let i = 0; i < leftSamples.length; i += sampleStep) {
        const l = leftSamples[i];
        const r = rightSamples[i];
        
        // Skip very low amplitude samples to reduce noise
        if (Math.abs(l) > 0.001 || Math.abs(r) > 0.001) {
          newSamples.push({
            x: l,  // Left channel = X axis
            y: r,  // Right channel = Y axis  
            age: 0
          });
        }
      }
      
      // Add new samples and age existing ones
      samplesBuffer.current = [
        ...newSamples,
        ...samplesBuffer.current.map(s => ({ ...s, age: s.age + 1 }))
      ].slice(0, maxSamples); // Keep only recent samples
    }
  }, [isActive, isPlaying, leftSamples, rightSamples]);

  // Professional vectorscope visualization
  useEffect(() => {
    const canvas = vectorscopeRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container with device pixel ratio
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.85;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!isActive) return;

    // Draw professional grid overlay
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Center crosshairs (L=R line and L+R=0 line)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Diagonal lines for mono (+45°) and anti-phase (-45°)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Mono line (L=R): 45° diagonal
    ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
    // Anti-phase line (L=-R): -45° diagonal  
    ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
    ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
    ctx.stroke();

    // Concentric circles for amplitude levels
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.3;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Axis labels
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('R+', centerX, 12);
    ctx.fillText('R-', centerX, height - 3);
    ctx.textAlign = 'left';
    ctx.fillText('L-', 3, centerY - 3);
    ctx.textAlign = 'right';
    ctx.fillText('L+', width - 3, centerY - 3);

    if (!isPlaying || samplesBuffer.current.length === 0) return;

    // Draw real L/R sample points with aging/fading effect
    samplesBuffer.current.forEach((sample) => {
      // Map audio samples (-1 to +1) to canvas coordinates
      const x = centerX + (sample.x * radius * 0.8);
      const y = centerY - (sample.y * radius * 0.8); // Invert Y for proper orientation
      
      // Age-based opacity and size for persistence effect
      const maxAge = 60; // frames
      const ageAlpha = Math.max(0, 1 - (sample.age / maxAge));
      const pointSize = 1 + (ageAlpha * 1.5);
      
      // Color based on correlation and age - use INSTANT data for responsive coloring - MATCH LEGEND
      const correlation = instantData.phaseCorrelation;
      let baseColor;
      if (correlation > 0.7) baseColor = '#22c55e'; // Green-500 - Excellent (matches legend)
      else if (correlation > 0.3) baseColor = '#eab308'; // Yellow-500 - Moderate (matches legend)
      else baseColor = '#ef4444'; // Red-500 - Poor (matches legend)
      
      ctx.fillStyle = `${baseColor}${Math.floor(ageAlpha * 255).toString(16).padStart(2, '0')}`;
      
      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw correlation vector (shows overall stereo relationship) - use INSTANT data for responsiveness
    const correlation = instantData.phaseCorrelation;
    
    if (isPlaying && Math.abs(correlation) > 0.01) {
      ctx.strokeStyle = correlation > 0.7 ? '#22c55e' : correlation > 0.3 ? '#eab308' : '#ef4444'; // Match legend colors
      ctx.lineWidth = 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 6;
      
      ctx.beginPath();
      // Vector shows primary correlation direction
      const vectorLength = radius * 0.6 * Math.abs(correlation);
      const vectorAngle = correlation > 0 ? Math.PI / 4 : -Math.PI / 4; // 45° for mono, -45° for anti-phase
      const vectorX = centerX + Math.cos(vectorAngle) * vectorLength;
      const vectorY = centerY - Math.sin(vectorAngle) * vectorLength;
      
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(vectorX, vectorY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

  }, [isActive, isPlaying, instantData, samplesBuffer.current.length]);



  // Get correlation background color based on text color
  const getCorrelationBgColor = (correlation: number) => {
    const textColor = getStereoCorrelationColor(correlation);
    if (textColor.includes('green')) return 'bg-green-500';
    if (textColor.includes('yellow')) return 'bg-yellow-500';
    if (textColor.includes('orange')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get stereo width background color
  const getStereoWidthBgColor = (width: number) => {
    const textColor = getStereoWidthColor(width);
    if (textColor.includes('green')) return 'bg-green-500';
    if (textColor.includes('yellow')) return 'bg-yellow-500';
    if (textColor.includes('orange')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get balance background color
  const getBalanceBgColor = (balance: number) => {
    const textColor = getLRBalanceColor(balance);
    if (textColor.includes('green')) return 'bg-green-500';
    if (textColor.includes('yellow')) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
        <InsightMetricCard
          label="Mono"
          value={formatMonoCompatibilityLabel(displayData.monoCompatibility)}
          valueClassName={getMonoCompatibilityToneClass(displayData.monoCompatibility)}
        />
        <InsightMetricCard
          label="Phase"
          value={formatSignedCorrelation(displayData.phaseCorrelation)}
          valueClassName={getStereoCorrelationColor(displayData.phaseCorrelation)}
        />
        <InsightMetricCard
          label="Width"
          value={formatStereoWidth(displayData.stereoWidth)}
          valueClassName={getStereoWidthColor(displayData.stereoWidth)}
        />
        <InsightMetricCard
          label="Balance"
          value={formatBalanceLabel(displayData.balance)}
          valueClassName={getLRBalanceColor(displayData.balance)}
        />
      </div>

      {/* Main Content - Reduced spacing */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3 shrink-0">
        {/* Vectorscope */}
        <div className="space-y-1.5">
          <div className="relative">
            <canvas
              ref={vectorscopeRef}
              className="w-full h-36 bg-slate-900 rounded-lg border border-slate-700/50"
            />
            {isPlaying && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>MONO</span>
            <span>STEREO</span>
            <span>PHASE</span>
          </div>
        </div>

        {/* Metrics + M/S Levels */}
        <div className="space-y-2.5">
          {/* Phase Correlation */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-[0.12em] whitespace-nowrap">Phase</span>
              <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getStereoCorrelationColor(displayData.phaseCorrelation)}`}>
                {formatSignedCorrelation(displayData.phaseCorrelation)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
              {/* Center line at 0 correlation */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-600" />
              {/* Correlation indicator */}
              <div 
                className={`absolute top-0 h-full w-2 rounded-full transition-all duration-200 ${getCorrelationBgColor(displayData.phaseCorrelation)}`}
                style={{ 
                  left: `${((displayData.phaseCorrelation + 1) / 2) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          </div>

          {/* Stereo Width */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-[0.12em] whitespace-nowrap">Width</span>
              <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getStereoWidthColor(displayData.stereoWidth)}`}>
                {formatStereoWidth(displayData.stereoWidth)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${getStereoWidthBgColor(displayData.stereoWidth)}`}
                style={{ width: `${displayData.stereoWidth}%` }}
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-[0.12em] whitespace-nowrap">Balance</span>
              <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getLRBalanceColor(displayData.balance)}`}>
                {formatBalanceLabel(displayData.balance)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-600" />
              <div 
                className={`absolute top-0 h-full w-1 rounded-full transition-all duration-200 ${getBalanceBgColor(displayData.balance)}`}
                style={{ 
                  left: `${50 + (displayData.balance * 45)}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          </div>

          {/* Mid/Side Levels - Compact Row */}
          <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-700/50">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Mid</span>
                <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getLevelColor(linearToDb(displayData.midLevel))}`}>
                  {formatDb(linearToDb(displayData.midLevel))}
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                   className={`h-full rounded-full transition-all duration-200 ${getLevelBgColor(linearToDb(displayData.midLevel))}`}
                  style={{ width: `${Math.max(0, (linearToDb(displayData.midLevel) + 60) / 60 * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Side</span>
                <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getLevelColor(linearToDb(displayData.sideLevel))}`}>
                  {formatDb(linearToDb(displayData.sideLevel))}
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-200 ${getLevelBgColor(linearToDb(displayData.sideLevel))}`}
                  style={{ width: `${Math.max(0, (linearToDb(displayData.sideLevel) + 60) / 60 * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Anchor spacer */}
      <div className="flex-1" />
 
      {/* Standardized Footer block */}
      <div className="shrink-0 pt-2 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
            <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">Mix</div>
            <div className={`mt-1 font-mono font-bold tabular-nums whitespace-nowrap ${mixToneClass}`}>{formatMixPercent(crossfadeVolume)}</div>
          </div>
          <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
            <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">State</div>
            <div className={`mt-1 flex items-center gap-1.5 font-mono font-bold tabular-nums whitespace-nowrap ${mixToneClass}`}>
              <div className={`w-2 h-2 rounded-full ${
                crossfadeVolume === 0 ? 'bg-red-500' :
                isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
              }`}></div>
              <span>{transportLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}