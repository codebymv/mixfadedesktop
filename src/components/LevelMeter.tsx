import React, { useState, useEffect, useRef } from 'react';
import { AudioLevels, AudioUtils, RMSAverager } from '../utils/audioAnalysis';
import { InsightMetricCard } from './analysis/InsightMetricCard';
import { formatMixPercent, formatSignedDb, getLevelRiskLabel, getMixToneClass } from '../utils/analysisFormatters';

interface LevelMeterProps {
  label: string;
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
  audioLevels?: AudioLevels;
  crossfadeVolume?: number;
}

export function LevelMeter({ 
  isActive, 
  isPlaying, 
  audioLevels,
  crossfadeVolume = 1
}: LevelMeterProps) {
  const [leftLevel, setLeftLevel] = useState(0);
  const [rightLevel, setRightLevel] = useState(0);
  const [leftPeak, setLeftPeak] = useState(0);
  const [rightPeak, setRightPeak] = useState(0);
  const [leftTruePeak, setLeftTruePeak] = useState(0);
  const [rightTruePeak, setRightTruePeak] = useState(0);
  
  // Separate instant and smoothed RMS values
  
  // Smoothed values for display
  const [leftRmsSmoothed, setLeftRmsSmoothed] = useState(0);
  const [rightRmsSmoothed, setRightRmsSmoothed] = useState(0);
  const [combinedRmsSmoothed, setCombinedRmsSmoothed] = useState(0);
  const [lufsSmoothed, setLufsSmoothed] = useState(-70);
  const [leftLufsSmoothed, setLeftLufsSmoothed] = useState(-70);
  const [rightLufsSmoothed, setRightLufsSmoothed] = useState(-70);

  // RMS averaging instances
  const rmsAverager = useRef<RMSAverager | null>(null);

  // Initialize RMS averager
  useEffect(() => {
    if (!rmsAverager.current) {
      // 300ms window, update every 50ms for smooth but readable values
      rmsAverager.current = new RMSAverager(300, 50);
    }
  }, []);

  // Reset averager when playback stops
  useEffect(() => {
    if (!isPlaying && rmsAverager.current) {
      rmsAverager.current.reset();
    }
  }, [isPlaying]);

  // Update levels from real audio data
  useEffect(() => {
    if (!isActive) {
      setLeftLevel(0);
      setRightLevel(0);
      setLeftPeak(0);
      setRightPeak(0);
      setLeftTruePeak(0);
      setRightTruePeak(0);
      setLeftRmsSmoothed(0);
      setRightRmsSmoothed(0);
      setCombinedRmsSmoothed(0);
      setLufsSmoothed(-70);
      setLeftLufsSmoothed(-70);
      setRightLufsSmoothed(-70);
      return;
    }

    if (audioLevels && isPlaying) {
      // METERS ALWAYS SHOW RAW SIGNAL LEVELS - not affected by crossfade volume
      // This is professional audio behavior: meters show source levels, volume controls output only
      
      // Update instant peak levels (these should be responsive)
      setLeftLevel(audioLevels.left);
      setRightLevel(audioLevels.right);
      
      // Add to RMS averager and update smoothed values (using raw levels)
      if (rmsAverager.current) {
        const shouldUpdate = rmsAverager.current.addSample(
          audioLevels.leftRms,
          audioLevels.rightRms,
          audioLevels.rms,
          audioLevels.lufs,
          audioLevels.leftLufs,
          audioLevels.rightLufs
        );
        
        if (shouldUpdate) {
          const smoothed = rmsAverager.current.getSmoothedValues();
          setLeftRmsSmoothed(smoothed.leftRmsSmoothed);
          setRightRmsSmoothed(smoothed.rightRmsSmoothed);
          setCombinedRmsSmoothed(smoothed.rmsSmoothed);
          setLufsSmoothed(smoothed.lufsSmoothed);
          setLeftLufsSmoothed(smoothed.leftLufsSmoothed);
          setRightLufsSmoothed(smoothed.rightLufsSmoothed);
        }
      }
      
      // Simulate true peak (slightly higher than sample peak for realistic behavior)
      const leftTP = Math.min(1.5, audioLevels.left * 1.08); // Can go above 0dBFS, up to +3.5dB
      const rightTP = Math.min(1.5, audioLevels.right * 1.08);
      
      // Update peaks if current level is higher
      if (audioLevels.left > leftPeak) {
        setLeftPeak(audioLevels.left);
      }
      if (audioLevels.right > rightPeak) {
        setRightPeak(audioLevels.right);
      }
      if (leftTP > leftTruePeak) {
        setLeftTruePeak(leftTP);
      }
      if (rightTP > rightTruePeak) {
        setRightTruePeak(rightTP);
      }
    } else {
      // When not playing, show zero levels
      setLeftLevel(0);
      setRightLevel(0);
      setLeftRmsSmoothed(0);
      setRightRmsSmoothed(0);
      setCombinedRmsSmoothed(0);
      setLufsSmoothed(-70);
      setLeftLufsSmoothed(-70);
      setRightLufsSmoothed(-70);
    }
  }, [isActive, isPlaying, audioLevels, leftPeak, rightPeak, leftTruePeak, rightTruePeak]);

  // Peak decay effect
  useEffect(() => {
    if (!isPlaying) return;

    const peakDecay = setInterval(() => {
      setLeftPeak(prev => Math.max(0, prev - 0.008));
      setRightPeak(prev => Math.max(0, prev - 0.008));
      setLeftTruePeak(prev => Math.max(0, prev - 0.008));
      setRightTruePeak(prev => Math.max(0, prev - 0.008));
    }, 50);

    return () => clearInterval(peakDecay);
  }, [isPlaying]);

  // Convert linear to dB with extended range for true peak
  const linearToDbExtended = (linear: number): number => {
    if (linear <= 0) return -60;
    return Math.max(-60, 20 * Math.log10(linear));
  };

  // Convert dB to position on meter (-60dB to +6dB mapped to 0% to 100%)
  const dbToMeterPosition = (db: number): number => {
    const minDb = -60;
    const maxDb = 6;
    const position = ((db - minDb) / (maxDb - minDb)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Get level color based on dB value with extended range
  const getLevelColor = (level: number) => {
    const db = linearToDbExtended(level);
    if (db > 3) return 'bg-red-600'; // Above +3dBFS - severe clipping
    if (db > 0) return 'bg-red-500'; // Above 0dBFS - digital clipping
    if (db > -3) return 'bg-gradient-to-r from-orange-500 to-red-500'; // Hot zone
    if (db > -6) return 'bg-gradient-to-r from-yellow-500 to-orange-500'; // Loud zone
    if (db > -12) return 'bg-gradient-to-r from-[var(--theme-deck-a-base)] to-yellow-500'; // Good zone
    if (db > -18) return 'bg-[var(--theme-deck-a-base)]'; // Safe zone
    return 'bg-gradient-to-r from-blue-500 to-[var(--theme-deck-a-base)]'; // Low level
  };

  // Get true peak color (more sensitive to overs)
  const getTruePeakColor = (level: number) => {
    const db = linearToDbExtended(level);
    if (db > 0) return 'bg-red-600'; // True peak over 0dBFS
    if (db > -1) return 'bg-orange-500'; // Close to over
    return 'bg-white'; // Normal peak hold
  };

  // Calculate meter positions for grid lines
  const gridPositions = {
    minus60: dbToMeterPosition(-60), // 0%
    minus48: dbToMeterPosition(-48), // ~18.18%
    minus36: dbToMeterPosition(-36), // ~36.36%
    minus24: dbToMeterPosition(-24), // ~54.55%
    minus18: dbToMeterPosition(-18), // ~63.64%
    minus12: dbToMeterPosition(-12), // ~72.73%
    minus6: dbToMeterPosition(-6),   // ~81.82%
    zero: dbToMeterPosition(0),      // ~90.91%
    plus6: dbToMeterPosition(6)      // 100%
  };

  const combinedPeakDb = Math.max(linearToDbExtended(leftPeak), linearToDbExtended(rightPeak));
  const combinedTruePeakDb = Math.max(linearToDbExtended(leftTruePeak), linearToDbExtended(rightTruePeak));
  const levelRisk = getLevelRiskLabel(combinedTruePeakDb);
  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const riskToneClass = levelRisk === 'CLIP'
    ? 'text-red-400'
    : levelRisk === 'HOT'
      ? 'text-orange-400'
      : levelRisk === 'SAFE'
        ? 'text-green-400'
        : 'text-slate-400';
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  const renderChannelMetrics = (
    channelLabel: 'L' | 'R',
    lufsValue: number,
    rmsValue: number,
    peakValue: number,
    truePeakValue: number
  ) => {
    const peakDb = linearToDbExtended(peakValue);
    const truePeakDb = linearToDbExtended(truePeakValue);

    return (
      <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-1.5 mb-1">
        <span className="pt-1.5 text-[10px] font-semibold font-mono text-audio-text-dim whitespace-nowrap">
          {channelLabel}
        </span>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
          <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">LUFS</div>
            <div className="mt-0.5 text-xs font-mono font-bold tabular-nums text-white whitespace-nowrap">{lufsValue.toFixed(1)}</div>
          </div>
          <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">RMS</div>
            <div className="mt-0.5 text-xs font-mono font-bold tabular-nums text-white whitespace-nowrap">{formatSignedDb(AudioUtils.rmsToDb(rmsValue))}</div>
          </div>
          <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">PK</div>
            <div className={`mt-0.5 text-xs font-mono font-bold tabular-nums whitespace-nowrap ${peakDb >= 0 ? 'text-yellow-400' : 'text-white'}`}>{formatSignedDb(peakDb)}</div>
          </div>
          <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">TP</div>
            <div className={`mt-0.5 text-xs font-mono font-bold tabular-nums whitespace-nowrap ${truePeakDb > 0 ? 'text-red-400' : 'text-white'}`}>{formatSignedDb(truePeakDb)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Reduced empty space at top */}
      <div className="h-1 shrink-0" />
      
      <div className="space-y-6 shrink-0 mt-2">
        <div>
          {renderChannelMetrics('L', leftLufsSmoothed, leftRmsSmoothed, leftPeak, leftTruePeak)}
          {/* Main level meter */}
          <div className="relative h-6 bg-slate-900 rounded-2xl overflow-hidden">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex">
              {/* Critical markers */}
              <div className="absolute h-full w-px bg-slate-600" style={{ left: `${gridPositions.zero}%` }}></div> {/* 0dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus6}%` }}></div> {/* -6dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus12}%` }}></div> {/* -12dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus18}%` }}></div> {/* -18dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus24}%` }}></div> {/* -24dB */}
            </div>
            
            {/* Level fill - using INSTANT levels for visual responsiveness */}
            <div 
              className={`h-full transition-all duration-75 rounded-2xl shadow-lg ${getLevelColor(leftLevel)}`}
              style={{ width: `${dbToMeterPosition(linearToDbExtended(leftLevel))}%` }}
            />
            
            {/* Sample peak hold */}
            <div 
              className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg opacity-80"
              style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(leftPeak)), 99)}%` }}
            />
            
            {/* True peak hold */}
            <div 
              className={`absolute top-0 h-full w-1 rounded-full shadow-lg ${getTruePeakColor(leftTruePeak)}`}
              style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(leftTruePeak)), 99)}%` }}
            />
          </div>
          
          {/* dB Scale */}
          <div className="flex justify-between text-[10px] text-audio-text-dim font-mono tabular-nums relative whitespace-nowrap mt-1.5">
            <span>-60</span>
            <span>-48</span>
            <span>-36</span>
            <span>-24</span>
            <span>-18</span>
            <span>-12</span>
            <span>-6</span>
            <span className="text-yellow-400 font-bold">0</span>
            <span className="text-red-400 font-bold">+6</span>
          </div>
        </div>
        
        <div>
          {renderChannelMetrics('R', rightLufsSmoothed, rightRmsSmoothed, rightPeak, rightTruePeak)}
          {/* Main level meter */}
          <div className="relative h-6 bg-slate-900 rounded-2xl overflow-hidden">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex">
              {/* Critical markers */}
              <div className="absolute h-full w-px bg-slate-600" style={{ left: `${gridPositions.zero}%` }}></div> {/* 0dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus6}%` }}></div> {/* -6dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus12}%` }}></div> {/* -12dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus18}%` }}></div> {/* -18dB */}
              <div className="absolute h-full w-px bg-slate-700" style={{ left: `${gridPositions.minus24}%` }}></div> {/* -24dB */}
            </div>
            
            {/* Level fill - using INSTANT levels for visual responsiveness */}
            <div 
              className={`h-full transition-all duration-75 rounded-2xl shadow-lg ${getLevelColor(rightLevel)}`}
              style={{ width: `${dbToMeterPosition(linearToDbExtended(rightLevel))}%` }}
            />
            
            {/* Sample peak hold */}
            <div 
              className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg opacity-80"
              style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(rightPeak)), 99)}%` }}
            />
            
            {/* True peak hold */}
            <div 
              className={`absolute top-0 h-full w-1 rounded-full shadow-lg ${getTruePeakColor(rightTruePeak)}`}
              style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(rightTruePeak)), 99)}%` }}
            />
          </div>
          
          {/* dB Scale */}
          <div className="flex justify-between text-[10px] text-audio-text-dim font-mono tabular-nums relative whitespace-nowrap mt-1.5">
            <span>-60</span>
            <span>-48</span>
            <span>-36</span>
            <span>-24</span>
            <span>-18</span>
            <span>-12</span>
            <span>-6</span>
            <span className="text-yellow-400 font-bold">0</span>
            <span className="text-red-400 font-bold">+6</span>
          </div>
        </div>
      </div>
      
      {/* Anchor spacer */}
      <div className="flex-1" />
      
      {/* Standardized Footer block */}
      <div className="shrink-0 space-y-2">
        
        <div className="pt-2 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">Risk</div>
              <div className={`mt-1 font-mono font-bold tabular-nums whitespace-nowrap ${riskToneClass}`}>{levelRisk}</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
              <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">State</div>
              <div className={`mt-1 flex items-center gap-1.5 font-mono font-bold tabular-nums whitespace-nowrap ${mixToneClass}`}>
                <div className={`w-2 h-2 rounded-full ${
                crossfadeVolume === 0 ? 'bg-red-500' :
                isPlaying ? 'bg-[var(--theme-deck-a-base)] animate-pulse' : 'bg-slate-500'
              }`}></div>
                <span>{transportLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}