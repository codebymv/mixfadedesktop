import { useEffect, useRef, useState } from 'react';
import butterchurn, { ButterchurnVisualizer } from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import isButterchurnSupported from 'butterchurn/lib/isSupported.min';
import { getPresetEntryForSeed, DEFAULT_VIS_SEED } from './VisualizerMode';

export interface VisualizerBroadcastMessage {
  type: 'visualizer-state';
  seed: number;
  isPlaying: boolean;
  trackLabel: string;
  deckLabel: string;
  presetName: string;
  frequencyData: number[];   // Uint8Array serialized as plain array
  timeDomainData: number[];  // Uint8Array serialized as plain array
}

const CHANNEL_NAME = 'mixfade-visualizer';
const TARGET_FPS = 45;
const MAX_RENDER_DPR = 1.25;
const MAX_RENDER_PIXELS = 2560 * 1440;

const getRenderScale = (width: number, height: number) => {
  const cappedDpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
  const desiredPixels = Math.max(1, width * cappedDpr) * Math.max(1, height * cappedDpr);
  if (desiredPixels <= MAX_RENDER_PIXELS) return cappedDpr;
  return cappedDpr * Math.sqrt(MAX_RENDER_PIXELS / desiredPixels);
};

export function ExternalVisualizerWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ButterchurnVisualizer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadedPresetRef = useRef('');
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(2048));
  const timeDomainDataRef = useRef<Uint8Array>(new Uint8Array(2048));
  const [supported] = useState(() => isButterchurnSupported());
  const [state, setState] = useState<Omit<VisualizerBroadcastMessage, 'type' | 'frequencyData' | 'timeDomainData'>>({
    seed: DEFAULT_VIS_SEED,
    isPlaying: false,
    trackLabel: '',
    deckLabel: '',
    presetName: '',
  });

  // Set up audio context + butterchurn once
  useEffect(() => {
    if (!supported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    const gain = ctx.createGain();
    gain.gain.value = 0; // silent — we only need the graph for butterchurn
    gainRef.current = gain;

    // Oscillator to keep AudioContext alive (some browsers suspend idle contexts)
    const osc = ctx.createOscillator();
    osc.frequency.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    // Patch analyser to serve our injected data
    const origFreq = analyser.getByteFrequencyData.bind(analyser);
    const origTime = analyser.getByteTimeDomainData.bind(analyser);
    analyser.getByteFrequencyData = (arr: Uint8Array) => {
      if (freqDataRef.current.length === arr.length) arr.set(freqDataRef.current);
      else origFreq(arr);
    };
    analyser.getByteTimeDomainData = (arr: Uint8Array) => {
      if (timeDomainDataRef.current.length === arr.length) arr.set(timeDomainDataRef.current);
      else origTime(arr);
    };

    const vis = butterchurn.createVisualizer(ctx, canvas, {
      width: Math.max(canvas.clientWidth, 1),
      height: Math.max(canvas.clientHeight, 1),
    });
    vis.connectAudio(analyser);
    visualizerRef.current = vis;

    return () => {
      vis.disconnectAudio(analyser);
      visualizerRef.current = null;
      osc.stop();
      ctx.close();
      audioCtxRef.current = null;
    };
  }, [supported]);

  // BroadcastChannel receiver
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev: MessageEvent<VisualizerBroadcastMessage>) => {
      const msg = ev.data;
      if (msg.type !== 'visualizer-state') return;
      freqDataRef.current = new Uint8Array(msg.frequencyData);
      timeDomainDataRef.current = new Uint8Array(msg.timeDomainData);
      setState({
        seed: msg.seed,
        isPlaying: msg.isPlaying,
        trackLabel: msg.trackLabel,
        deckLabel: msg.deckLabel,
        presetName: msg.presetName,
      });
    };
    return () => channel.close();
  }, []);

  // Load preset when seed changes
  useEffect(() => {
    const vis = visualizerRef.current;
    if (!vis) return;
    const [name, preset] = getPresetEntryForSeed(state.seed);
    if (!preset || loadedPresetRef.current === name) return;
    vis.loadPreset(preset, 0.7);
    loadedPresetRef.current = name;
  }, [state.seed]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const vis = visualizerRef.current;
    if (!canvas || !vis) return;
    const doResize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = getRenderScale(rect.width, rect.height);
      const w = Math.max(1, Math.floor(rect.width * scale));
      const h = Math.max(1, Math.floor(rect.height * scale));
      if (lastSizeRef.current.width === w && lastSizeRef.current.height === h) return;
      canvas.width = w; canvas.height = h;
      lastSizeRef.current = { width: w, height: h };
      vis.setRendererSize(w, h, { pixelRatio: scale });
    };
    doResize();
    const ro = new ResizeObserver(doResize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [supported]);

  // Render loop — always runs so the canvas stays alive even when paused
  useEffect(() => {
    if (!supported) return;
    let raf = 0;
    let last = 0;
    const interval = 1000 / TARGET_FPS;
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (!visualizerRef.current || now - last < interval) return;
      last = now;
      visualizerRef.current.render();
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [supported]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: 'block' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_48%),linear-gradient(to_bottom,rgba(3,7,18,0.22),rgba(2,6,23,0.62))]" />
      {!supported && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 text-center backdrop-blur-md">
            <div className="text-sm font-semibold text-white">WebGL2 not available</div>
          </div>
        </div>
      )}
      {/* HUD */}
      {state.deckLabel && (
        <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md">
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{state.deckLabel}</div>
          <div className="mt-1 text-sm font-medium text-white">{state.trackLabel || 'No active audio'}</div>
        </div>
      )}
      {state.presetName && (
        <div className="absolute bottom-6 right-6 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md">
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Seed</div>
          <div className="mt-1 max-w-[180px] truncate text-sm font-medium text-white">{state.presetName}</div>
        </div>
      )}
    </div>
  );
}

