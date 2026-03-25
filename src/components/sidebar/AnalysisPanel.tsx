import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, ChevronDown, ChevronUp, TrendingUp, Radio, Waves } from 'lucide-react';
import { AudioLevels, StereoAnalysis, FrequencyAnalysis, SpectrogramAnalysis, RMSAverager, FrequencyAverager, StereoAverager, SpectrogramAverager, SpectrogramBuffer, calculateFrequencyMetrics, calculateSpectrogramMetrics } from '../../utils/audioAnalysis';
import { LevelsAnalysisSection } from '../analysis/LevelsAnalysisSection';
import { FrequencyAnalysisSection } from '../analysis/FrequencyAnalysisSection';
import { StereoAnalysisSection } from '../analysis/StereoAnalysisSection';
import { SpectrogramAnalysisSection } from '../analysis/SpectrogramAnalysisSection';
import { formatDb, linearToDb, formatCorrelation, formatStereoWidth, formatBrightness, formatActivity } from '../../utils/analysisFormatters';

// ─── Collapsible section state (persisted to localStorage) ───────────────────
const COLLAPSED_KEY = 'mixfade_analysis_collapsed';

function useCollapsedSections() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

// ─── CollapsibleCard ─────────────────────────────────────────────────────────
interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  summary: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleCard({ title, icon, summary, isCollapsed, onToggle, children }: CollapsibleCardProps) {
  return (
    <div className="bg-slate-800 rounded-md overflow-hidden">
      {/* Clickable header bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/50 transition-colors cursor-pointer select-none"
        aria-expanded={!isCollapsed}
      >
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300">{title}</span>
        {isCollapsed && (
          <span className="flex-1 text-right text-[10px] font-mono text-slate-400 truncate pr-1">{summary}</span>
        )}
        <span className="text-slate-500 shrink-0 ml-auto">
          {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
      </button>
      {/* Expandable body */}
      {!isCollapsed && (
        <div className="border-t border-slate-700/60">
          {children}
        </div>
      )}
    </div>
  );
}

// Analysis snapshot interface
interface AnalysisSnapshot {
  id: string;
  timestamp: number;
  trackAFile?: string;
  trackBFile?: string;
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  trackAFrequencyAnalysis?: FrequencyAnalysis;
  trackBFrequencyAnalysis?: FrequencyAnalysis;
  trackAStereoAnalysis?: StereoAnalysis;
  trackBStereoAnalysis?: StereoAnalysis;
  trackASpectrogramAnalysis?: SpectrogramAnalysis;
  trackBSpectrogramAnalysis?: SpectrogramAnalysis;
}

interface AnalysisPanelProps {
  trackAFile?: File;
  trackBFile?: File;
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  // Crossfade props
  isTransitioning?: boolean;
  volumeA?: number;
  volumeB?: number;
}

