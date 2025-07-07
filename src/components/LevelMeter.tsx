import React, { useState, useEffect, useRef } from 'react';
import { AudioLevels, AudioUtils, RMSAverager } from '../utils/audioAnalysis';

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
    if (db > -12) return 'bg-gradient-to-r from-emerald-500 to-yellow-500'; // Good zone
    if (db > -18) return 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'; // Safe zone
    return 'bg-gradient-to-r from-blue-500 to-emerald-500'; // Low level
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

  return (
    <div className="h-full flex flex-col">
      {/* Header with L+R combined measurements - using smoothed values */}
      <div className="flex items-center justify-between mb-2 text-xs font-mono">
        <div className="text-audio-text-dim">
          L+R RMS: <span className="text-white font-bold">{AudioUtils.rmsToDb(combinedRmsSmoothed).toFixed(1)}</span> dB
        </div>
        {typeof crossfadeVolume === 'number' && crossfadeVolume < 1 && (
          <div className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent font-bold">
            X-FADE: {Math.round(crossfadeVolume * 100)}%
          </div>
        )}
        <div className="text-audio-text-dim">
          L+R LUFS: <span className="text-white font-bold">{lufsSmoothed.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-3">
        {/* Left Channel */}
        <div>
          <div className="flex justify-between text-xs text-audio-text-dim mb-1 font-mono">
            <span className="font-semibold">L</span>
            <div className="flex gap-4">
              <span className="text-white">
                LUFS: {leftLufsSmoothed.toFixed(1)}
              </span>
              <span className="text-white">
                RMS: {AudioUtils.rmsToDb(leftRmsSmoothed).toFixed(1)} dB
              </span>
              <span className={`${linearToDbExtended(leftPeak) >= 0 ? 'text-yellow-400' : 'text-white'}`}>
                Peak: {linearToDbExtended(leftPeak).toFixed(1)} dB
              </span>
              <span className={`${linearToDbExtended(leftTruePeak) > 0 ? 'text-red-400' : 'text-white'}`}>
                TP: {linearToDbExtended(leftTruePeak).toFixed(1)} dB
              </span>
            </div>
          </div>
          
          {/* Main level meter */}
          <div className="relative h-6 bg-slate-900 rounded-2xl overflow-hidden mb-1">
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
        </div>
        
        {/* Right Channel */}
        <div>
          <div className="flex justify-between text-xs text-audio-text-dim mb-1 font-mono">
            <span className="font-semibold">R</span>
            <div className="flex gap-4">
              <span className="text-white">
                LUFS: {rightLufsSmoothed.toFixed(1)}
              </span>
              <span className="text-white">
                RMS: {AudioUtils.rmsToDb(rightRmsSmoothed).toFixed(1)} dB
              </span>
              <span className={`${linearToDbExtended(rightPeak) >= 0 ? 'text-yellow-400' : 'text-white'}`}>
                Peak: {linearToDbExtended(rightPeak).toFixed(1)} dB
              </span>
              <span className={`${linearToDbExtended(rightTruePeak) > 0 ? 'text-red-400' : 'text-white'}`}>
                TP: {linearToDbExtended(rightTruePeak).toFixed(1)} dB
              </span>
            </div>
          </div>
          
          {/* Main level meter */}
          <div className="relative h-6 bg-slate-900 rounded-2xl overflow-hidden mb-1">
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
        </div>
      </div>
      
      {/* Enhanced scale with proper positioning */}
      <div className="flex justify-between text-xs text-audio-text-dim mt-2 font-mono relative">
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
      
      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-audio-text-dim">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-red-400 rounded"></div>
              <span>Clipping</span>
            </div>
            {/* <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-emerald-400 rounded"></div>
              <span>True Peak</span>
            </div> */}
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