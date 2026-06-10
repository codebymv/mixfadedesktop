import { AudioUtils } from '../../utils/audioAnalysis';
import { formatSignedDb } from '../../utils/analysisFormatters';
import { linearToDbExtended } from './levelMeterMath';

interface LevelChannelMetricsProps {
  channelLabel: 'L' | 'R';
  lufsValue: number;
  rmsValue: number;
  peakValue: number;
  truePeakValue: number;
}

export function LevelChannelMetrics({
  channelLabel,
  lufsValue,
  rmsValue,
  peakValue,
  truePeakValue,
}: LevelChannelMetricsProps) {
  const peakDb = linearToDbExtended(peakValue);
  const truePeakDb = linearToDbExtended(truePeakValue);

  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-1.5 mb-1">
      <span className="pt-1.5 text-[10px] font-semibold font-mono text-audio-text-dim whitespace-nowrap">
        {channelLabel}
      </span>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
        <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
          <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">LUFS</div>
          <div className="mt-0.5 text-xs font-mono font-bold tabular-nums text-white whitespace-nowrap">
            {lufsValue.toFixed(1)}
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
          <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">RMS</div>
          <div className="mt-0.5 text-xs font-mono font-bold tabular-nums text-white whitespace-nowrap">
            {formatSignedDb(AudioUtils.rmsToDb(rmsValue))}
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
          <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">PK</div>
          <div className={`mt-0.5 text-xs font-mono font-bold tabular-nums whitespace-nowrap ${peakDb >= 0 ? 'text-yellow-400' : 'text-white'}`}>
            {formatSignedDb(peakDb)}
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-900/60 px-2 py-1">
          <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">TP</div>
          <div className={`mt-0.5 text-xs font-mono font-bold tabular-nums whitespace-nowrap ${truePeakDb > 0 ? 'text-red-400' : 'text-white'}`}>
            {formatSignedDb(truePeakDb)}
          </div>
        </div>
      </div>
    </div>
  );
}
