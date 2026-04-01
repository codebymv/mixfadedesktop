import { act, renderHook } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useVisualizerState } from '../../src/hooks/useVisualizerState';

type ActivityId = 'files' | 'analysis' | 'visualizer' | 'settings' | 'help';

const createFile = (name: string) =>
  new File(['audio'], name, { type: 'audio/wav', lastModified: 1711929600000 });

const createAudioNodes = () => ({
  audioContext: null,
  sourceNode: null,
  analyserNode: {
    frequencyBinCount: 8,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  },
  gainNode: null,
  splitterNode: null,
  leftAnalyser: null,
  rightAnalyser: null,
});

const createWaveformRefValue = () => ({
  togglePlayPause: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  setCurrentTime: jest.fn(),
  getCurrentTime: jest.fn(() => 0),
  getDuration: jest.fn(() => 0),
  isPlaying: jest.fn(() => false),
  setVolume: jest.fn(),
  getVolume: jest.fn(() => 1),
  mute: jest.fn(),
  unmute: jest.fn(),
  isMuted: jest.fn(() => false),
  setLoop: jest.fn(),
  getLoop: jest.fn(() => false),
  getAudioNodes: jest.fn(createAudioNodes),
});

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  postMessage = jest.fn();
  close = jest.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }
}

function renderVisualizerHook(
  override: Partial<Parameters<typeof useVisualizerState>[0]> = {}
) {
  const setActiveActivity = jest.fn();
  const setDeckALooping = jest.fn();
  const setDeckBLooping = jest.fn();

  const wrapper = renderHook(() => {
    const [activeActivity, setActivity] = useState<ActivityId>('files');
    const waveformPlayerARef = useRef(createWaveformRefValue());
    const waveformPlayerBRef = useRef(createWaveformRefValue());
    const lastNonVisualizerActivityRef = useRef<ActivityId>('analysis');

    return useVisualizerState({
      activeActivity,
      setActiveActivity: ((next) => {
        setActiveActivity(next);
        setActivity(next as ActivityId);
      }) as React.Dispatch<React.SetStateAction<ActivityId>>,
      lastNonVisualizerActivityRef,
      waveformPlayerARef,
      waveformPlayerBRef,
      trackA: createFile('deck-a.wav'),
      trackB: createFile('deck-b.wav'),
      isTrackAPlaying: true,
      isTrackBPlaying: false,
      deckAVolume: 0.8,
      deckBVolume: 0.6,
      deckAMuted: false,
      deckBMuted: false,
      volumeA: 1,
      volumeB: 0,
      setDeckALooping,
      setDeckBLooping,
      ...override,
    });
  });

  return { ...wrapper, setActiveActivity, setDeckALooping, setDeckBLooping };
}

describe('useVisualizerState Hook', () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    MockBroadcastChannel.instances = [];
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      writable: true,
      value: MockBroadcastChannel,
    });
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: jest.fn(() => 1),
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      writable: true,
      value: originalBroadcastChannel,
    });
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: originalCancelAnimationFrame,
    });
  });

  it('saves, loads, and deletes visualizer seeds', () => {
    const { result } = renderVisualizerHook();

    act(() => {
      result.current.saveVisualizerSeed();
    });

    expect(result.current.savedVisualizerSeeds).toHaveLength(1);
    const savedSeed = result.current.savedVisualizerSeeds[0];
    expect(savedSeed.seed).toBe(result.current.visualizerSeed);
    expect(localStorage.getItem('mixfade-vis-seeds')).toContain(String(savedSeed.seed));

    act(() => {
      result.current.loadVisualizerSeed(12345);
    });

    expect(result.current.visualizerSeed).toBe(12345);

    act(() => {
      result.current.deleteVisualizerSeed(savedSeed.id);
    });

    expect(result.current.savedVisualizerSeeds).toHaveLength(0);
  });

  it('opens the external visualizer through the registered callback', () => {
    const { result } = renderVisualizerHook();
    const openExternalWindow = jest.fn();

    act(() => {
      result.current.handleExternalVisualizerReady(openExternalWindow);
      result.current.openExternalVisualizerWindow();
    });

    expect(openExternalWindow).toHaveBeenCalledTimes(1);
  });

  it('returns to the last non-visualizer activity when the external window opens', () => {
    const { result, setActiveActivity } = renderVisualizerHook({
      activeActivity: 'visualizer',
    });

    act(() => {
      result.current.handleExternalVisualizerWindowStateChange(true);
    });

    expect(result.current.isVisualizerWindowOpen).toBe(true);
    expect(setActiveActivity).toHaveBeenCalledWith('analysis');
  });

  it('toggles the dominant deck loop state', () => {
    const { result, setDeckALooping, setDeckBLooping } = renderVisualizerHook({
      isTrackAPlaying: true,
      isTrackBPlaying: true,
      deckAVolume: 0.9,
      deckBVolume: 0.5,
      volumeA: 1,
      volumeB: 1,
    });

    act(() => {
      result.current.toggleVisualizerLoop();
    });

    expect(setDeckALooping).toHaveBeenCalledTimes(1);
    expect(setDeckBLooping).not.toHaveBeenCalled();
    expect(typeof setDeckALooping.mock.calls[0][0]).toBe('function');
  });

  it('creates a broadcast channel when supported and publishes visualizer state frames', () => {
    renderVisualizerHook();

    expect(MockBroadcastChannel.instances).toHaveLength(1);
    expect(MockBroadcastChannel.instances[0].name).toBe('mixfade-visualizer');
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  it('gracefully skips broadcast setup when BroadcastChannel is unavailable', () => {
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const { result } = renderVisualizerHook();

    expect(result.current.isVisualizerWindowOpen).toBe(false);
    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
