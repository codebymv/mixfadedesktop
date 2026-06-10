import type { SpectrogramAnalysis } from '../../utils/audioAnalysis';
import {
  formatActivityLabel,
  formatToneVsNoise,
  getActivityColor,
  getBrightnessColor,
  getDynamicRangeColor,
  getToneVsNoiseColor,
} from '../../utils/analysisFormatters';
import { InsightMetricCard } from '../analysis/InsightMetricCard';
import { formatSpectrogramFrequency } from './spectrogramDisplay';

interface SpectrogramMetricCardsProps {
  displayData: SpectrogramAnalysis;
}

export function SpectrogramMetricCards({ displayData }: SpectrogramMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
      <InsightMetricCard
        label="Energy"
        value={formatActivityLabel(displayData.activity)}
        valueClassName={getActivityColor(displayData.activity)}
      />
      <InsightMetricCard
        label="Bright"
        value={`${formatSpectrogramFrequency(displayData.brightness)} Hz`}
        valueClassName={getBrightnessColor(displayData.brightness)}
      />
      <InsightMetricCard
        label="Range"
        value={`${displayData.dynamicRange.toFixed(1)} dB`}
        valueClassName={getDynamicRangeColor(displayData.dynamicRange)}
      />
      <InsightMetricCard
        label="Tone"
        value={formatToneVsNoise(displayData.toneVsNoise)}
        valueClassName={getToneVsNoiseColor(displayData.toneVsNoise)}
      />
    </div>
  );
}
