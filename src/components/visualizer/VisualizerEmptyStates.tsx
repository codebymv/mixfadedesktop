interface VisualizerEmptyStatesProps {
  supported: boolean;
  hasLoadedDeck: boolean;
  hasPlayingInput: boolean;
}

export function VisualizerEmptyStates({
  supported,
  hasLoadedDeck,
  hasPlayingInput,
}: VisualizerEmptyStatesProps) {
  if (!supported) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 text-center backdrop-blur-md">
          <div className="text-sm font-semibold text-white">WebGL2 not available</div>
          <div className="mt-2 text-xs text-slate-400">Butterchurn needs WebGL2 support to run Milkdrop-style journey presets.</div>
        </div>
      </div>
    );
  }

  if (!hasLoadedDeck) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-5 text-center backdrop-blur-md">
          <div className="text-sm font-semibold text-white">Load a deck to start visuals</div>
          <div className="mt-2 text-xs text-slate-400">Once a deck is loaded, the visualizer will follow the dominant audible deck through the crossfade.</div>
        </div>
      </div>
    );
  }

  if (!hasPlayingInput) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-5 text-center backdrop-blur-md">
          <div className="text-sm font-semibold text-white">Press play to start visuals</div>
          <div className="mt-2 text-xs text-slate-400">The visualizer now pauses completely whenever no deck is actively playing.</div>
        </div>
      </div>
    );
  }

  return null;
}
