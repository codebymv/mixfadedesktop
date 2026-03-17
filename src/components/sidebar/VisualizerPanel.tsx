import { Dices, RotateCcw, Save, Trash2, Sparkles } from 'lucide-react';
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
  onResetSeed: () => void;
  savedSeeds: SavedSeed[];
  onSaveSeed: () => void;
  onLoadSeed: (seed: number) => void;
  onDeleteSeed: (id: string) => void;
}

export function VisualizerPanel({
  seed,
  onRollSeed,
  onResetSeed,
  savedSeeds,
  onSaveSeed,
  onLoadSeed,
  onDeleteSeed,
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
        className="w-full flex items-center justify-center space-x-2.5 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 neon-glow-fusion active:scale-[0.97]"
      >
        <Dices size={18} />
        <span>Roll New Seed</span>
      </button>

      {/* Save Button */}
      <button
        onClick={onSaveSeed}
        disabled={alreadySaved}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
          alreadySaved
            ? 'border-slate-700/30 text-slate-600 cursor-default'
            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 active:scale-[0.97]'
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
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-150 group ${
                  saved.seed === seed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/40'
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
                  className="flex-shrink-0 p-0.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150"
                  title="Delete preset"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={onResetSeed}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-200"
      >
        <RotateCcw size={12} />
        <span>Reset to Default</span>
      </button>
    </div>
  );
}

