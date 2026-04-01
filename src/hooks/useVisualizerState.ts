import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_VIS_SEED, getPresetEntryForSeed } from '../components/VisualizerMode';
import type { VisualizerBroadcastMessage } from '../components/ExternalVisualizerWindow';
import type { SavedSeed } from '../components/sidebar/VisualizerPanel';
import type { WaveformPlayerRef } from '../components/WaveformPlayer';
import type { AudioContextNodes } from './useAudioContext';

type ActivityId = 'files' | 'analysis' | 'visualizer' | 'settings' | 'help';

interface UseVisualizerStateOptions {
  activeActivity: ActivityId;
  setActiveActivity: React.Dispatch<React.SetStateAction<ActivityId>>;
  lastNonVisualizerActivityRef: React.MutableRefObject<ActivityId>;
  waveformPlayerARef: React.RefObject<WaveformPlayerRef>;
  waveformPlayerBRef: React.RefObject<WaveformPlayerRef>;
  trackA: File | null;
  trackB: File | null;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  deckAVolume: number;
  deckBVolume: number;
  deckAMuted: boolean;
  deckBMuted: boolean;
  volumeA: number;
  volumeB: number;
  setDeckALooping: React.Dispatch<React.SetStateAction<boolean>>;
  setDeckBLooping: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseVisualizerStateResult {
  isVisualizerWindowOpen: boolean;
  visualizerSeed: number;
  savedVisualizerSeeds: SavedSeed[];
  visualizerAudioNodesA: AudioContextNodes | null;
  visualizerAudioNodesB: AudioContextNodes | null;
  visualizerMixA: number;
  visualizerMixB: number;
  rollVisualizerSeed: () => void;
  saveVisualizerSeed: () => void;
  loadVisualizerSeed: (seed: number) => void;
  deleteVisualizerSeed: (id: string) => void;
  toggleVisualizerLoop: () => void;
  handleExternalVisualizerReady: (openExternalWindow: (() => void) | null) => void;
  handleExternalVisualizerWindowStateChange: (isOpen: boolean) => void;
  openExternalVisualizerWindow: () => void;
}

const SAVED_SEEDS_KEY = 'mixfade-vis-seeds';

export function useVisualizerState({
  activeActivity,
  setActiveActivity,
  lastNonVisualizerActivityRef,
  waveformPlayerARef,
  waveformPlayerBRef,
  trackA,
  trackB,
  isTrackAPlaying,
  isTrackBPlaying,
  deckAVolume,
  deckBVolume,
  deckAMuted,
  deckBMuted,
  volumeA,
  volumeB,
  setDeckALooping,
  setDeckBLooping,
}: UseVisualizerStateOptions): UseVisualizerStateResult {
  const [isVisualizerWindowOpen, setIsVisualizerWindowOpen] = useState(false);
  const [visualizerSeed, setVisualizerSeed] = useState(DEFAULT_VIS_SEED);
  const [savedVisualizerSeeds, setSavedVisualizerSeeds] = useState<SavedSeed[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEEDS_KEY);
      return stored ? (JSON.parse(stored) as SavedSeed[]) : [];
    } catch {
      return [];
    }
  });
  const openExternalVisualizerWindowRef = useRef<(() => void) | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const visualizerAudioNodesA = typeof waveformPlayerARef.current?.getAudioNodes === 'function'
    ? waveformPlayerARef.current.getAudioNodes()
    : null;
  const visualizerAudioNodesB = typeof waveformPlayerBRef.current?.getAudioNodes === 'function'
    ? waveformPlayerBRef.current.getAudioNodes()
    : null;
  const visualizerMixA = deckAMuted ? 0 : deckAVolume * volumeA;
  const visualizerMixB = deckBMuted ? 0 : deckBVolume * volumeB;

  const rollVisualizerSeed = useCallback(() => {
    setVisualizerSeed((Math.random() * 0xffffffff) >>> 0);
  }, []);

  const saveVisualizerSeed = useCallback(() => {
    setSavedVisualizerSeeds(prev => {
      if (prev.some(seedEntry => seedEntry.seed === visualizerSeed)) return prev;
      const [name] = getPresetEntryForSeed(visualizerSeed);
      return [...prev, { id: Date.now().toString(), seed: visualizerSeed, name, savedAt: Date.now() }];
    });
  }, [visualizerSeed]);

  const loadVisualizerSeed = useCallback((seed: number) => {
    setVisualizerSeed(seed);
  }, []);

  const deleteVisualizerSeed = useCallback((id: string) => {
    setSavedVisualizerSeeds(prev => prev.filter(seedEntry => seedEntry.id !== id));
  }, []);

  const handleExternalVisualizerReady = useCallback((openExternalWindow: (() => void) | null) => {
    openExternalVisualizerWindowRef.current = openExternalWindow;
  }, []);

  const handleExternalVisualizerWindowStateChange = useCallback((isOpen: boolean) => {
    setIsVisualizerWindowOpen(isOpen);
    if (isOpen && activeActivity === 'visualizer') {
      setActiveActivity(lastNonVisualizerActivityRef.current);
    }
  }, [activeActivity, lastNonVisualizerActivityRef, setActiveActivity]);

  const openExternalVisualizerWindow = useCallback(() => {
    openExternalVisualizerWindowRef.current?.();
  }, []);

  const toggleVisualizerLoop = useCallback(() => {
    const aPlaying = isTrackAPlaying && Boolean(trackA);
    const bPlaying = isTrackBPlaying && Boolean(trackB);
    const dominant =
      aPlaying && bPlaying ? (visualizerMixA >= visualizerMixB ? 'A' : 'B') :
      aPlaying ? 'A' :
      bPlaying ? 'B' :
      trackA ? 'A' : 'B';

    if (dominant === 'A') {
      setDeckALooping(looping => !looping);
      return;
    }

    setDeckBLooping(looping => !looping);
  }, [
    isTrackAPlaying,
    isTrackBPlaying,
    trackA,
    trackB,
    visualizerMixA,
    visualizerMixB,
    setDeckALooping,
    setDeckBLooping,
  ]);

  useEffect(() => {
    localStorage.setItem(SAVED_SEEDS_KEY, JSON.stringify(savedVisualizerSeeds));
  }, [savedVisualizerSeeds]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    broadcastChannelRef.current = new BroadcastChannel('mixfade-visualizer');
    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  useEffect(() => {
    let raf = 0;

    const send = () => {
      raf = requestAnimationFrame(send);
      const channel = broadcastChannelRef.current;
      if (!channel) return;

      const aPlaying = isTrackAPlaying && Boolean(trackA);
      const bPlaying = isTrackBPlaying && Boolean(trackB);
      const dominant =
        aPlaying && bPlaying ? (visualizerMixA >= visualizerMixB ? 'A' : 'B') :
        aPlaying ? 'A' :
        bPlaying ? 'B' :
        trackA ? 'A' : 'B';

      const nodes = dominant === 'A' ? visualizerAudioNodesA : visualizerAudioNodesB;
      const analyser = nodes?.analyserNode ?? null;
      const fftSize = analyser?.frequencyBinCount ?? 1024;
      const frequencyData = new Uint8Array(fftSize);
      const timeDomainData = new Uint8Array(fftSize);

      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);
      }

      const bothAudible = visualizerMixA > 0.01 && visualizerMixB > 0.01;
      const deckLabel = bothAudible ? 'Deck A · Deck B' : dominant ? `Deck ${dominant}` : '';
      const nameA = trackA?.name?.replace(/\.[^.]+$/, '') ?? '';
      const nameB = trackB?.name?.replace(/\.[^.]+$/, '') ?? '';
      const trackLabel =
        aPlaying && bPlaying ? [nameA, nameB].filter(Boolean).join('  ◆  ') :
        aPlaying ? nameA :
        bPlaying ? nameB :
        nameA || nameB || '';

      const [presetRawName] = getPresetEntryForSeed(visualizerSeed);
      const idx = presetRawName.lastIndexOf(' - ');
      const presetName = (idx !== -1 ? presetRawName.slice(idx + 3).trim() : presetRawName)
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      const message: VisualizerBroadcastMessage = {
        type: 'visualizer-state',
        seed: visualizerSeed,
        isPlaying: aPlaying || bPlaying,
        trackLabel,
        deckLabel,
        presetName,
        frequencyData: Array.from(frequencyData),
        timeDomainData: Array.from(timeDomainData),
      };

      channel.postMessage(message);
    };

    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    raf = requestAnimationFrame(send);
    return () => cancelAnimationFrame(raf);
  }, [
    isTrackAPlaying,
    isTrackBPlaying,
    trackA,
    trackB,
    visualizerMixA,
    visualizerMixB,
    visualizerAudioNodesA,
    visualizerAudioNodesB,
    visualizerSeed,
  ]);

  return {
    isVisualizerWindowOpen,
    visualizerSeed,
    savedVisualizerSeeds,
    visualizerAudioNodesA,
    visualizerAudioNodesB,
    visualizerMixA,
    visualizerMixB,
    rollVisualizerSeed,
    saveVisualizerSeed,
    loadVisualizerSeed,
    deleteVisualizerSeed,
    toggleVisualizerLoop,
    handleExternalVisualizerReady,
    handleExternalVisualizerWindowStateChange,
    openExternalVisualizerWindow,
  };
}
