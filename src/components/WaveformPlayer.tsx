import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';
import { useSettings } from '../contexts/SettingsContext';
import { useAudioContext } from '../hooks/useAudioContext';
import { useWaveform } from '../hooks/useWaveform';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';
import { useAudioMetadata, AudioMetadata } from '../hooks/useAudioMetadata';
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
    crossfadeVolume = 1
  },
  ref
) => {
  // Get settings for configurable analysis update rate
  const { settings } = useSettings();

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
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);

  // Color configuration
  const colorConfig = {
    green: {
      waveColor: '#10b981',
      bgColor: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      textColor: 'text-emerald-400'
    },
    purple: {
      waveColor: '#8b5cf6',
      bgColor: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      textColor: 'text-purple-400'
    }
  };

  const config = colorConfig[color];

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
    
    console.log('WaveformPlayer: Initializing audio for:', file?.name || 'null');
    
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
          console.log('WaveformPlayer: Revoked old object URL.');
        }

        // Create new blob URL and keep reference
        fileUrl.current = URL.createObjectURL(file);
        console.log('WaveformPlayer: Created new object URL:', fileUrl.current);

        // Set up audio element
        if (audioRef.current) {
          audioRef.current.src = fileUrl.current;
          audioRef.current.volume = crossfadeVolume === 0 ? 0 : (isMuted ? 0 : volume);
          audioRef.current.preload = 'auto';
          audioRef.current.load();
          console.log('WaveformPlayer: Audio element source set and loaded.');
        }

        // Decode audio for waveform and metadata
        console.log('WaveformPlayer: Starting audio decode...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('WaveformPlayer: Got array buffer, size:', arrayBuffer.byteLength);
        
        const tempContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
        console.log('WaveformPlayer: Audio decoded successfully.');

        // Extract metadata
        const extractedMetadata = await metadata.extractAudioMetadata(audioBuffer, file);
        setAudioMetadata(extractedMetadata);
        console.log('WaveformPlayer: Audio metadata:', extractedMetadata);

        await tempContext.close();
        console.log('WaveformPlayer: Temporary audio context closed.');

        // Generate stereo waveform data
        await waveform.generateStereoWaveformData(audioBuffer);
        setDuration(audioBuffer.duration);
        console.log('WaveformPlayer: Waveform data generated and duration set.');

        // Initial state update
        setTimeout(() => {
          setIsLoading(false);
          console.log('WaveformPlayer: Audio initialized successfully.');
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
      console.log('WaveformPlayer: Audio can play.');
      setCanPlay(true);
      
      // Set up audio context when audio is ready
      setupAudioContext();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('WaveformPlayer: Audio ended.');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('WaveformPlayer: Audio error:', e);
      setError('Failed to load audio file');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('WaveformPlayer: Audio load started.');
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      console.log('WaveformPlayer: Audio data loaded.');
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
        console.log('WaveformPlayer: Playback paused.');
      } else {
        await audio.play();
        setIsPlaying(true);
        console.log('WaveformPlayer: Playback started.');
      }
    } catch (error) {
      console.error('WaveformPlayer: Playback error:', error);
      setError('Playback failed');
    }
  }, [isPlaying, canPlay]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleWaveformClick = useCallback((clickTime: number) => {
    if (!canPlay || duration === 0) return;
    
    if (audioRef.current) {
      audioRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);
    }
  }, [canPlay, duration]);

  // Initialize audio when file changes
  useEffect(() => {
    // Only initialize if file actually changed
    if (currentFile.current === file) return;
    
    console.log('WaveformPlayer: Initializing audio for:', file?.name || 'null');
    
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
          console.log('WaveformPlayer: Revoked old object URL.');
        }

        // Create new blob URL and keep reference
        fileUrl.current = URL.createObjectURL(file);
        console.log('WaveformPlayer: Created new object URL:', fileUrl.current);

        // Set up audio element
        if (audioRef.current) {
          audioRef.current.src = fileUrl.current;
          audioRef.current.volume = crossfadeVolume === 0 ? 0 : (isMuted ? 0 : volume);
          audioRef.current.preload = 'auto';
          audioRef.current.load();
          console.log('WaveformPlayer: Audio element source set and loaded.');
        }

        // Decode audio for waveform and metadata
        console.log('WaveformPlayer: Starting audio decode...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('WaveformPlayer: Got array buffer, size:', arrayBuffer.byteLength);
        
        const tempContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
        console.log('WaveformPlayer: Audio decoded successfully.');

        // Extract metadata
        const extractedMetadata = await metadata.extractAudioMetadata(audioBuffer, file);
        setAudioMetadata(extractedMetadata);
        console.log('WaveformPlayer: Audio metadata:', extractedMetadata);

        await tempContext.close();
        console.log('WaveformPlayer: Temporary audio context closed.');

        // Generate stereo waveform data
        await waveform.generateStereoWaveformData(audioBuffer);
        setDuration(audioBuffer.duration);
        console.log('WaveformPlayer: Waveform data generated and duration set.');

        // Initial state update
        setTimeout(() => {
          setIsLoading(false);
          console.log('WaveformPlayer: Audio initialized successfully.');
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
      setVolume(vol);
    },
    getVolume: () => volume,
    mute: () => setIsMuted(true),
    unmute: () => setIsMuted(false),
    isMuted: () => isMuted
  }), [togglePlayPause, currentTime, duration, isPlaying, volume, isMuted, canPlay]);
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
    <div className={`glass-panel rounded-3xl p-6 border border-slate-600 transition-all duration-300 ${
      crossfadeVolume === 0 ? 'opacity-60' : ''
    }`}>
      <audio 
        key={file.name + file.size + file.lastModified} 
        ref={audioRef} 
        preload="auto" 
      />
      
      {/* Header - Shows filename and time */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-base font-semibold ${config.textColor} ${crossfadeVolume === 0 ? 'opacity-50' : ''} truncate`}>
          {file.name}
        </h3>
        <div className="text-xs text-audio-text-dim font-mono">
          {metadata.formatTime(currentTime)} / {metadata.formatTime(duration)}
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

      {/* Controls with Inline Metadata */}
      <div className="flex items-center justify-between">
        {/* Play Button */}
        <PlaybackControls
          isPlaying={isPlaying}
          canPlay={canPlay}
          onTogglePlayPause={togglePlayPause}
          config={config}
          crossfadeVolume={crossfadeVolume}
        />

        {/* Metadata in Center */}
        <AudioMetadataDisplay
          file={file}
          audioMetadata={audioMetadata}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Volume Control */}
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
    </div>
  );
});