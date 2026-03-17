import { Dices, RotateCcw } from 'lucide-react';

interface VisualizerPanelProps {
  seed: number;
  onRollSeed: () => void;
  onResetSeed: () => void;
}

export function VisualizerPanel({ seed, onRollSeed, onResetSeed }: VisualizerPanelProps) {
  return (
    <div className="p-4 space-y-6">

      {/* Roll Button */}
      <button
        onClick={onRollSeed}
        className="w-full flex items-center justify-center space-x-2.5 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 neon-glow-fusion active:scale-[0.97]"
      >
        <Dices size={18} />
        <span>Roll New Seed</span>
      </button>

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

