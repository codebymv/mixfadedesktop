import { Dices, ExternalLink, Save, Trash2, Sparkles } from 'lucide-react';
import { getPresetEntryForSeed } from '../VisualizerMode';

const normalizePresetName = (name: string): string => {
  const idx = name.lastIndexOf(' - ');
  const raw = idx !== -1 ? name.slice(idx + 3).trim() : name;
  return raw.replace(/\b\w/g, c => c.toUpperCase());
};

export interface SavedSeed {
  id: string;
  seed: number;
  name: string;
  savedAt: number;
}

interface VisualizerPanelProps {
  seed: number;
  onRollSeed: () => void;
  savedSeeds: SavedSeed[];
  onSaveSeed: () => void;
  onLoadSeed: (seed: number) => void;
  onDeleteSeed: (id: string) => void;
  onOpenExternalWindow?: () => void;
  isExternalWindowOpen?: boolean;
}

export function VisualizerPanel({
  seed,
  onRollSeed,
  savedSeeds,
  onSaveSeed,
  onLoadSeed,
  onDeleteSeed,
  onOpenExternalWindow,
  isExternalWindowOpen = false,
}: VisualizerPanelProps) {
  const [currentPresetName] = getPresetEntryForSeed(seed);
  const currentPresetDisplay = normalizePresetName(currentPresetName);
  const alreadySaved = savedSeeds.some(s => s.seed === seed);

  return (
    <div className="p-4 space-y-4">

      {/* Current preset label */}
      <div className="px-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-1">Current Seed</p>
        <p className="text-xs text-slate-300 font-mono truncate" title={currentPresetName}>{currentPresetDisplay}</p>
      </div>

      {/* Roll Button */}
      <button
        onClick={onRollSeed}
        className="w-full flex items-center justify-center space-x-2.5 px-4 py-3.5 bg-theme-fusion hover:bg-theme-fusion-hover text-white text-sm font-semibold rounded-xl transition-all duration-200 neon-glow-fusion active:scale-[0.97]"
      >
        <Dices size={18} />
        <span>Roll New Seed</span>
      </button>

      {/* Save Button */}
      <button
        onClick={onSaveSeed}
        disabled={alreadySaved}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          alreadySaved
            ? 'glass-panel border border-slate-700/30 text-slate-600 cursor-default'
            : 'theme-fusion-outline text-slate-200 hover:text-white active:scale-[0.97]'
        }`}
      >
        <Save size={14} />
        <span>{alreadySaved ? 'Preset Saved' : 'Save Current Seed'}</span>
      </button>

      {/* Saved Seeds List */}
      {savedSeeds.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 px-1">Saved Seeds</p>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
            {savedSeeds.map(saved => (
              <div
                key={saved.id}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-150 group border ${
                  saved.seed === seed
                    ? 'theme-selected-card border-transparent shadow-[0_0_12px_rgba(var(--theme-deck-a-base-rgb),0.15)]'
                    : 'border-slate-700/40 hover:border-transparent hover:bg-slate-800/40 hover:shadow-[0_0_12px_rgba(var(--theme-fusion-mid-rgb),0.15)]'
                }`}
              >
                {saved.seed === seed && (
                  <Sparkles size={10} className="text-emerald-400 flex-shrink-0" />
                )}
                <button
                  onClick={() => onLoadSeed(saved.seed)}
                  className="flex-1 text-left text-xs text-slate-300 truncate hover:text-white transition-colors"
                  title={saved.name}
                >
                  {normalizePresetName(saved.name)}
                </button>
                <button
                  onClick={() => onDeleteSeed(saved.id)}
                  className="flex-shrink-0 p-0.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete preset"
                >
                  <Trash2 size={11} className="sidebar-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* External Window */}
      <button
        onClick={() => {
          if (onOpenExternalWindow) {
            onOpenExternalWindow();
            return;
          }
          const electronWindow = window as unknown as {
            electronAPI?: { openVisualizerWindow?: () => void };
            api?: { openVisualizerWindow?: () => void };
          };
          const openVisualizerWindow = electronWindow.electronAPI?.openVisualizerWindow
            ?? electronWindow.api?.openVisualizerWindow;
          openVisualizerWindow?.();
        }}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-slate-300 hover:text-white text-xs font-medium rounded-lg theme-fusion-outline transition-all duration-200 active:scale-[0.97]"
        title={isExternalWindowOpen ? 'Focus the detached visualizer window' : 'Detach the live visualizer into its own window'}
      >
        <ExternalLink size={12} />
        <span>{isExternalWindowOpen ? 'Focus External Window' : 'External Window'}</span>
      </button>
    </div>
  );
}

