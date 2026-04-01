import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Link as LinkIcon, Repeat } from 'lucide-react';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';
import { useSettings } from '../contexts/SettingsContext';
import { AudioContextNodes, useAudioContext } from '../hooks/useAudioContext';
import { useWaveform } from '../hooks/useWaveform';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';
import { useAudioMetadata, AudioMetadata } from '../hooks/useAudioMetadata';
import { useColorTheme } from '../hooks/useColorTheme';
import { getDeckTheme } from '../theme/colorThemes';
import { WaveformDisplay } from './waveform/WaveformDisplay';
import { PlaybackControls } from './waveform/PlaybackControls';
import { AudioMetadataDisplay } from './waveform/AudioMetadataDisplay';
import { VolumeControls } from './waveform/VolumeControls';

interface WaveformPlayerProps {
  file: File;
  color: 'green' | 'purple';
  label: string;
  isSidebarCollapsed?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onAudioLevels?: (levels: AudioLevels) => void;
  onFrequencyData?: (data: Float32Array) => void;
  onStereoData?: (data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => void;
  crossfadeVolume?: number; // Volume from crossfade control (0-1)
  deckVolume?: number; // Hoisted persistent deck volume
  onDeckVolumeChange?: (volume: number) => void;
  isMuted?: boolean; // Hoisted persistent mute state
  onMuteChange?: (isMuted: boolean) => void;
  isLooping?: boolean; // Hoisted persistent loop state
  onLoopChange?: (isLooping: boolean) => void;
  isLinkedPlayback?: boolean; // True if A/B sync is on
  isLinkPlaybackDisabled?: boolean;
  onTimeSeek?: (time: number) => void; // Emits to parent when scrubbed
  onToggleLinkedPlayback?: () => void; // Toggle Link Playback
}

export interface WaveformPlayerRef {
  togglePlayPause: () => void;
  play: () => void;
  pause: () => void;
  setCurrentTime: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  setVolume: (vol: number) => void;
  getVolume: () => number;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  setLoop: (looping: boolean) => void;
  getLoop: () => boolean;
  getAudioNodes: () => AudioContextNodes;
}

export const WaveformPlayer = forwardRef<WaveformPlayerRef, WaveformPlayerProps>((
  {
    file,
    color,
    isSidebarCollapsed,
    onPlayStateChange,
    onAudioLevels,
    onFrequencyData,
    onStereoData,
    crossfadeVolume = 1,
    deckVolume,
    onDeckVolumeChange,
    isMuted: externalIsMuted,
    onMuteChange,
    isLooping: externalIsLooping,
    onLoopChange,
    isLinkedPlayback,
    isLinkPlaybackDisabled,
    onTimeSeek,
    onToggleLinkedPlayback
  },
  ref
) => {
  // Get settings for configurable analysis update rate
  const { settings } = useSettings();
  const activeColorTheme = useColorTheme();

  // Hooks for modular functionality
  const audioContext = useAudioContext();
  const waveform = useWaveform();
  const metadata = useAudioMetadata();

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileUrl = useRef<string | null>(null);
  const currentFile = useRef<File | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [internalVolume, setInternalVolume] = useState(1.0);
  const [internalIsMuted, setInternalIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);

  const volume = deckVolume !== undefined ? deckVolume : internalVolume;
  const isMuted = externalIsMuted !== undefined ? externalIsMuted : internalIsMuted;
  const [internalIsLooping, setInternalIsLooping] = useState(false);
  const isLooping = externalIsLooping !== undefined ? externalIsLooping : internalIsLooping;

  // Sync loop state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Color configuration
  const config = useMemo(() => {
    const deckTheme = getDeckTheme(activeColorTheme, color);

    return {
      waveColor: deckTheme.base,
      bgColor: color === 'green' ? 'bg-[var(--theme-deck-a-base)]' : 'bg-[var(--theme-deck-b-base)]',
      lightBgColor: color === 'green' ? 'bg-[var(--theme-deck-a-base)]/20' : 'bg-[var(--theme-deck-b-base)]/20',
      hoverColor: color === 'green' ? 'hover:bg-[var(--theme-deck-a-strong)]' : 'hover:bg-[var(--theme-deck-b-strong)]',
      textColor: color === 'green' ? 'text-[var(--theme-deck-a-text)]' : 'text-[var(--theme-deck-b-text)]',
      borderColor: color === 'green' ? 'border-[var(--theme-deck-a-base)]/50' : 'border-[var(--theme-deck-b-base)]/50',
      glowShadow: color === 'green' ? 'neon-glow-green' : 'neon-glow-purple'
    };
  }, [activeColorTheme, color]);

  // File parsing
  const extension = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
  const baseName = file.name.includes('.') 
    ? file.name.substring(0, file.name.lastIndexOf('.')) 
    : file.name;

  // Memoize callbacks to prevent infinite loops
  const analysisCallbacks = useMemo(() => ({
    onAudioLevels,
    onFrequencyData,
    onStereoData
  }), [onAudioLevels, onFrequencyData, onStereoData]);

  // Audio analysis hook
  useAudioAnalysis(
    isPlaying,
    crossfadeVolume,
    settings.analysis.updateRate,
    audioContext.getNodes,
    analysisCallbacks
  );

  // Volume update effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use both audio element volume AND gain node for complete control
    if (crossfadeVolume === 0) {
      // Complete silence - use audio element volume for immediate cutoff
      audio.volume = 0;
      audioContext.updateVolume(volume, isMuted, 0);
    } else {
      // Normal volume control
      const baseVolume = isMuted ? 0 : volume;
      const finalVolume = baseVolume * crossfadeVolume;
      
      // Set audio element volume
      audio.volume = finalVolume;
      
      // Also set gain node if available
      audioContext.updateVolume(volume, isMuted, crossfadeVolume);
    }
  }, [crossfadeVolume, volume, isMuted, audioContext]);

