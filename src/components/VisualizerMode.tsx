import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import butterchurn, { ButterchurnVisualizer } from 'butterchurn';
import isButterchurnSupported from 'butterchurn/lib/isSupported.min';
import type { AudioContextNodes } from '../hooks/useAudioContext';
import { DEFAULT_VIS_SEED, getPresetEntryForSeed } from './visualizerPresets';
import { writeDetachedVisualizerDocument } from './visualizer/detachedWindow';
import { VisualizerEmptyStates } from './visualizer/VisualizerEmptyStates';
import { VisualizerHud } from './visualizer/VisualizerHud';
import { ACTIVE_PRESET_BLEND_SECONDS, TARGET_FPS, getRenderScale } from './visualizer/visualizerRuntime';
import { normalizePresetName } from './visualizer/visualizerText';

interface VisualizerModeProps {
  trackAFile?: File | null;
  trackBFile?: File | null;
  audioNodesA?: AudioContextNodes | null;
  audioNodesB?: AudioContextNodes | null;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
  volumeA: number;
  volumeB: number;
  isTransitioning?: boolean;
  isActive?: boolean;
  seed?: number;
  onPlayPause?: () => void;
  isLoopingA?: boolean;
  isLoopingB?: boolean;
  onToggleLoop?: () => void;
  onRollSeed?: () => void;
  onSaveSeed?: () => void;
  isSeedSaved?: boolean;
  onExternalWindowReady?: (openExternalWindow: (() => void) | null) => void;
  onExternalWindowStateChange?: (isOpen: boolean) => void;
}

