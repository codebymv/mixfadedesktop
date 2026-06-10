interface LevelMeterFooterProps {
  crossfadeVolume: number;
  isPlaying: boolean;
  levelRisk: string;
  mixToneClass: string;
  riskToneClass: string;
  transportLabel: string;
}

export function LevelMeterFooter({
  crossfadeVolume,
  isPlaying,
  levelRisk,
  mixToneClass,
  riskToneClass,
  transportLabel,
}: LevelMeterFooterProps) {
  return (
    <div className="shrink-0 space-y-2">
      <div className="pt-2 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
            <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">Risk</div>
            <div className={`mt-1 font-mono font-bold tabular-nums whitespace-nowrap ${riskToneClass}`}>
              {levelRisk}
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/60 px-2.5 py-2 min-w-0">
            <div className="uppercase tracking-[0.12em] text-slate-500 whitespace-nowrap">State</div>
            <div className={`mt-1 flex items-center gap-1.5 font-mono font-bold tabular-nums whitespace-nowrap ${mixToneClass}`}>
              <div className={`w-2 h-2 rounded-full ${
                crossfadeVolume === 0 ? 'bg-red-500' :
                isPlaying ? 'bg-[var(--theme-deck-a-base)] animate-pulse' : 'bg-slate-500'
              }`} />
              <span>{transportLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
