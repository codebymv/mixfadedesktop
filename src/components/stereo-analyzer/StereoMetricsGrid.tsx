import React from 'react';
import type { StereoAnalysis } from '../../utils/audioAnalysis';
import {
  formatBalanceLabel,
  formatDb,
  formatSignedCorrelation,
  formatStereoWidth,
  getLevelBgColor,
  getLevelColor,
  getLRBalanceColor,
  getStereoCorrelationColor,
  getStereoWidthColor,
  linearToDb,
} from '../../utils/analysisFormatters';
import {
  getBalanceBgColor,
  getCorrelationBgColor,
  getStereoWidthBgColor,
} from './stereoAnalyzerColors';

interface StereoMetricsGridProps {
  displayData: StereoAnalysis;
}

export function StereoMetricsGrid({ displayData }: StereoMetricsGridProps) {
  const midDb = linearToDb(displayData.midLevel);
  const sideDb = linearToDb(displayData.sideLevel);

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Phase</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getStereoCorrelationColor(displayData.phaseCorrelation)}`}>
            {formatSignedCorrelation(displayData.phaseCorrelation)}
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-600" />
          <div
            className={`absolute top-0 h-full w-2 rounded-full transition-all duration-200 ${getCorrelationBgColor(displayData.phaseCorrelation)}`}
            style={{
              left: `${((displayData.phaseCorrelation + 1) / 2) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Width</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getStereoWidthColor(displayData.stereoWidth)}`}>
            {formatStereoWidth(displayData.stereoWidth)}
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getStereoWidthBgColor(displayData.stereoWidth)}`}
            style={{ width: `${displayData.stereoWidth}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Balance</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getLRBalanceColor(displayData.balance)}`}>
            {formatBalanceLabel(displayData.balance)}
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-600" />
          <div
            className={`absolute top-0 h-full w-1 rounded-full transition-all duration-200 ${getBalanceBgColor(displayData.balance)}`}
            style={{
              left: `${50 + (displayData.balance * 45)}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-700/50">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Mid</span>
            <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getLevelColor(midDb)}`}>
              {formatDb(midDb)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${getLevelBgColor(midDb)}`}
              style={{ width: `${Math.max(0, (midDb + 60) / 60 * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Side</span>
            <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getLevelColor(sideDb)}`}>
              {formatDb(sideDb)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${getLevelBgColor(sideDb)}`}
              style={{ width: `${Math.max(0, (sideDb + 60) / 60 * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