export const VisualizerMode = memo(function VisualizerMode({
  trackAFile,
  trackBFile,
  audioNodesA,
  audioNodesB,
  isTrackAPlaying = false,
  isTrackBPlaying = false,
  volumeA,
  volumeB,
  isTransitioning = false,
  isActive = false,
  seed = DEFAULT_VIS_SEED,
  onPlayPause,
  isLoopingA = false,
  isLoopingB = false,
  onToggleLoop,
  onRollSeed,
  onSaveSeed,
  isSeedSaved = false,
  onExternalWindowReady,
  onExternalWindowStateChange,
}: VisualizerModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ButterchurnVisualizer | null>(null);
  const connectedNodeRef = useRef<AudioNode | null>(null);
  const connectedContextRef = useRef<AudioContext | null>(null);
  const loadedPresetNameRef = useRef('');
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeFrameRef = useRef(0);
  const presetEntryRef = useRef<[string, unknown]>(getPresetEntryForSeed(seed));
  const detachedWindowRef = useRef<Window | null>(null);
  const detachedStreamRef = useRef<MediaStream | null>(null);
  const [supported, setSupported] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' ? true : !document.hidden);
  const [isDetachedWindowOpen, setIsDetachedWindowOpen] = useState(false);
  const [showHud, setShowHud] = useState(true);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHudTimer = useCallback(() => {
    setShowHud(true);
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = setTimeout(() => {
      setShowHud(false);
    }, 3000); // 3 seconds of inactivity
  }, []);

  useEffect(() => {
    resetHudTimer();
    return () => {
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
    };
  }, [resetHudTimer, seed]);

  const presetEntry = useMemo(() => getPresetEntryForSeed(seed), [seed]);
  const audioContextA = audioNodesA?.audioContext ?? null;
  const audioContextB = audioNodesB?.audioContext ?? null;
  const gainNodeA = audioNodesA?.gainNode ?? null;
  const gainNodeB = audioNodesB?.gainNode ?? null;
  const loadedInput = useMemo(() => {
    const candidates = [
      { deck: 'A' as const, mix: volumeA, file: trackAFile, audioContext: audioContextA, gainNode: gainNodeA },
      { deck: 'B' as const, mix: volumeB, file: trackBFile, audioContext: audioContextB, gainNode: gainNodeB },
    ].filter(item => item.file && item.audioContext && item.gainNode);
    return candidates.length ? candidates.sort((a, b) => b.mix - a.mix)[0] : null;
  }, [audioContextA, audioContextB, gainNodeA, gainNodeB, trackAFile, trackBFile, volumeA, volumeB]);
  const playingInput = useMemo(() => {
    const candidates = [
      { deck: 'A' as const, mix: volumeA, file: trackAFile, audioContext: audioContextA, gainNode: gainNodeA, isPlaying: isTrackAPlaying },
      { deck: 'B' as const, mix: volumeB, file: trackBFile, audioContext: audioContextB, gainNode: gainNodeB, isPlaying: isTrackBPlaying },
    ].filter(item => item.file && item.audioContext && item.gainNode && item.isPlaying);
    return candidates.length ? candidates.sort((a, b) => b.mix - a.mix)[0] : null;
  }, [audioContextA, audioContextB, gainNodeA, gainNodeB, isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile, volumeA, volumeB]);
  const sourceInput = playingInput ?? loadedInput;
  const hasLoadedDeck = Boolean(trackAFile || trackBFile);
  const isPlaying = Boolean(playingInput);
  const isLooping = sourceInput?.deck === 'A' ? isLoopingA : isLoopingB;
  const bothAudible = volumeA > 0.01 && volumeB > 0.01;
  const deckLabel = bothAudible ? 'Deck A · Deck B' : sourceInput?.deck ? `Deck ${sourceInput.deck}` : '';
  const deckCssKey = sourceInput?.deck === 'B' ? 'b' : 'a';
  const deckTextVar = `var(--theme-deck-${deckCssKey}-text)`;
  const deckBaseRgbVar = `var(--theme-deck-${deckCssKey}-base-rgb)`;
  const presetDisplayName = useMemo(() => normalizePresetName(presetEntry[0]), [presetEntry]);
  const activeTrackLabel = useMemo(() => {
    const nameA = trackAFile?.name?.replace(/\.[^.]+$/, '') ?? '';
    const nameB = trackBFile?.name?.replace(/\.[^.]+$/, '') ?? '';
    if (isTrackAPlaying && isTrackBPlaying) return [nameA, nameB].filter(Boolean).join('  ◆  ') || '';
    if (isTrackAPlaying && nameA) return nameA;
    if (isTrackBPlaying && nameB) return nameB;
    return nameA || nameB || '';
  }, [isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile]);

  const stopDetachedStream = useCallback(() => {
    detachedStreamRef.current?.getTracks().forEach(track => track.stop());
    detachedStreamRef.current = null;
  }, []);

  const updateDetachedWindowHud = useCallback(() => {
    const detachedWindow = detachedWindowRef.current;
    if (!detachedWindow || detachedWindow.closed) {
      detachedWindowRef.current = null;
      setIsDetachedWindowOpen(false);
      return;
    }

    detachedWindow.document.title = activeTrackLabel
      ? `${activeTrackLabel} · MixFade Visualizer`
      : 'MixFade Visualizer';

    const leftCard = detachedWindow.document.getElementById('mixfade-detached-left');
    const deckLabelEl = detachedWindow.document.getElementById('mixfade-detached-deck-label');
    const trackLabelEl = detachedWindow.document.getElementById('mixfade-detached-track-label');
    const rightCard = detachedWindow.document.getElementById('mixfade-detached-right');
    const seedLabelEl = detachedWindow.document.getElementById('mixfade-detached-seed-label');

    if (leftCard && deckLabelEl && trackLabelEl) {
      leftCard.setAttribute('style', deckLabel ? 'display:block' : 'display:none');
      deckLabelEl.textContent = deckLabel;
      trackLabelEl.textContent = activeTrackLabel || 'No active audio';
    }

    if (rightCard && seedLabelEl) {
      rightCard.setAttribute('style', presetDisplayName ? 'display:block' : 'display:none');
      seedLabelEl.textContent = presetDisplayName;
    }
  }, [activeTrackLabel, deckLabel, presetDisplayName]);

  const syncDetachedWindowStream = useCallback(() => {
    const detachedWindow = detachedWindowRef.current;
    const canvas = canvasRef.current;
    if (!detachedWindow || detachedWindow.closed || !canvas) return;

    const video = detachedWindow.document.getElementById('mixfade-detached-video') as HTMLVideoElement | null;
    if (!video) return;

    if (!detachedStreamRef.current) {
      detachedStreamRef.current = canvas.captureStream(TARGET_FPS);
    }

    if (video.srcObject !== detachedStreamRef.current) {
      video.srcObject = detachedStreamRef.current;
      video.muted = true;
      void video.play().catch(() => undefined);
    }
  }, []);

  const openExternalWindow = useCallback(() => {
    const existingWindow = detachedWindowRef.current;
    if (existingWindow && !existingWindow.closed) {
      syncDetachedWindowStream();
      updateDetachedWindowHud();
      existingWindow.focus();
      return;
    }

    const detachedWindow = window.open('', 'mixfade-visualizer-detached', 'popup=yes,width=1440,height=900,resizable=yes,scrollbars=no');
    if (!detachedWindow) return;

    detachedWindowRef.current = detachedWindow;
    setIsDetachedWindowOpen(true);

    writeDetachedVisualizerDocument(detachedWindow);

    const handleDetachedWindowClosed = () => {
      if (detachedWindowRef.current === detachedWindow) {
        detachedWindowRef.current = null;
        stopDetachedStream();
        setIsDetachedWindowOpen(false);
      }
    };

    detachedWindow.addEventListener('beforeunload', handleDetachedWindowClosed, { once: true });
    window.setTimeout(() => {
      syncDetachedWindowStream();
      updateDetachedWindowHud();
      detachedWindow.focus();
    }, 0);
  }, [stopDetachedStream, syncDetachedWindowStream, updateDetachedWindowHud]);

  const disconnectCurrentNode = useCallback(() => {
    if (!visualizerRef.current || !connectedNodeRef.current) return;
    try { visualizerRef.current.disconnectAudio(connectedNodeRef.current); } catch {
      // Ignore disconnect failures; the next connection replaces the node reference.
    }
    connectedNodeRef.current = null;
  }, []);
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const visualizer = visualizerRef.current;
    if (!canvas || !visualizer) return;
    const rect = canvas.getBoundingClientRect();
    const scale = getRenderScale(rect.width, rect.height);
    const width = Math.max(1, Math.floor(rect.width * scale));
    const height = Math.max(1, Math.floor(rect.height * scale));
    if (lastSizeRef.current.width === width && lastSizeRef.current.height === height) return;
    canvas.width = width;
    canvas.height = height;
    lastSizeRef.current = { width, height };
    visualizer.setRendererSize(width, height, { pixelRatio: scale });
  }, []);
  const scheduleResize = useCallback(() => {
    if (resizeFrameRef.current) return;
    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = 0;
      resize();
    });
  }, [resize]);

  useEffect(() => { setSupported(isButterchurnSupported()); }, []);
  useEffect(() => { presetEntryRef.current = presetEntry; }, [presetEntry]);
  useEffect(() => {
    onExternalWindowReady?.(openExternalWindow);
    return () => onExternalWindowReady?.(null);
  }, [onExternalWindowReady, openExternalWindow]);
  useEffect(() => {
    onExternalWindowStateChange?.(isDetachedWindowOpen);
  }, [isDetachedWindowOpen, onExternalWindowStateChange]);
  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supported || !sourceInput?.audioContext || !sourceInput.gainNode) return;
    const needsNewVisualizer = !visualizerRef.current || connectedContextRef.current !== sourceInput.audioContext;
    if (needsNewVisualizer) {
      disconnectCurrentNode();
      visualizerRef.current = butterchurn.createVisualizer(sourceInput.audioContext, canvas, { width: Math.max(canvas.clientWidth, 1), height: Math.max(canvas.clientHeight, 1) });
      connectedContextRef.current = sourceInput.audioContext;
      loadedPresetNameRef.current = '';
      lastSizeRef.current = { width: 0, height: 0 };
      scheduleResize();
    }
    if (!playingInput?.gainNode) {
      disconnectCurrentNode();
    } else if (connectedNodeRef.current !== playingInput.gainNode) {
      disconnectCurrentNode();
      visualizerRef.current?.connectAudio(playingInput.gainNode);
      connectedNodeRef.current = playingInput.gainNode;
    }
    const [presetName, presetMap] = presetEntryRef.current;
    if (visualizerRef.current && loadedPresetNameRef.current !== presetName && presetMap) {
      visualizerRef.current.loadPreset(presetMap, 0);
      loadedPresetNameRef.current = presetName;
    }
    scheduleResize();
  }, [disconnectCurrentNode, playingInput, scheduleResize, sourceInput, supported]);
  useEffect(() => {
    if (!visualizerRef.current || !presetEntry[1] || loadedPresetNameRef.current === presetEntry[0]) return;
    visualizerRef.current.loadPreset(presetEntry[1], isActive ? ACTIVE_PRESET_BLEND_SECONDS : 0);
    loadedPresetNameRef.current = presetEntry[0];
  }, [isActive, presetEntry]);
  useEffect(() => {
    if (!supported || (!pageVisible && !isDetachedWindowOpen) || (!isActive && !isDetachedWindowOpen) || !playingInput) return;
    let raf = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / TARGET_FPS;
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (!visualizerRef.current || now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;
      visualizerRef.current.render();
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [isActive, isDetachedWindowOpen, pageVisible, playingInput, supported]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => scheduleResize());
      observer.observe(canvas);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', scheduleResize);
    return () => window.removeEventListener('resize', scheduleResize);
  }, [scheduleResize]);
  useEffect(() => {
    if (isActive || isDetachedWindowOpen) scheduleResize();
  }, [isActive, isDetachedWindowOpen, scheduleResize]);
  useEffect(() => {
    if (!isDetachedWindowOpen) return;
    syncDetachedWindowStream();
    updateDetachedWindowHud();
  }, [activeTrackLabel, deckLabel, isDetachedWindowOpen, presetDisplayName, syncDetachedWindowStream, updateDetachedWindowHud]);
  useEffect(() => () => {
    if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
    if (detachedWindowRef.current && !detachedWindowRef.current.closed) detachedWindowRef.current.close();
    stopDetachedStream();
    disconnectCurrentNode();
    visualizerRef.current = null;
    connectedContextRef.current = null;
  }, [disconnectCurrentNode, stopDetachedStream]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      onMouseMove={resetHudTimer}
      onClick={resetHudTimer}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: 'block' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_48%),linear-gradient(to_bottom,rgba(3,7,18,0.22),rgba(2,6,23,0.62))]" />
      <VisualizerEmptyStates
        supported={supported}
        hasLoadedDeck={hasLoadedDeck}
        hasPlayingInput={Boolean(playingInput)}
      />
      <VisualizerHud
        showHud={showHud}
        deckLabel={deckLabel}
        activeTrackLabel={activeTrackLabel}
        volumeA={volumeA}
        volumeB={volumeB}
        isTransitioning={isTransitioning}
        hasLoadedDeck={hasLoadedDeck}
        isPlaying={isPlaying}
        isLooping={isLooping}
        deckTextVar={deckTextVar}
        deckBaseRgbVar={deckBaseRgbVar}
        presetName={presetEntry[0]}
        presetDisplayName={presetDisplayName}
        isSeedSaved={isSeedSaved}
        onPlayPause={onPlayPause}
        onToggleLoop={onToggleLoop}
        onRollSeed={onRollSeed}
        onSaveSeed={onSaveSeed}
      />
    </div>
  );
});
