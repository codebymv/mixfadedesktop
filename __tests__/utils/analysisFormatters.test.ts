import {
  linearToDb,
  formatDb,
  formatSignedDb,
  formatFrequency,
  formatCorrelation,
  formatSignedCorrelation,
  formatPeakBandLabel,
  formatBalanceLabel,
  formatSpectralBalanceLabel,
  formatMonoCompatibilityLabel,
  formatActivityLabel,
  getLevelRiskLabel,
  formatToneVsNoise,
  getBandColor,
  getBalanceColor,
  getStereoCorrelationColor,
  getStereoWidthColor,
  getLRBalanceColor,
  getMonoCompatibilityColor,
  getMonoCompatibilityToneClass,
  getBrightnessColor,
  getDynamicRangeColor,
  getActivityColor,
  getMixToneClass,
  getSpectralBalanceToneClass,
  getPeakBandToneClass,
  getToneVsNoiseColor,
  getDelta,
  getFrequencyDelta,
  getStereoPercent,
  getLevelColor,
  getLevelBgColor,
  getSpectrogramDelta
} from '../../src/utils/analysisFormatters';

describe('Analysis Formatters', () => {
  describe('linearToDb', () => {
    it('converts linear amplitude to dB', () => {
      expect(linearToDb(1)).toBeCloseTo(0);
      expect(linearToDb(0.5)).toBeCloseTo(-6.02, 2);
      expect(linearToDb(0.1)).toBeCloseTo(-20);
    });

    it('returns -Infinity for 0 or negative values', () => {
      expect(linearToDb(0)).toBe(-Infinity);
      expect(linearToDb(-1)).toBe(-Infinity);
    });
  });

  describe('formatDb', () => {
    it('formats normal dB values', () => {
      expect(formatDb(-6.54)).toBe('-6.5');
      expect(formatDb(3.14)).toBe('3.1');
      expect(formatDb(0)).toBe('0.0');
    });

    it('handles -Infinity, NaN and values below -60', () => {
      expect(formatDb(-Infinity)).toBe('-∞');
      expect(formatDb(NaN)).toBe('-∞');
      expect(formatDb(-65)).toBe('-∞');
    });
  });

  describe('formatSignedDb', () => {
    it('formats normal dB values with sign', () => {
      expect(formatSignedDb(-6.54)).toBe('-6.5');
      expect(formatSignedDb(3.14)).toBe('+3.1');
      expect(formatSignedDb(0)).toBe('0.0');
    });

    it('handles -Infinity, NaN and values below -60', () => {
      expect(formatSignedDb(-Infinity)).toBe('-∞');
      expect(formatSignedDb(NaN)).toBe('-∞');
      expect(formatSignedDb(-65)).toBe('-∞');
    });
  });

  describe('formatFrequency', () => {
    it('formats frequencies below 1000Hz', () => {
      expect(formatFrequency(440)).toBe('440');
      expect(formatFrequency(0)).toBe('0');
      expect(formatFrequency(999)).toBe('999');
    });

    it('formats frequencies at or above 1000Hz as kHz', () => {
      expect(formatFrequency(1000)).toBe('1.0k');
      expect(formatFrequency(1550)).toBe('1.6k');
      expect(formatFrequency(20000)).toBe('20.0k');
    });
  });

  describe('formatCorrelation', () => {
    it('formats correlation to 2 decimal places', () => {
      expect(formatCorrelation(1)).toBe('1.00');
      expect(formatCorrelation(0.5)).toBe('0.50');
      expect(formatCorrelation(-0.333)).toBe('-0.33');
    });
  });

  describe('formatSignedCorrelation', () => {
    it('formats correlation to 2 decimal places with sign', () => {
      expect(formatSignedCorrelation(1)).toBe('+1.00');
      expect(formatSignedCorrelation(0.5)).toBe('+0.50');
      expect(formatSignedCorrelation(-0.333)).toBe('-0.33');
      expect(formatSignedCorrelation(0)).toBe('0.00');
    });
  });

  describe('Label Formatters', () => {
    it('formatBalanceLabel returns correct labels', () => {
      expect(formatBalanceLabel(0)).toBe('CENTER');
      expect(formatBalanceLabel(0.04)).toBe('CENTER');
      expect(formatBalanceLabel(-0.04)).toBe('CENTER');
      expect(formatBalanceLabel(0.5)).toBe('R50%');
      expect(formatBalanceLabel(-0.75)).toBe('L75%');
    });

    it('formatPeakBandLabel returns correct labels', () => {
      expect(formatPeakBandLabel('bass')).toBe('BASS');
      expect(formatPeakBandLabel('mid')).toBe('MID');
      expect(formatPeakBandLabel('upperMid')).toBe('UPMID');
      expect(formatPeakBandLabel('high')).toBe('HIGH');
      expect(formatPeakBandLabel('unknown')).toBe('—');
    });

    it('formatSpectralBalanceLabel returns correct labels', () => {
      expect(formatSpectralBalanceLabel('BASS-HEAVY')).toBe('BASS');
      expect(formatSpectralBalanceLabel('BALANCED')).toBe('EVEN');
      expect(formatSpectralBalanceLabel('BRIGHT')).toBe('BRIGHT');
      expect(formatSpectralBalanceLabel('SILENT')).toBe('SILENT');
      expect(formatSpectralBalanceLabel('unknown')).toBe('—');
    });

    it('formatMonoCompatibilityLabel returns correct labels', () => {
      expect(formatMonoCompatibilityLabel('EXCELLENT')).toBe('SAFE');
      expect(formatMonoCompatibilityLabel('GOOD')).toBe('GOOD');
      expect(formatMonoCompatibilityLabel('WARNING')).toBe('WATCH');
      expect(formatMonoCompatibilityLabel('POOR')).toBe('RISK');
      // @ts-ignore
      expect(formatMonoCompatibilityLabel('unknown')).toBe('—');
    });

    it('formatActivityLabel returns correct labels', () => {
      expect(formatActivityLabel(0.9)).toBe('INTENSE');
      expect(formatActivityLabel(0.7)).toBe('BUSY');
      expect(formatActivityLabel(0.5)).toBe('MOVING');
      expect(formatActivityLabel(0.3)).toBe('CALM');
      expect(formatActivityLabel(0.1)).toBe('STILL');
    });

    it('getLevelRiskLabel returns correct labels', () => {
      expect(getLevelRiskLabel(1)).toBe('CLIP');
      expect(getLevelRiskLabel(-2)).toBe('HOT');
      expect(getLevelRiskLabel(-6)).toBe('SAFE');
      expect(getLevelRiskLabel(-15)).toBe('LOW');
    });

    it('formatToneVsNoise returns correct labels', () => {
      expect(formatToneVsNoise(0.8)).toBe('TONE');
      expect(formatToneVsNoise(0.5)).toBe('MIX');
      expect(formatToneVsNoise(0.2)).toBe('NOISE');
    });
  });

  describe('Color Formatters', () => {
    it('getBandColor returns correct colors', () => {
      expect(getBandColor('bass')).toBe('text-red-400');
      expect(getBandColor('mid')).toBe('text-yellow-400');
      expect(getBandColor('high')).toBe('text-blue-400');
      expect(getBandColor('unknown')).toBe('text-slate-300');
    });

    it('getBalanceColor returns correct colors', () => {
      expect(getBalanceColor('bass-heavy')).toBe('text-red-400');
      expect(getBalanceColor('bright')).toBe('text-blue-400');
      expect(getBalanceColor('balanced')).toBe('text-green-400');
      expect(getBalanceColor('unknown')).toBe('text-slate-300');
    });

    it('getStereoCorrelationColor returns correct colors', () => {
      expect(getStereoCorrelationColor(0.9)).toBe('text-green-400');
      expect(getStereoCorrelationColor(0.6)).toBe('text-yellow-400');
      expect(getStereoCorrelationColor(0.1)).toBe('text-orange-400');
      expect(getStereoCorrelationColor(-0.5)).toBe('text-red-400');
    });

    it('getStereoWidthColor returns correct colors', () => {
      expect(getStereoWidthColor(70)).toBe('text-green-400');
      expect(getStereoWidthColor(40)).toBe('text-yellow-400');
      expect(getStereoWidthColor(20)).toBe('text-orange-400');
      expect(getStereoWidthColor(5)).toBe('text-red-400');
    });

    it('getLRBalanceColor returns correct colors', () => {
      expect(getLRBalanceColor(0.05)).toBe('text-green-400');
      expect(getLRBalanceColor(-0.05)).toBe('text-green-400');
      expect(getLRBalanceColor(0.2)).toBe('text-yellow-400');
      expect(getLRBalanceColor(-0.2)).toBe('text-yellow-400');
      expect(getLRBalanceColor(0.5)).toBe('text-red-400');
    });

    it('getMonoCompatibilityColor returns correct colors', () => {
      expect(getMonoCompatibilityColor(0.9)).toBe('text-green-400');
      expect(getMonoCompatibilityColor(0.7)).toBe('text-yellow-400');
      expect(getMonoCompatibilityColor(0.5)).toBe('text-orange-400');
      expect(getMonoCompatibilityColor(0.2)).toBe('text-red-400');
    });

    it('getMonoCompatibilityToneClass returns correct colors', () => {
      expect(getMonoCompatibilityToneClass('EXCELLENT')).toBe('text-green-400');
      expect(getMonoCompatibilityToneClass('GOOD')).toBe('text-yellow-400');
      expect(getMonoCompatibilityToneClass('WARNING')).toBe('text-orange-400');
      expect(getMonoCompatibilityToneClass('POOR')).toBe('text-red-400');
      // @ts-ignore
      expect(getMonoCompatibilityToneClass('unknown')).toBe('text-slate-300');
    });

    it('getBrightnessColor returns correct colors', () => {
      expect(getBrightnessColor(5000)).toBe('text-blue-400');
      expect(getBrightnessColor(3000)).toBe('text-cyan-400');
      expect(getBrightnessColor(1500)).toBe('text-green-400');
      expect(getBrightnessColor(700)).toBe('text-yellow-400');
      expect(getBrightnessColor(300)).toBe('text-red-400');
    });

    it('getDynamicRangeColor returns correct colors', () => {
      expect(getDynamicRangeColor(25)).toBe('text-green-400');
      expect(getDynamicRangeColor(18)).toBe('text-yellow-400');
      expect(getDynamicRangeColor(12)).toBe('text-orange-400');
      expect(getDynamicRangeColor(8)).toBe('text-red-400');
    });

    it('getActivityColor returns correct colors', () => {
      expect(getActivityColor(0.9)).toBe('text-red-400');
      expect(getActivityColor(0.7)).toBe('text-orange-400');
      expect(getActivityColor(0.5)).toBe('text-yellow-400');
      expect(getActivityColor(0.3)).toBe('text-green-400');
      expect(getActivityColor(0.1)).toBe('text-green-400');
    });

    it('getMixToneClass returns correct colors', () => {
      expect(getMixToneClass(0, true)).toBe('text-red-400');
      expect(getMixToneClass(0.5, true)).toBe('text-green-400');
      expect(getMixToneClass(0.5, false)).toBe('text-slate-300');
    });

    it('getSpectralBalanceToneClass returns correct colors', () => {
      expect(getSpectralBalanceToneClass('BASS-HEAVY')).toBe('text-red-400');
      expect(getSpectralBalanceToneClass('BALANCED')).toBe('text-green-400');
      expect(getSpectralBalanceToneClass('BRIGHT')).toBe('text-purple-400');
      expect(getSpectralBalanceToneClass('SILENT')).toBe('text-slate-400');
      // @ts-ignore
      expect(getSpectralBalanceToneClass('unknown')).toBe('text-slate-300');
    });

    it('getPeakBandToneClass returns correct colors', () => {
      expect(getPeakBandToneClass('bass')).toBe('text-red-400');
      expect(getPeakBandToneClass('mid')).toBe('text-orange-400');
      expect(getPeakBandToneClass('upperMid')).toBe('text-green-400');
      expect(getPeakBandToneClass('high')).toBe('text-purple-400');
      // @ts-ignore
      expect(getPeakBandToneClass('unknown')).toBe('text-slate-300');
    });

    it('getToneVsNoiseColor returns correct colors', () => {
      expect(getToneVsNoiseColor(0.8)).toBe('text-blue-400');
      expect(getToneVsNoiseColor(0.5)).toBe('text-yellow-400');
      expect(getToneVsNoiseColor(0.2)).toBe('text-red-400');
    });
  });

  describe('Delta Formatters', () => {
    it('getDelta calculates and formats differences', () => {
      expect(getDelta(5, 5)).toEqual({ value: 0, text: '0.0', color: 'text-slate-400' });
      expect(getDelta(5, 4.5)).toEqual({ value: 0.5, text: '+0.5', color: 'text-slate-400' });
      expect(getDelta(5, 6)).toEqual({ value: -1, text: '-1', color: 'text-slate-400' });
      expect(getDelta(5, 3)).toEqual({ value: 2, text: '+2', color: 'text-green-300' });
      expect(getDelta(3, 5)).toEqual({ value: -2, text: '-2', color: 'text-red-300' });
      expect(getDelta(10, 5)).toEqual({ value: 5, text: '+5', color: 'text-green-400' });
      expect(getDelta(5, 10)).toEqual({ value: -5, text: '-5', color: 'text-red-400' });
    });

    it('getFrequencyDelta calculates and formats differences', () => {
      expect(getFrequencyDelta(100, 100)).toEqual({ value: 0, text: '+0', color: 'text-slate-400' });
      expect(getFrequencyDelta(105, 100)).toEqual({ value: 5, text: '+5', color: 'text-slate-400' });
      expect(getFrequencyDelta(100, 105)).toEqual({ value: -5, text: '-5', color: 'text-slate-400' });
      expect(getFrequencyDelta(200, 100)).toEqual({ value: 100, text: '+100', color: 'text-slate-400' });
      expect(getFrequencyDelta(100, 200)).toEqual({ value: -100, text: '-100', color: 'text-slate-400' });
      expect(getFrequencyDelta(1000, 100)).toEqual({ value: 900, text: '+900', color: 'text-yellow-400' });
      expect(getFrequencyDelta(100, 1000)).toEqual({ value: -900, text: '-900', color: 'text-yellow-400' });
      expect(getFrequencyDelta(2000, 100)).toEqual({ value: 1900, text: '+1.9k', color: 'text-orange-400' });
      expect(getFrequencyDelta(100, 2000)).toEqual({ value: -1900, text: '-1.9k', color: 'text-orange-400' });
    });

    it('getStereoPercent calculates and formats differences', () => {
      expect(getStereoPercent(50, 50)).toEqual({ value: 0, text: '+0.0', color: 'text-slate-400' });
      expect(getStereoPercent(50.5, 50)).toEqual({ value: 0.5, text: '+0.5', color: 'text-slate-400' });
      expect(getStereoPercent(50, 50.5)).toEqual({ value: -0.5, text: '-0.5', color: 'text-slate-400' });
      expect(getStereoPercent(55, 50)).toEqual({ value: 5, text: '+5', color: 'text-slate-400' });
      expect(getStereoPercent(50, 55)).toEqual({ value: -5, text: '-5', color: 'text-slate-400' });
      expect(getStereoPercent(65, 50)).toEqual({ value: 15, text: '+15', color: 'text-yellow-400' });
      expect(getStereoPercent(50, 65)).toEqual({ value: -15, text: '-15', color: 'text-yellow-400' });
      expect(getStereoPercent(80, 50)).toEqual({ value: 30, text: '+30', color: 'text-orange-400' });
      expect(getStereoPercent(50, 80)).toEqual({ value: -30, text: '-30', color: 'text-orange-400' });
    });

    it('getSpectrogramDelta calculates and formats differences', () => {
      expect(getSpectrogramDelta(100, 100)).toEqual({ value: 0, text: '+0', color: 'text-slate-400' });
      expect(getSpectrogramDelta(200, 100)).toEqual({ value: 100, text: '+100', color: 'text-slate-400' });
      expect(getSpectrogramDelta(100, 200)).toEqual({ value: -100, text: '-100', color: 'text-slate-400' });
      expect(getSpectrogramDelta(1000, 100)).toEqual({ value: 900, text: '+900', color: 'text-yellow-400' });
      expect(getSpectrogramDelta(100, 1000)).toEqual({ value: -900, text: '-900', color: 'text-yellow-400' });
      expect(getSpectrogramDelta(2000, 100)).toEqual({ value: 1900, text: '+1.9k', color: 'text-orange-400' });
      expect(getSpectrogramDelta(100, 2000)).toEqual({ value: -1900, text: '-1.9k', color: 'text-orange-400' });
    });
  });

  describe('Level Colors', () => {
    it('getLevelColor returns correct colors', () => {
      expect(getLevelColor(2)).toBe('text-red-400');
      expect(getLevelColor(-3)).toBe('text-orange-400');
      expect(getLevelColor(-9)).toBe('text-yellow-400');
      expect(getLevelColor(-15)).toBe('text-green-400');
      expect(getLevelColor(-24)).toBe('text-green-400');
      expect(getLevelColor(-40)).toBe('text-green-400');
    });

    it('getLevelBgColor returns correct background colors', () => {
      expect(getLevelBgColor(2)).toBe('bg-red-500');
      expect(getLevelBgColor(-3)).toBe('bg-orange-500');
      expect(getLevelBgColor(-9)).toBe('bg-yellow-500');
      expect(getLevelBgColor(-15)).toBe('bg-green-500');
      expect(getLevelBgColor(-24)).toBe('bg-green-500');
      expect(getLevelBgColor(-40)).toBe('bg-green-500');
    });
  });
});