  // Setup audio context wrapper
  const setupAudioContext = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    await audioContext.setupAudioContext(audio, volume, isMuted, crossfadeVolume);
  }, [audioContext, volume, isMuted, crossfadeVolume]);

  // Initialize audio when file changes
  useEffect(() => {
    // Only initialize if file actually changed
    if (currentFile.current === file) return;
    
    // Cleanup previous resources
    audioContext.cleanup();
    waveform.clearWaveformData();
    
    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    setCanPlay(false);
    setAudioMetadata(null);
    
    currentFile.current = file;
    
    const initializeAudio = async () => {
      try {
        // Clean up old URL
        if (fileUrl.current) {
          URL.revokeObjectURL(fileUrl.current);
          fileUrl.current = null;
        }

        // Create new blob URL and keep reference
        fileUrl.current = URL.createObjectURL(file);

        // Set up audio element
        if (audioRef.current) {
          audioRef.current.src = fileUrl.current;
          audioRef.current.volume = crossfadeVolume === 0 ? 0 : (isMuted ? 0 : volume);
          audioRef.current.preload = 'auto';
          audioRef.current.load();
        }

        // Decode audio for waveform and metadata
        const arrayBuffer = await file.arrayBuffer();
        
        const tempContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);

        // Extract metadata
        const extractedMetadata = await metadata.extractAudioMetadata(audioBuffer, file);
        setAudioMetadata(extractedMetadata);

        await tempContext.close();

        // Generate stereo waveform data
        await waveform.generateStereoWaveformData(audioBuffer);
        setDuration(audioBuffer.duration);

        // Initial state update
        setTimeout(() => {
          setIsLoading(false);
        }, 100);

      } catch (error) {
        console.error('WaveformPlayer: Failed to initialize audio:', error);
        setError(`Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initializeAudio();

    // Cleanup on unmount or file change
    return () => {
      audioContext.cleanup();
    };
  }, [file, audioContext, waveform, metadata, crossfadeVolume, isMuted, volume]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setCanPlay(true);
      
      // Set up audio context when audio is ready
      setupAudioContext();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('WaveformPlayer: Audio error:', e);
      setError('Failed to load audio file');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      setDuration(audio.duration);
    };

    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      // Remove event listeners
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [file, setupAudioContext]);



  // Note: Waveform drawing is now handled by the WaveformDisplay component

  // Playback control functions
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    try {
      if (isPlaying) {
        await audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('WaveformPlayer: Playback error:', error);
      setError('Playback failed');
    }
  }, [isPlaying, canPlay]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (onDeckVolumeChange) {
      onDeckVolumeChange(newVolume);
    } else {
      setInternalVolume(newVolume);
    }
  }, [onDeckVolumeChange]);

  const toggleMute = useCallback(() => {
    if (onMuteChange) {
      onMuteChange(!isMuted);
    } else {
      setInternalIsMuted(!isMuted);
    }
  }, [isMuted, onMuteChange]);

  const handleWaveformClick = useCallback((clickTime: number) => {
    if (!canPlay || duration === 0) return;
    
    if (audioRef.current) {
      audioRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);

      // If linked playback is enabled, notify parent
      if (isLinkedPlayback && onTimeSeek) {
        onTimeSeek(clickTime);
      }
    }
  }, [canPlay, duration, isLinkedPlayback, onTimeSeek]);

  // Expose playback controls to parent
  useImperativeHandle(ref, () => ({
    togglePlayPause,
    play: async () => {
      const audio = audioRef.current;
      if (audio && canPlay && !isPlaying) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('WaveformPlayer: Play error:', error);
        }
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
    },
    setCurrentTime: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    isPlaying: () => isPlaying,
    setVolume: (vol: number) => {
      if (onDeckVolumeChange) {
        onDeckVolumeChange(vol);
      } else {
        setInternalVolume(vol);
      }
    },
    getVolume: () => volume,
    mute: () => {
      if (onMuteChange) onMuteChange(true);
      else setInternalIsMuted(true);
    },
    unmute: () => {
      if (onMuteChange) onMuteChange(false);
      else setInternalIsMuted(false);
    },
    isMuted: () => isMuted,
    setLoop: (looping: boolean) => {
      if (onLoopChange) onLoopChange(looping);
      else setInternalIsLooping(looping);
    },
    getLoop: () => isLooping,
    getAudioNodes: () => audioContext.getNodes()
  }), [togglePlayPause, currentTime, duration, isPlaying, volume, isMuted, isLooping, canPlay, onDeckVolumeChange, onMuteChange, onLoopChange]);
  // Notify parent of play state changes
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  if (error) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-slate-600">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-red-400 text-sm text-center">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              currentFile.current = null; // Force re-initialization
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel rounded-3xl p-4 border border-slate-600 transition-all duration-300 ${
      crossfadeVolume === 0 ? 'opacity-60' : ''
    }`}>
      <audio 
        key={file.name + file.size + file.lastModified} 
        ref={audioRef} 
        preload="auto" 
      />
      
      {/* Header - Shows Controls, Filename, Volume, and Time */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Top Row: Play/Pause, Filename, Extension Badge */}
        <div className="flex items-center gap-3">
          <PlaybackControls
            isPlaying={isPlaying}
            canPlay={canPlay}
            onTogglePlayPause={togglePlayPause}
            config={config}
            crossfadeVolume={crossfadeVolume}
          />
          <h3 className={`text-lg font-semibold ${config.textColor} ${crossfadeVolume === 0 ? 'opacity-50' : ''} truncate flex-grow`} title={file.name}>
            {baseName}
          </h3>
          <div className={`text-[10px] font-bold font-mono px-2 py-1 rounded bg-slate-950/40 ${config.textColor} uppercase tracking-wider ml-auto`}>
            {extension}
          </div>
        </div>

        {/* Bottom Row: Link, Loop, Volume, Timestamp */}
        <div className="flex items-center gap-2">
          {/* Link button */}
          {onToggleLinkedPlayback && (
            <button
              onClick={onToggleLinkedPlayback}
              disabled={isLinkPlaybackDisabled}
              className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLinkedPlayback
                  ? `${config.lightBgColor} ${config.textColor} ${config.borderColor} ${config.glowShadow}`
                  : 'glass-panel text-audio-text-dim hover:text-white border-transparent hover:border-slate-600'
              }`}
              title={isLinkPlaybackDisabled ? 'Load tracks on both decks to link playback' : (isLinkedPlayback ? 'Unlink Decks' : 'Link Deck Playback')}
              style={{ outline: 'none', outlineWidth: 0 }}
            >
              <LinkIcon size={16} className={isLinkedPlayback ? "" : "opacity-50"} />
            </button>
          )}

          {/* Loop button */}
          <button
            onClick={() => {
              if (onLoopChange) onLoopChange(!isLooping);
              else setInternalIsLooping(l => !l);
            }}
            className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center flex-shrink-0 ${
              isLooping
                ? `${config.lightBgColor} ${config.textColor} ${config.borderColor} ${config.glowShadow}`
                : 'glass-panel text-audio-text-dim hover:text-white border-transparent hover:border-slate-600'
            }`}
            title={isLooping ? "Disable Loop" : "Enable Loop"}
            style={{ outline: 'none', outlineWidth: 0 }}
          >
            <Repeat size={16} className={isLooping ? "" : "opacity-50"} />
          </button>

          <div className="flex-grow flex items-center min-w-[60px]">
            <VolumeControls
              volume={volume}
              isMuted={isMuted}
              config={{
                waveColor: config.waveColor
              }}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />
          </div>
          
          <div className="text-xs text-audio-text-dim font-mono bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700 whitespace-nowrap ml-auto">
            {metadata.formatTime(currentTime)} / {metadata.formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Stereo Waveforms */}
      <WaveformDisplay
          isLoading={isLoading}
          config={{
            waveColor: config.waveColor,
            bgColor: config.bgColor,
            hoverColor: config.hoverColor,
            textColor: config.textColor
          }}
          currentTime={currentTime}
          duration={duration}
          crossfadeVolume={crossfadeVolume}
          onWaveformClick={handleWaveformClick}
          canPlay={canPlay}
          waveformHook={waveform}
        />

      {/* Constraints underneath waveform */}
      <div className="flex items-center justify-center mt-3">
        {/* Metadata in Center */}
        <AudioMetadataDisplay
          file={file}
          audioMetadata={audioMetadata}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
    </div>
  );
});
