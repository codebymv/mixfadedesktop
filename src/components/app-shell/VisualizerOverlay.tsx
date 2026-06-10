import { lazy, Suspense } from 'react';
import type { AudioContextNodes } from '../../hooks/useAudioContext';

const VisualizerMode = lazy(() =>
  import('../VisualizerMode').then(module => ({
    default: module.VisualizerMode,
  }))
);

interface VisualizerOverlayProps {
  isVisible: boolean;
  shouldRenderVisualizer: boolean;
  trackA: File | null;
  trackB: File | null;
  audioNodesA: AudioContextNodes | null;
  audioNodesB: AudioContextNodes | null;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  volumeA: number;
  volumeB: number;
  isTransitioning: boolean;
  seed: number;
  isLoopingA: boolean;
  isLoopingB: boolean;
  isSeedSaved: boolean;
  onPlayPause: () => void;
  onToggleLoop: () => void;
  onRollSeed: () => void;
  onSaveSeed: () => void;
  onExternalWindowReady: (openExternalWindow: (() => void) | null) => void;
  onExternalWindowStateChange: (isOpen: boolean) => void;
}

export function VisualizerOverlay({
  isVisible,
  shouldRenderVisualizer,
  trackA,
  trackB,
  audioNodesA,
  audioNodesB,
  isTrackAPlaying,
  isTrackBPlaying,
  volumeA,
  volumeB,
  isTransitioning,
  seed,
  isLoopingA,
  isLoopingB,
  isSeedSaved,
  onPlayPause,
  onToggleLoop,
  onRollSeed,
  onSaveSeed,
  onExternalWindowReady,
  onExternalWindowStateChange,
}: VisualizerOverlayProps) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-150 ${
        isVisible
          ? 'z-50 opacity-100 pointer-events-auto'
          : 'z-0 opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isVisible}
    >
      {shouldRenderVisualizer && (
        <Suspense fallback={null}>
          <VisualizerMode
            trackAFile={trackA}
            trackBFile={trackB}
            audioNodesA={audioNodesA}
            audioNodesB={audioNodesB}
            isTrackAPlaying={isTrackAPlaying}
            isTrackBPlaying={isTrackBPlaying}
            volumeA={volumeA}
            volumeB={volumeB}
            isTransitioning={isTransitioning}
            isActive={isVisible}
            seed={seed}
            onPlayPause={onPlayPause}
            isLoopingA={isLoopingA}
            isLoopingB={isLoopingB}
            onToggleLoop={onToggleLoop}
            onRollSeed={onRollSeed}
            onSaveSeed={onSaveSeed}
            isSeedSaved={isSeedSaved}
            onExternalWindowReady={onExternalWindowReady}
            onExternalWindowStateChange={onExternalWindowStateChange}
          />
        </Suspense>
      )}
    </div>
  );
}