export function AnalysisPanel({
  trackAFile,
  trackBFile,
  trackADeckLevels,
  trackBDeckLevels,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  // Crossfade data
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0
}: AnalysisPanelProps) {
  const { collapsed, toggle } = useCollapsedSections();
  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisSnapshot[]>([]);
  
  // Smoothed values for A and B tracks (like LevelMeter)
  const [trackASmoothed, setTrackASmoothed] = useState<AudioLevels | null>(null);
  const [trackBSmoothed, setTrackBSmoothed] = useState<AudioLevels | null>(null);
  
  // Smoothed frequency analysis for A and B tracks
  const [trackAFreqSmoothed, setTrackAFreqSmoothed] = useState<FrequencyAnalysis | null>(null);
  const [trackBFreqSmoothed, setTrackBFreqSmoothed] = useState<FrequencyAnalysis | null>(null);
  
  // Smoothed stereo analysis for A and B tracks
  const [trackAStereoSmoothed, setTrackAStereoSmoothed] = useState<StereoAnalysis | null>(null);
  const [trackBStereoSmoothed, setTrackBStereoSmoothed] = useState<StereoAnalysis | null>(null);
  
  // Smoothed spectrogram analysis for A and B tracks
  const [trackASpectrogramSmoothed, setTrackASpectrogramSmoothed] = useState<SpectrogramAnalysis | null>(null);
  const [trackBSpectrogramSmoothed, setTrackBSpectrogramSmoothed] = useState<SpectrogramAnalysis | null>(null);
  
  // Pre-crossfade snapshots - captured just before crossfading starts
  const [preCrossfadeTrackA, setPreCrossfadeTrackA] = useState<AudioLevels | null>(null);
  const [preCrossfadeTrackB, setPreCrossfadeTrackB] = useState<AudioLevels | null>(null);
  const [preCrossfadeFreqA, setPreCrossfadeFreqA] = useState<FrequencyAnalysis | null>(null);
  const [preCrossfadeFreqB, setPreCrossfadeFreqB] = useState<FrequencyAnalysis | null>(null);
  const [preCrossfadeStereoA, setPreCrossfadeStereoA] = useState<StereoAnalysis | null>(null);
  const [preCrossfadeStereoB, setPreCrossfadeStereoB] = useState<StereoAnalysis | null>(null);
  const [preCrossfadeSpectrogramA, setPreCrossfadeSpectrogramA] = useState<SpectrogramAnalysis | null>(null);
  const [preCrossfadeSpectrogramB, setPreCrossfadeSpectrogramB] = useState<SpectrogramAnalysis | null>(null);
  
  // Track previous isTransitioning state to detect start of crossfade
  const [prevIsTransitioning, setPrevIsTransitioning] = useState(false);
  
  // RMS averaging instances (like LevelMeter)
  const rmsAveragerA = useRef<RMSAverager | null>(null);
  const rmsAveragerB = useRef<RMSAverager | null>(null);
  
  // Frequency averaging instances
  const frequencyAveragerA = useRef<FrequencyAverager | null>(null);
  const frequencyAveragerB = useRef<FrequencyAverager | null>(null);
  
  // Stereo averaging instances
  const stereoAveragerA = useRef<StereoAverager | null>(null);
  const stereoAveragerB = useRef<StereoAverager | null>(null);
  
  // Spectrogram averaging instances
  const spectrogramAveragerA = useRef<SpectrogramAverager | null>(null);
  const spectrogramAveragerB = useRef<SpectrogramAverager | null>(null);
  
  // Spectrogram buffer instances for time-based analysis
  const spectrogramBufferA = useRef<SpectrogramBuffer | null>(null);
  const spectrogramBufferB = useRef<SpectrogramBuffer | null>(null);

  // Initialize RMS, Frequency, Stereo, and Spectrogram averagers
  useEffect(() => {
    if (!rmsAveragerA.current) {
      rmsAveragerA.current = new RMSAverager(300, 100); // 300ms window, 100ms updates (slower for sidebar)
    }
    if (!rmsAveragerB.current) {
      rmsAveragerB.current = new RMSAverager(300, 100);
    }
    if (!frequencyAveragerA.current) {
      frequencyAveragerA.current = new FrequencyAverager(300, 100); // Same timing as RMS
    }
    if (!frequencyAveragerB.current) {
      frequencyAveragerB.current = new FrequencyAverager(300, 100);
    }
    if (!stereoAveragerA.current) {
      stereoAveragerA.current = new StereoAverager(300, 100); // Same timing as others
    }
    if (!stereoAveragerB.current) {
      stereoAveragerB.current = new StereoAverager(300, 100);
    }
    if (!spectrogramAveragerA.current) {
      spectrogramAveragerA.current = new SpectrogramAverager(300, 100); // Same timing as others
    }
    if (!spectrogramAveragerB.current) {
      spectrogramAveragerB.current = new SpectrogramAverager(300, 100);
    }
    if (!spectrogramBufferA.current) {
      spectrogramBufferA.current = new SpectrogramBuffer(5000, 100); // 5 second analysis window
    }
    if (!spectrogramBufferB.current) {
      spectrogramBufferB.current = new SpectrogramBuffer(5000, 100);
    }
  }, []);

  // Reset averagers when playback stops
  useEffect(() => {
    if (!isTrackAPlaying && rmsAveragerA.current) {
      rmsAveragerA.current.reset();
    }
    if (!isTrackAPlaying && frequencyAveragerA.current) {
      frequencyAveragerA.current.reset();
    }
    if (!isTrackAPlaying && stereoAveragerA.current) {
      stereoAveragerA.current.reset();
    }
    if (!isTrackAPlaying && spectrogramAveragerA.current) {
      spectrogramAveragerA.current.reset();
    }
    if (!isTrackAPlaying && spectrogramBufferA.current) {
      spectrogramBufferA.current.reset();
    }
  }, [isTrackAPlaying]);

  useEffect(() => {
    if (!isTrackBPlaying && rmsAveragerB.current) {
      rmsAveragerB.current.reset();
    }
    if (!isTrackBPlaying && frequencyAveragerB.current) {
      frequencyAveragerB.current.reset();
    }
    if (!isTrackBPlaying && stereoAveragerB.current) {
      stereoAveragerB.current.reset();
    }
    if (!isTrackBPlaying && spectrogramAveragerB.current) {
      spectrogramAveragerB.current.reset();
    }
    if (!isTrackBPlaying && spectrogramBufferB.current) {
      spectrogramBufferB.current.reset();
    }
  }, [isTrackBPlaying]);

  // Update smoothed values for Track A
  useEffect(() => {
    if (trackADeckLevels && isTrackAPlaying && rmsAveragerA.current) {
      const shouldUpdate = rmsAveragerA.current.addSample(
        trackADeckLevels.leftRms,
        trackADeckLevels.rightRms,
        trackADeckLevels.rms,
        trackADeckLevels.lufs,
        trackADeckLevels.leftLufs,
        trackADeckLevels.rightLufs
      );
      
      if (shouldUpdate) {
        const smoothed = rmsAveragerA.current.getSmoothedValues();
        setTrackASmoothed({
          left: trackADeckLevels.left, // Keep peaks instant
          right: trackADeckLevels.right,
          leftRms: smoothed.leftRmsSmoothed,
          rightRms: smoothed.rightRmsSmoothed,
          rms: smoothed.rmsSmoothed,
          lufs: smoothed.lufsSmoothed,
          leftLufs: smoothed.leftLufsSmoothed,
          rightLufs: smoothed.rightLufsSmoothed
        });
      }
    } else if (!isTrackAPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackADeckLevels, isTrackAPlaying]);

  // Update smoothed values for Track B
  useEffect(() => {
    if (trackBDeckLevels && isTrackBPlaying && rmsAveragerB.current) {
      const shouldUpdate = rmsAveragerB.current.addSample(
        trackBDeckLevels.leftRms,
        trackBDeckLevels.rightRms,
        trackBDeckLevels.rms,
        trackBDeckLevels.lufs,
        trackBDeckLevels.leftLufs,
        trackBDeckLevels.rightLufs
      );
      
      if (shouldUpdate) {
        const smoothed = rmsAveragerB.current.getSmoothedValues();
        setTrackBSmoothed({
          left: trackBDeckLevels.left, // Keep peaks instant
          right: trackBDeckLevels.right,
          leftRms: smoothed.leftRmsSmoothed,
          rightRms: smoothed.rightRmsSmoothed,
          rms: smoothed.rmsSmoothed,
          lufs: smoothed.lufsSmoothed,
          leftLufs: smoothed.leftLufsSmoothed,
          rightLufs: smoothed.rightLufsSmoothed
        });
      }
    } else if (!isTrackBPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackBDeckLevels, isTrackBPlaying]);

  // Update smoothed frequency analysis for Track A
  useEffect(() => {
    if (trackAFrequencyData && isTrackAPlaying && frequencyAveragerA.current) {
      // Calculate frequency metrics from raw FFT data
      const freqAnalysis = calculateFrequencyMetrics(trackAFrequencyData, true, isTrackAPlaying);
      
      const shouldUpdate = frequencyAveragerA.current.addSample(freqAnalysis);
      
      if (shouldUpdate) {
        const smoothed = frequencyAveragerA.current.getSmoothedValues();
        setTrackAFreqSmoothed(smoothed);
      }
    } else if (!isTrackAPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackAFrequencyData, isTrackAPlaying]);

  // Update smoothed frequency analysis for Track B
  useEffect(() => {
    if (trackBFrequencyData && isTrackBPlaying && frequencyAveragerB.current) {
      // Calculate frequency metrics from raw FFT data
      const freqAnalysis = calculateFrequencyMetrics(trackBFrequencyData, true, isTrackBPlaying);
      
      const shouldUpdate = frequencyAveragerB.current.addSample(freqAnalysis);
      
      if (shouldUpdate) {
        const smoothed = frequencyAveragerB.current.getSmoothedValues();
        setTrackBFreqSmoothed(smoothed);
      }
    } else if (!isTrackBPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackBFrequencyData, isTrackBPlaying]);

  // Update smoothed stereo analysis for Track A
  useEffect(() => {
    if (trackAStereoData && isTrackAPlaying && stereoAveragerA.current) {
      const shouldUpdate = stereoAveragerA.current.addSample(trackAStereoData);
      
      if (shouldUpdate) {
        const smoothed = stereoAveragerA.current.getSmoothedValues();
        setTrackAStereoSmoothed(smoothed);
      }
    } else if (!isTrackAPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackAStereoData, isTrackAPlaying]);

  // Update smoothed stereo analysis for Track B
  useEffect(() => {
    if (trackBStereoData && isTrackBPlaying && stereoAveragerB.current) {
      const shouldUpdate = stereoAveragerB.current.addSample(trackBStereoData);
      
      if (shouldUpdate) {
        const smoothed = stereoAveragerB.current.getSmoothedValues();
        setTrackBStereoSmoothed(smoothed);
      }
    } else if (!isTrackBPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackBStereoData, isTrackBPlaying]);

  // Update smoothed spectrogram analysis for Track A
  useEffect(() => {
    if (trackAFrequencyData && isTrackAPlaying && spectrogramAveragerA.current && spectrogramBufferA.current) {
      // Calculate spectrogram metrics from raw FFT data
      const spectrogramAnalysis = calculateSpectrogramMetrics(trackAFrequencyData, spectrogramBufferA.current, 48000, true, isTrackAPlaying);
      
      const shouldUpdate = spectrogramAveragerA.current.addSample(spectrogramAnalysis);
      
      if (shouldUpdate) {
        const smoothed = spectrogramAveragerA.current.getSmoothedValues();
        setTrackASpectrogramSmoothed(smoothed);
      }
    } else if (!isTrackAPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackAFrequencyData, isTrackAPlaying]);

  // Update smoothed spectrogram analysis for Track B
  useEffect(() => {
    if (trackBFrequencyData && isTrackBPlaying && spectrogramAveragerB.current && spectrogramBufferB.current) {
      // Calculate spectrogram metrics from raw FFT data
      const spectrogramAnalysis = calculateSpectrogramMetrics(trackBFrequencyData, spectrogramBufferB.current, 48000, true, isTrackBPlaying);
      
      const shouldUpdate = spectrogramAveragerB.current.addSample(spectrogramAnalysis);
      
      if (shouldUpdate) {
        const smoothed = spectrogramAveragerB.current.getSmoothedValues();
        setTrackBSpectrogramSmoothed(smoothed);
      }
    } else if (!isTrackBPlaying) {
      // Keep last smoothed values when paused
    }
  }, [trackBFrequencyData, isTrackBPlaying]);

  // Detect crossfade start and capture pre-crossfade snapshots
  useEffect(() => {
    // Crossfade started (transitioned from false to true)
    if (isTransitioning && !prevIsTransitioning) {
      // Clear any existing pre-crossfade snapshots first
      setPreCrossfadeTrackA(null);
      setPreCrossfadeTrackB(null);
      
      // Capture current smoothed analysis data before crossfade affects volumes
      if (trackASmoothed) {
        setPreCrossfadeTrackA(trackASmoothed);
      }
      
      if (trackBSmoothed) {
        setPreCrossfadeTrackB(trackBSmoothed);
      }
      
      if (trackAFreqSmoothed) {
        setPreCrossfadeFreqA(trackAFreqSmoothed);
      }
      
      if (trackBFreqSmoothed) {
        setPreCrossfadeFreqB(trackBFreqSmoothed);
      }
      
      if (trackAStereoSmoothed) {
        setPreCrossfadeStereoA(trackAStereoSmoothed);
      }
      
      if (trackBStereoSmoothed) {
        setPreCrossfadeStereoB(trackBStereoSmoothed);
      }
      
      if (trackASpectrogramSmoothed) {
        setPreCrossfadeSpectrogramA(trackASpectrogramSmoothed);
      }
      
      if (trackBSpectrogramSmoothed) {
        setPreCrossfadeSpectrogramB(trackBSpectrogramSmoothed);
      }
    }
    
    // Crossfade ended (transitioned from true to false)
    if (!isTransitioning && prevIsTransitioning) {
      // DON'T clear pre-crossfade snapshots immediately
      // Keep them to show meaningful analysis for the faded-out track
      // They will be cleared when a new crossfade starts or tracks change
    }
    
    // Update previous state
    setPrevIsTransitioning(isTransitioning);
  }, [isTransitioning, prevIsTransitioning, trackASmoothed, trackBSmoothed, trackAFreqSmoothed, trackBFreqSmoothed, trackAStereoSmoothed, trackBStereoSmoothed, trackASpectrogramSmoothed, trackBSpectrogramSmoothed]);

  // Clear pre-crossfade snapshots when files change
  useEffect(() => {
    setPreCrossfadeTrackA(null);
    setPreCrossfadeTrackB(null);
    setPreCrossfadeFreqA(null);
    setPreCrossfadeFreqB(null);
    setPreCrossfadeStereoA(null);
    setPreCrossfadeStereoB(null);
    setPreCrossfadeSpectrogramA(null);
    setPreCrossfadeSpectrogramB(null);
  }, [trackAFile, trackBFile]);

  // Load recent analysis from localStorage on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('mixfade-recent-analysis');
    if (savedAnalysis) {
      try {
        setRecentAnalysis(JSON.parse(savedAnalysis));
      } catch (error) {
        console.warn('Failed to load recent analysis from localStorage:', error);
      }
    }
  }, []);

  // Save recent analysis to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mixfade-recent-analysis', JSON.stringify(recentAnalysis));
  }, [recentAnalysis]);

  // Capture analysis snapshot when tracks pause
  useEffect(() => {
    const shouldCapture = (
      (trackAFile || trackBFile) && // Have at least one file loaded
      (!isTrackAPlaying || !isTrackBPlaying) && // At least one track is paused
      (trackASmoothed || trackBSmoothed || trackAFreqSmoothed || trackBFreqSmoothed || trackAStereoSmoothed || trackBStereoSmoothed || trackASpectrogramSmoothed || trackBSpectrogramSmoothed) // Have smoothed analysis data
    );

    if (shouldCapture) {
      const snapshotId = `${Date.now()}-${trackAFile?.name || 'none'}-${trackBFile?.name || 'none'}`;
      
      const newSnapshot: AnalysisSnapshot = {
        id: snapshotId,
        timestamp: Date.now(),
        trackAFile: trackAFile?.name,
        trackBFile: trackBFile?.name,
        trackADeckLevels: trackASmoothed || undefined,
        trackBDeckLevels: trackBSmoothed || undefined,
        trackAStereoData,
        trackBStereoData,
        trackAFrequencyData,
        trackBFrequencyData,
        trackAFrequencyAnalysis: trackAFreqSmoothed || undefined,
        trackBFrequencyAnalysis: trackBFreqSmoothed || undefined,
        trackAStereoAnalysis: trackAStereoSmoothed || undefined,
        trackBStereoAnalysis: trackBStereoSmoothed || undefined,
        trackASpectrogramAnalysis: trackASpectrogramSmoothed || undefined,
        trackBSpectrogramAnalysis: trackBSpectrogramSmoothed || undefined
      };

      setRecentAnalysis(prev => {
        // Remove duplicate if exists (same file combination)
        const filtered = prev.filter(snap => snap.id !== snapshotId);
        // Add new snapshot at beginning, keep only last 10
        return [newSnapshot, ...filtered].slice(0, 10);
      });
    }
  }, [isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile, trackASmoothed, trackBSmoothed, trackAFreqSmoothed, trackBFreqSmoothed, trackAStereoSmoothed, trackBStereoSmoothed, trackASpectrogramSmoothed, trackBSpectrogramSmoothed, trackAStereoData, trackBStereoData, trackAFrequencyData, trackBFrequencyData]);

  // Get current or most recent analysis data - FIXED LOGIC WITH CROSSFADE SUPPORT
  const getCurrentAnalysis = (): AnalysisSnapshot => {
    // Helper to determine if a track is effectively "faded out" (volume very low)
    const isTrackFadedOut = (volume: number) => volume < 0.1; // Less than 10% volume
    
    // CROSSFADE MODE: If crossfading, use pre-crossfade snapshots for meaningful comparison
    if (isTransitioning) {
      return {
        id: 'crossfade',
        timestamp: Date.now(),
        trackAFile: trackAFile?.name,
        trackBFile: trackBFile?.name,
        trackADeckLevels: preCrossfadeTrackA || trackASmoothed || undefined,
        trackBDeckLevels: preCrossfadeTrackB || trackBSmoothed || undefined,
        trackAStereoData,
        trackBStereoData,
        trackAFrequencyData,
        trackBFrequencyData,
        trackAFrequencyAnalysis: preCrossfadeFreqA || trackAFreqSmoothed || undefined,
        trackBFrequencyAnalysis: preCrossfadeFreqB || trackBFreqSmoothed || undefined,
        trackAStereoAnalysis: preCrossfadeStereoA || trackAStereoSmoothed || undefined,
        trackBStereoAnalysis: preCrossfadeStereoB || trackBStereoSmoothed || undefined,
        trackASpectrogramAnalysis: preCrossfadeSpectrogramA || trackASpectrogramSmoothed || undefined,
        trackBSpectrogramAnalysis: preCrossfadeSpectrogramB || trackBSpectrogramSmoothed || undefined
      };
    }
    
    // POST-CROSSFADE MODE: Use smart logic based on volume levels
    if ((isTrackAPlaying || isTrackBPlaying) && (preCrossfadeTrackA || preCrossfadeTrackB)) {
      return {
        id: 'post-crossfade',
        timestamp: Date.now(),
        trackAFile: trackAFile?.name,
        trackBFile: trackBFile?.name,
        // For Track A: Use live data if active, pre-crossfade if faded out
        trackADeckLevels: isTrackFadedOut(volumeA) && preCrossfadeTrackA 
          ? preCrossfadeTrackA 
          : trackASmoothed || undefined,
        // For Track B: Use live data if active, pre-crossfade if faded out  
        trackBDeckLevels: isTrackFadedOut(volumeB) && preCrossfadeTrackB 
          ? preCrossfadeTrackB 
          : trackBSmoothed || undefined,
        trackAStereoData,
        trackBStereoData,
        trackAFrequencyData,
        trackBFrequencyData,
        // For Frequency A: Use live data if active, pre-crossfade if faded out
        trackAFrequencyAnalysis: isTrackFadedOut(volumeA) && preCrossfadeFreqA 
          ? preCrossfadeFreqA 
          : trackAFreqSmoothed || undefined,
        // For Frequency B: Use live data if active, pre-crossfade if faded out
        trackBFrequencyAnalysis: isTrackFadedOut(volumeB) && preCrossfadeFreqB 
          ? preCrossfadeFreqB 
          : trackBFreqSmoothed || undefined,
        // For Stereo A: Use live data if active, pre-crossfade if faded out
        trackAStereoAnalysis: isTrackFadedOut(volumeA) && preCrossfadeStereoA 
          ? preCrossfadeStereoA 
          : trackAStereoSmoothed || undefined,
        // For Stereo B: Use live data if active, pre-crossfade if faded out
        trackBStereoAnalysis: isTrackFadedOut(volumeB) && preCrossfadeStereoB 
          ? preCrossfadeStereoB 
          : trackBStereoSmoothed || undefined,
        // For Spectrogram A: Use live data if active, pre-crossfade if faded out
        trackASpectrogramAnalysis: isTrackFadedOut(volumeA) && preCrossfadeSpectrogramA 
          ? preCrossfadeSpectrogramA 
          : trackASpectrogramSmoothed || undefined,
        // For Spectrogram B: Use live data if active, pre-crossfade if faded out
        trackBSpectrogramAnalysis: isTrackFadedOut(volumeB) && preCrossfadeSpectrogramB 
          ? preCrossfadeSpectrogramB 
          : trackBSpectrogramSmoothed || undefined
      };
    }
    
    // NORMAL PLAYING MODE: If tracks are playing (but not crossfading), use live smoothed data
    if (isTrackAPlaying || isTrackBPlaying) {
      return {
        id: 'current',
        timestamp: Date.now(),
        trackAFile: trackAFile?.name,
        trackBFile: trackBFile?.name,
        trackADeckLevels: trackASmoothed || undefined,
        trackBDeckLevels: trackBSmoothed || undefined,
        trackAStereoData,
        trackBStereoData,
        trackAFrequencyData,
        trackBFrequencyData,
        trackAFrequencyAnalysis: trackAFreqSmoothed || undefined,
        trackBFrequencyAnalysis: trackBFreqSmoothed || undefined,
        trackAStereoAnalysis: trackAStereoSmoothed || undefined,
        trackBStereoAnalysis: trackBStereoSmoothed || undefined,
        trackASpectrogramAnalysis: trackASpectrogramSmoothed || undefined,
        trackBSpectrogramAnalysis: trackBSpectrogramSmoothed || undefined
      };
    }
    
    // PAUSED MODE: Try to get the most recent snapshot for these files
    const currentFileCombo = `${trackAFile?.name || 'none'}-${trackBFile?.name || 'none'}`;
    const recentSnapshot = recentAnalysis.find(snap => 
      `${snap.trackAFile || 'none'}-${snap.trackBFile || 'none'}` === currentFileCombo
    );
    
    if (recentSnapshot) {
      return recentSnapshot;
    }
    
    // FALLBACK: Use current smoothed data
    return {
      id: 'current',
      timestamp: Date.now(),
      trackAFile: trackAFile?.name,
      trackBFile: trackBFile?.name,
      trackADeckLevels: trackASmoothed || undefined,
      trackBDeckLevels: trackBSmoothed || undefined,
      trackAStereoData,
      trackBStereoData,
      trackAFrequencyData,
      trackBFrequencyData,
      trackAFrequencyAnalysis: trackAFreqSmoothed || undefined,
      trackBFrequencyAnalysis: trackBFreqSmoothed || undefined,
      trackAStereoAnalysis: trackAStereoSmoothed || undefined,
      trackBStereoAnalysis: trackBStereoSmoothed || undefined,
      trackASpectrogramAnalysis: trackASpectrogramSmoothed || undefined,
      trackBSpectrogramAnalysis: trackBSpectrogramSmoothed || undefined
    };
  };

  const currentAnalysis = getCurrentAnalysis();

  // Helper functions moved to utils/analysisFormatters.ts

  // ── Collapsed summaries ──────────────────────────────────────────────────
  const ca = currentAnalysis;

  const levelsSummary = (() => {
    const aLufs = ca.trackADeckLevels ? formatDb(ca.trackADeckLevels.lufs) : '--';
    const bLufs = ca.trackBDeckLevels ? formatDb(ca.trackBDeckLevels.lufs) : '--';
    const aRms  = ca.trackADeckLevels ? formatDb(linearToDb(ca.trackADeckLevels.rms)) : '--';
    const bRms  = ca.trackBDeckLevels ? formatDb(linearToDb(ca.trackBDeckLevels.rms)) : '--';
    return `A ${aLufs} LUFS · ${aRms} RMS  /  B ${bLufs} LUFS · ${bRms} RMS`;
  })();

  const freqSummary = (() => {
    const aBass = ca.trackAFrequencyAnalysis ? formatDb(ca.trackAFrequencyAnalysis.bassEnergy) : '--';
    const bBass = ca.trackBFrequencyAnalysis ? formatDb(ca.trackBFrequencyAnalysis.bassEnergy) : '--';
    const aMid  = ca.trackAFrequencyAnalysis ? formatDb(ca.trackAFrequencyAnalysis.midEnergy) : '--';
    const bMid  = ca.trackBFrequencyAnalysis ? formatDb(ca.trackBFrequencyAnalysis.midEnergy) : '--';
    return `Bass A ${aBass} / B ${bBass}  ·  Mid A ${aMid} / B ${bMid}`;
  })();

  const stereoSummary = (() => {
    const aCorr  = ca.trackAStereoAnalysis ? formatCorrelation(ca.trackAStereoAnalysis.phaseCorrelation) : '--';
    const bCorr  = ca.trackBStereoAnalysis ? formatCorrelation(ca.trackBStereoAnalysis.phaseCorrelation) : '--';
    const aWidth = ca.trackAStereoAnalysis ? formatStereoWidth(ca.trackAStereoAnalysis.stereoWidth) : '--';
    const bWidth = ca.trackBStereoAnalysis ? formatStereoWidth(ca.trackBStereoAnalysis.stereoWidth) : '--';
    return `Corr A ${aCorr} / B ${bCorr}  ·  Width A ${aWidth}% / B ${bWidth}%`;
  })();

  const spectrogramSummary = (() => {
    const aBright = ca.trackASpectrogramAnalysis ? formatBrightness(ca.trackASpectrogramAnalysis.brightness) : '--';
    const bBright = ca.trackBSpectrogramAnalysis ? formatBrightness(ca.trackBSpectrogramAnalysis.brightness) : '--';
    const aAct    = ca.trackASpectrogramAnalysis ? formatActivity(ca.trackASpectrogramAnalysis.activity) : '--';
    const bAct    = ca.trackBSpectrogramAnalysis ? formatActivity(ca.trackBSpectrogramAnalysis.activity) : '--';
    return `Bright A ${aBright} / B ${bBright}  ·  Act A ${aAct}% / B ${bAct}%`;
  })();

  return (
    <div className="p-4 space-y-6">
      {/* A/B Analysis */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">A/B Analysis</h3>

        {ca.trackADeckLevels || ca.trackBDeckLevels ? (
          <div className="space-y-1">
            {/* ── Levels ── */}
            <CollapsibleCard
              title="Levels"
              icon={<TrendingUp size={12} />}
              summary={levelsSummary}
              isCollapsed={!!collapsed['levels']}
              onToggle={() => toggle('levels')}
            >
              <LevelsAnalysisSection
                trackADeckLevels={ca.trackADeckLevels}
                trackBDeckLevels={ca.trackBDeckLevels}
                isTransitioning={isTransitioning}
                isTrackAPlaying={isTrackAPlaying}
                isTrackBPlaying={isTrackBPlaying}
              />
            </CollapsibleCard>

            {/* ── Frequencies ── */}
            <CollapsibleCard
              title="Frequencies"
              icon={<Activity size={12} />}
              summary={freqSummary}
              isCollapsed={!!collapsed['frequencies']}
              onToggle={() => toggle('frequencies')}
            >
              <FrequencyAnalysisSection
                trackAFrequencyAnalysis={ca.trackAFrequencyAnalysis}
                trackBFrequencyAnalysis={ca.trackBFrequencyAnalysis}
                isTransitioning={isTransitioning}
                isTrackAPlaying={isTrackAPlaying}
                isTrackBPlaying={isTrackBPlaying}
              />
            </CollapsibleCard>

            {/* ── Stereo ── */}
            <CollapsibleCard
              title="Stereo"
              icon={<Radio size={12} />}
              summary={stereoSummary}
              isCollapsed={!!collapsed['stereo']}
              onToggle={() => toggle('stereo')}
            >
              <StereoAnalysisSection
                trackAStereoAnalysis={ca.trackAStereoAnalysis}
                trackBStereoAnalysis={ca.trackBStereoAnalysis}
                isTransitioning={isTransitioning}
                isTrackAPlaying={isTrackAPlaying}
                isTrackBPlaying={isTrackBPlaying}
              />
            </CollapsibleCard>

            {/* ── Spectrogram ── */}
            <CollapsibleCard
              title="Spectrogram"
              icon={<Waves size={12} />}
              summary={spectrogramSummary}
              isCollapsed={!!collapsed['spectrogram']}
              onToggle={() => toggle('spectrogram')}
            >
              <SpectrogramAnalysisSection
                trackASpectrogramAnalysis={ca.trackASpectrogramAnalysis}
                trackBSpectrogramAnalysis={ca.trackBSpectrogramAnalysis}
                isTransitioning={isTransitioning}
                isTrackAPlaying={isTrackAPlaying}
                isTrackBPlaying={isTrackBPlaying}
              />
            </CollapsibleCard>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity size={32} className="text-white/60 mx-auto mb-3" />
            <p className="text-sm text-white font-medium">No analysis data</p>
            <p className="text-xs text-white/70 mt-1">Load and play audio files to see analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
