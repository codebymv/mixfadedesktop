import {
  dbToMeterPosition,
  getLevelFillClass,
  getTruePeakHoldClass,
  levelGridPositions,
  linearToDbExtended,
} from './levelMeterMath';

interface LevelChannelMeterProps {
  level: number;
  peak: number;
  truePeak: number;
}

export function LevelChannelMeter({ level, peak, truePeak }: LevelChannelMeterProps) {
  return (
    <>
      <div className="relative h-6 bg-slate-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="absolute h-full w-px bg-slate-600" style={{ left: `${levelGridPositions.zero}%` }} />
          <div className="absolute h-full w-px bg-slate-700" style={{ left: `${levelGridPositions.minus6}%` }} />
          <div className="absolute h-full w-px bg-slate-700" style={{ left: `${levelGridPositions.minus12}%` }} />
          <div className="absolute h-full w-px bg-slate-700" style={{ left: `${levelGridPositions.minus18}%` }} />
          <div className="absolute h-full w-px bg-slate-700" style={{ left: `${levelGridPositions.minus24}%` }} />
        </div>

        <div
          className={`h-full transition-all duration-75 rounded-2xl shadow-lg ${getLevelFillClass(level)}`}
          style={{ width: `${dbToMeterPosition(linearToDbExtended(level))}%` }}
        />

        <div
          className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg opacity-80"
          style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(peak)), 99)}%` }}
        />

        <div
          className={`absolute top-0 h-full w-1 rounded-full shadow-lg ${getTruePeakHoldClass(truePeak)}`}
          style={{ left: `${Math.min(dbToMeterPosition(linearToDbExtended(truePeak)), 99)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-audio-text-dim font-mono tabular-nums relative whitespace-nowrap mt-1.5">
        <span>-60</span>
        <span>-48</span>
        <span>-36</span>
        <span>-24</span>
        <span>-18</span>
        <span>-12</span>
        <span>-6</span>
        <span className="text-yellow-400 font-bold">0</span>
        <span className="text-red-400 font-bold">+6</span>
      </div>
    </>
  );
}
