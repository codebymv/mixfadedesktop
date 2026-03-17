import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import butterchurn, { ButterchurnVisualizer } from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import isButterchurnSupported from 'butterchurn/lib/isSupported.min';
import type { AudioContextNodes } from '../hooks/useAudioContext';

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
}

export const DEFAULT_VIS_SEED = 42;
const TARGET_FPS = 45;
const MAX_RENDER_DPR = 1.25;
const MAX_RENDER_PIXELS = 2560 * 1440;
const ACTIVE_PRESET_BLEND_SECONDS = 0.7;
const PRESET_ENTRIES = Object.entries(butterchurnPresets.getPresets());
const getPresetEntryForSeed = (seed: number) => PRESET_ENTRIES.length
  ? (PRESET_ENTRIES[(seed >>> 0) % PRESET_ENTRIES.length] as [string, unknown])
  : ['No Preset', null] as [string, unknown];
const getRenderScale = (width: number, height: number) => {
  const cappedDpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
  const desiredPixels = Math.max(1, width * cappedDpr) * Math.max(1, height * cappedDpr);
  if (desiredPixels <= MAX_RENDER_PIXELS) return cappedDpr;
  return cappedDpr * Math.sqrt(MAX_RENDER_PIXELS / desiredPixels);
};

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
  seed = DEFAULT_VIS_SEED
}: VisualizerModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ButterchurnVisualizer | null>(null);
  const connectedNodeRef = useRef<AudioNode | null>(null);
  const connectedContextRef = useRef<AudioContext | null>(null);
  const loadedPresetNameRef = useRef('');
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeFrameRef = useRef(0);
  const presetEntryRef = useRef<[string, unknown]>(getPresetEntryForSeed(seed));
  const [supported, setSupported] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' ? true : !document.hidden);

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
  const activeTrackLabel = useMemo(() => {
    const nameA = trackAFile?.name?.replace(/\.[^.]+$/, '') ?? '';
    const nameB = trackBFile?.name?.replace(/\.[^.]+$/, '') ?? '';
    if (isTrackAPlaying && isTrackBPlaying) return `${nameA || 'Audio A'}  ◆  ${nameB || 'Audio B'}`;
    if (isTrackAPlaying && nameA) return nameA;
    if (isTrackBPlaying && nameB) return nameB;
    return nameA || nameB || '';
  }, [isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile]);

  const disconnectCurrentNode = useCallback(() => {
    if (!visualizerRef.current || !connectedNodeRef.current) return;
    try { visualizerRef.current.disconnectAudio(connectedNodeRef.current); } catch {}
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
    if (!supported || !pageVisible || !isActive || !playingInput) return;
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
  }, [isActive, pageVisible, playingInput, supported]);
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
    if (isActive) scheduleResize();
  }, [isActive, scheduleResize]);
  useEffect(() => () => {
    if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
    disconnectCurrentNode();
    visualizerRef.current = null;
    connectedContextRef.current = null;
  }, [disconnectCurrentNode]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: 'block' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_48%),linear-gradient(to_bottom,rgba(3,7,18,0.22),rgba(2,6,23,0.62))]" />
      {!supported && <div className="absolute inset-0 flex items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 text-center backdrop-blur-md"><div className="text-sm font-semibold text-white">WebGL2 not available</div><div className="mt-2 text-xs text-slate-400">Butterchurn needs WebGL2 support to run Milkdrop-style journey presets.</div></div></div>}
      {supported && !hasLoadedDeck && <div className="absolute inset-0 flex items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-5 text-center backdrop-blur-md"><div className="text-sm font-semibold text-white">Load a deck to start visuals</div><div className="mt-2 text-xs text-slate-400">Once a deck is loaded, the visualizer will follow the dominant audible deck through the crossfade.</div></div></div>}
      {supported && hasLoadedDeck && !playingInput && <div className="absolute inset-0 flex items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-5 text-center backdrop-blur-md"><div className="text-sm font-semibold text-white">Press play to start visuals</div><div className="mt-2 text-xs text-slate-400">The visualizer now pauses completely whenever no deck is actively playing.</div></div></div>}
      <div className="pointer-events-none absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md"><div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Now Visualizing</div><div className="mt-1 text-sm font-medium text-white">{activeTrackLabel || 'No active audio'}</div>{volumeA > 0.01 && volumeB > 0.01 && <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10"><div className="flex h-full w-full"><div className="h-full bg-emerald-400/80" style={{ width: `${(volumeA / Math.max(volumeA + volumeB, 0.001)) * 100}%` }} /><div className="h-full bg-purple-400/80" style={{ width: `${(volumeB / Math.max(volumeA + volumeB, 0.001)) * 100}%` }} /></div></div>}{isTransitioning && <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-fuchsia-300/80">Crossfade in motion</div>}</div>
    </div>
  );
});