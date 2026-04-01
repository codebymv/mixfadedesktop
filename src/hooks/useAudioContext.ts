import { useRef, useCallback } from 'react';

export interface AudioContextNodes {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  gainNode: GainNode | null;
  splitterNode: ChannelSplitterNode | null;
  leftAnalyser: AnalyserNode | null;
  rightAnalyser: AnalyserNode | null;
}

export const useAudioContext = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const splitterNode = useRef<ChannelSplitterNode | null>(null);
  const leftAnalyser = useRef<AnalyserNode | null>(null);
  const rightAnalyser = useRef<AnalyserNode | null>(null);
  const isAudioContextSetup = useRef<boolean>(false);
  const nodesSnapshot = useRef<AudioContextNodes>({
    audioContext: null,
    sourceNode: null,
    analyserNode: null,
    gainNode: null,
    splitterNode: null,
    leftAnalyser: null,
    rightAnalyser: null,
  });

  const setupAudioContext = useCallback(async (audioElement: HTMLAudioElement, volume: number, isMuted: boolean, crossfadeVolume: number) => {
    if (!audioElement || isAudioContextSetup.current) return;

    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }

      if (!sourceNode.current) {
        sourceNode.current = audioContext.current.createMediaElementSource(audioElement);
        analyserNode.current = audioContext.current.createAnalyser();
        gainNode.current = audioContext.current.createGain();
        
        // Create stereo analysis setup
        splitterNode.current = audioContext.current.createChannelSplitter(2);
        leftAnalyser.current = audioContext.current.createAnalyser();
        rightAnalyser.current = audioContext.current.createAnalyser();
        
        // Configure analysers
        analyserNode.current.fftSize = 2048;
        leftAnalyser.current.fftSize = 2048;
        rightAnalyser.current.fftSize = 2048;
        
        // Raw signal to analysers, full volume control to output
        sourceNode.current.connect(splitterNode.current);
        sourceNode.current.connect(analyserNode.current);
        splitterNode.current.connect(leftAnalyser.current, 0);
        splitterNode.current.connect(rightAnalyser.current, 1);
        
        // Full volume control chain for output
        sourceNode.current.connect(gainNode.current);
        gainNode.current.connect(audioContext.current.destination);
        
        // Set initial gain based on crossfade
        const baseVolume = isMuted ? 0 : volume;
        const finalVolume = baseVolume * (crossfadeVolume || 1);
        gainNode.current.gain.setValueAtTime(finalVolume, audioContext.current.currentTime);
        
        isAudioContextSetup.current = true;
      }
    } catch (error) {
      console.warn('Audio context setup failed:', error);
    }
  }, []);

  const updateVolume = useCallback((volume: number, isMuted: boolean, crossfadeVolume: number) => {
    if (gainNode.current && audioContext.current) {
      try {
        const currentTime = audioContext.current.currentTime;
        const baseVolume = isMuted ? 0 : volume;
        const finalVolume = baseVolume * crossfadeVolume;
        
        gainNode.current.gain.cancelScheduledValues(currentTime);
        gainNode.current.gain.setValueAtTime(finalVolume, currentTime);
      } catch (error) {
        console.warn('Gain node update failed:', error);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    // Disconnect all Web Audio API nodes in proper order
    if (sourceNode.current) {
      try {
        sourceNode.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      sourceNode.current = null;
    }
    
    if (gainNode.current) {
      try {
        gainNode.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      gainNode.current = null;
    }

    if (splitterNode.current) {
      try {
        splitterNode.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      splitterNode.current = null;
    }

    if (leftAnalyser.current) {
      try {
        leftAnalyser.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      leftAnalyser.current = null;
    }

    if (rightAnalyser.current) {
      try {
        rightAnalyser.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      rightAnalyser.current = null;
    }

    if (analyserNode.current) {
      try {
        analyserNode.current.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      analyserNode.current = null;
    }
    
    // Close and reset audio context to ensure fresh state
    if (audioContext.current && audioContext.current.state !== 'closed') {
      try {
        audioContext.current.close();
      } catch {
        // Ignore close errors during cleanup
      }
    }
    audioContext.current = null;
    isAudioContextSetup.current = false;
    
  }, []);

  const getNodes = useCallback((): AudioContextNodes => {
    nodesSnapshot.current.audioContext = audioContext.current;
    nodesSnapshot.current.sourceNode = sourceNode.current;
    nodesSnapshot.current.analyserNode = analyserNode.current;
    nodesSnapshot.current.gainNode = gainNode.current;
    nodesSnapshot.current.splitterNode = splitterNode.current;
    nodesSnapshot.current.leftAnalyser = leftAnalyser.current;
    nodesSnapshot.current.rightAnalyser = rightAnalyser.current;
    return nodesSnapshot.current;
  }, []);

  return {
    setupAudioContext,
    updateVolume,
    cleanup,
    getNodes,
    isSetup: () => isAudioContextSetup.current
  };
};
