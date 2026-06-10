import type { SpectrogramAnalysis } from '../../utils/audioAnalysis';
import {
  formatActivity,
  formatToneVsNoise,
  getActivityColor,
  getDynamicRangeColor,
  getToneVsNoiseColor,
} from '../../utils/analysisFormatters';
import {
  getActivityBgColor,
  getDynamicRangeBgColor,
  getSpectrogramFrequencyColor,
  getToneVsNoiseBgColor,
} from './spectrogramAnalyzerColors';
import {
  getDynamicRangeProgressPercent,
  formatSpectrogramFrequency,
  getFrequencyProgressPercent,
} from './spectrogramDisplay';

interface SpectrogramMetricsGridProps {
  displayData: SpectrogramAnalysis;
}

export function SpectrogramMetricsGrid({ displayData }: SpectrogramMetricsGridProps) {
  const brightnessColor = getSpectrogramFrequencyColor(displayData.brightness);
  const rolloffColor = getSpectrogramFrequencyColor(displayData.highFreqContent);

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Bright</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${brightnessColor.text}`}>
            {formatSpectrogramFrequency(displayData.brightness)} Hz
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full ${brightnessColor.bg} rounded-full transition-all duration-200`}
            style={{ width: `${getFrequencyProgressPercent(displayData.brightness)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Roll</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${rolloffColor.text}`}>
            {formatSpectrogramFrequency(displayData.highFreqContent)} Hz
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full ${rolloffColor.bg} rounded-full transition-all duration-200`}
            style={{ width: `${getFrequencyProgressPercent(displayData.highFreqContent)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="uppercase tracking-[0.12em] whitespace-nowrap">Activity</span>
          <span className={`font-mono font-bold tabular-nums whitespace-nowrap ${getActivityColor(displayData.activity)}`}>
            {formatActivity(displayData.activity)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getActivityBgColor(displayData.activity)}`}
            style={{ width: `${displayData.activity * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-700/50">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Range</span>
            <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getDynamicRangeColor(displayData.dynamicRange)}`}>
              {displayData.dynamicRange.toFixed(1)}dB
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full ${getDynamicRangeBgColor(displayData.dynamicRange)} rounded-full transition-all duration-200`}
              style={{ width: `${getDynamicRangeProgressPercent(displayData.dynamicRange)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-[0.12em] whitespace-nowrap">Tone</span>
            <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap ${getToneVsNoiseColor(displayData.toneVsNoise)}`}>
              {formatToneVsNoise(displayData.toneVsNoise)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${getToneVsNoiseBgColor(displayData.toneVsNoise)}`}
              style={{ width: `${displayData.toneVsNoise * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
