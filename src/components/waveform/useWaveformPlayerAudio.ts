import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import type { AudioMetadata, useAudioMetadata } from '../../hooks/useAudioMetadata';
import type { useAudioContext } from '../../hooks/useAudioContext';
import type { useWaveform } from '../../hooks/useWaveform';

interface UseWaveformPlayerAudioParams {
  file: File;
  volume: number;
  isMuted: boolean;
  crossfadeVolume: number;
  isLooping: boolean;
  audioContext: ReturnType<typeof useAudioContext>;
  waveform: ReturnType<typeof useWaveform>;
  metadata: ReturnType<typeof useAudioMetadata>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
}

interface UseWaveformPlayerAudioResult {
  audioRef: RefObject<HTMLAudioElement>;
  currentTime: number;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  duration: number;
  isLoading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  canPlay: boolean;
  audioMetadata: AudioMetadata | null;
  retry: () => void;
}

export function useWaveformPlayerAudio({
  file,
  volume,
  isMuted,
  crossfadeVolume,
  isLooping,
  audioContext,
  waveform,
  metadata,
  setIsPlaying
}: UseWaveformPlayerAudioParams): UseWaveformPlayerAudioResult {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileUrl = useRef<string | null>(null);
  const currentFile = useRef<File | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (crossfadeVolume === 0) {
      audio.volume = 0;
      audioContext.updateVolume(volume, isMuted, 0);
    } else {
      const baseVolume = isMuted ? 0 : volume;
      const finalVolume = baseVolume * crossfadeVolume;

      audio.volume = finalVolume;
      audioContext.updateVolume(volume, isMuted, crossfadeVolume);
    }
  }, [crossfadeVolume, volume, isMuted, audioContext]);

  const setupAudioContext = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    await audioContext.setupAudioContext(audio, volume, isMuted, crossfadeVolume);
  }, [audioContext, volume, isMuted, crossfadeVolume]);

  useEffect(() => {
    if (currentFile.current === file) return;

    audioContext.cleanup();
    waveform.clearWaveformData();

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
        if (fileUrl.current) {
          URL.revokeObjectURL(fileUrl.current);
          fileUrl.current = null;
        }

        fileUrl.current = URL.createObjectURL(file);

        if (audioRef.current) {
          audioRef.current.src = fileUrl.current;
          audioRef.current.volume = crossfadeVolume === 0 ? 0 : (isMuted ? 0 : volume);
          audioRef.current.preload = 'auto';
          audioRef.current.load();
        }

        const arrayBuffer = await file.arrayBuffer();

        const tempContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);

        const extractedMetadata = await metadata.extractAudioMetadata(audioBuffer, file);
        setAudioMetadata(extractedMetadata);

        await tempContext.close();

        await waveform.generateStereoWaveformData(audioBuffer);
        setDuration(audioBuffer.duration);

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

    return () => {
      audioContext.cleanup();
    };
  }, [file, audioContext, waveform, metadata, crossfadeVolume, isMuted, volume, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setCanPlay(true);
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

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [file, setupAudioContext, setIsPlaying]);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    currentFile.current = null;
  }, []);

  return {
    audioRef,
    currentTime,
    setCurrentTime,
    duration,
    isLoading,
    error,
    setError,
    canPlay,
    audioMetadata,
    retry
  };
}
