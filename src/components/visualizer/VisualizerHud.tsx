import { Dices, Pause, Play, Repeat, Save } from 'lucide-react';

interface VisualizerHudProps {
  showHud: boolean;
  deckLabel: string;
  activeTrackLabel: string;
  volumeA: number;
  volumeB: number;
  isTransitioning: boolean;
  hasLoadedDeck: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  deckTextVar: string;
  deckBaseRgbVar: string;
  presetName: string;
  presetDisplayName: string;
  isSeedSaved: boolean;
  onPlayPause?: () => void;
  onToggleLoop?: () => void;
  onRollSeed?: () => void;
  onSaveSeed?: () => void;
}

export function VisualizerHud({
  showHud,
  deckLabel,
  activeTrackLabel,
  volumeA,
  volumeB,
  isTransitioning,
  hasLoadedDeck,
  isPlaying,
  isLooping,
  deckTextVar,
  deckBaseRgbVar,
  presetName,
  presetDisplayName,
  isSeedSaved,
  onPlayPause,
  onToggleLoop,
  onRollSeed,
  onSaveSeed,
}: VisualizerHudProps) {
  return (
    <>
      <div
        className={`absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md transition-all duration-500 ${
          showHud ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {deckLabel && <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{deckLabel}</div>}
        <div className="mt-1 text-sm font-medium text-white">{activeTrackLabel || 'No active audio'}</div>
        {volumeA > 0.01 && volumeB > 0.01 && (
          <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
            <div className="flex h-full w-full">
              <div className="h-full bg-emerald-400/80" style={{ width: `${(volumeA / Math.max(volumeA + volumeB, 0.001)) * 100}%` }} />
              <div className="h-full bg-purple-400/80" style={{ width: `${(volumeB / Math.max(volumeA + volumeB, 0.001)) * 100}%` }} />
            </div>
          </div>
        )}
        {isTransitioning && <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-fuchsia-300/80">Crossfade in motion</div>}
        {hasLoadedDeck && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                color: deckTextVar,
                background: `rgba(${deckBaseRgbVar}, 0.15)`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={onToggleLoop}
              className="flex items-center justify-center w-8 h-8 rounded-lg border transition-colors"
              style={{
                color: isLooping ? deckTextVar : 'rgb(100 116 139)',
                background: isLooping ? `rgba(${deckBaseRgbVar}, 0.15)` : 'transparent',
                borderColor: isLooping ? `rgba(${deckBaseRgbVar}, 0.4)` : 'transparent',
              }}
              title={isLooping ? 'Disable loop' : 'Enable loop'}
            >
              <Repeat size={14} />
            </button>
          </div>
        )}
      </div>

      <div
        className={`absolute bottom-6 right-6 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md transition-all duration-500 ${
          showHud ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Seed</div>
        <div className="mt-1 max-w-[180px] truncate text-sm font-medium text-white" title={presetName}>
          {presetDisplayName}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onRollSeed}
            className="flex items-center justify-center w-8 h-8 rounded-lg theme-fusion-outline text-slate-300 hover:text-white transition-all duration-200 active:scale-[0.97]"
            title="Roll new seed"
          >
            <Dices size={14} />
          </button>
          <button
            onClick={isSeedSaved ? undefined : onSaveSeed}
            disabled={isSeedSaved}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
              isSeedSaved
                ? 'glass-panel border border-slate-700/30 text-slate-600 cursor-default'
                : 'theme-fusion-outline text-slate-300 hover:text-white active:scale-[0.97]'
            }`}
            title={isSeedSaved ? 'Already saved' : 'Save seed'}
          >
            <Save size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

