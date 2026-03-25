import { formatToneVsNoise, getLevelRiskLabel } from '../../src/utils/analysisFormatters';

describe('analysisFormatters', () => {
  describe('formatToneVsNoise', () => {
    it('should return TONE when ratio is greater than 0.7', () => {
      expect(formatToneVsNoise(0.71)).toBe('TONE');
      expect(formatToneVsNoise(0.8)).toBe('TONE');
      expect(formatToneVsNoise(1.0)).toBe('TONE');
    });

    it('should return MIX when ratio is greater than 0.3 and less than or equal to 0.7', () => {
      expect(formatToneVsNoise(0.31)).toBe('MIX');
      expect(formatToneVsNoise(0.5)).toBe('MIX');
      expect(formatToneVsNoise(0.7)).toBe('MIX');
    });

    it('should return NOISE when ratio is less than or equal to 0.3', () => {
      expect(formatToneVsNoise(0.3)).toBe('NOISE');
      expect(formatToneVsNoise(0.1)).toBe('NOISE');
      expect(formatToneVsNoise(0.0)).toBe('NOISE');
      expect(formatToneVsNoise(-0.1)).toBe('NOISE'); // Edge case handling
    });
  });

  describe('getLevelRiskLabel', () => {
    it('should return CLIP when peakDb is greater than 0', () => {
      expect(getLevelRiskLabel(0.1)).toBe('CLIP');
      expect(getLevelRiskLabel(1.0)).toBe('CLIP');
      expect(getLevelRiskLabel(10.0)).toBe('CLIP');
    });

    it('should return HOT when peakDb is greater than -3 and less than or equal to 0', () => {
      expect(getLevelRiskLabel(-2.9)).toBe('HOT');
      expect(getLevelRiskLabel(-1.0)).toBe('HOT');
      expect(getLevelRiskLabel(0.0)).toBe('HOT');
    });

    it('should return SAFE when peakDb is greater than -12 and less than or equal to -3', () => {
      expect(getLevelRiskLabel(-11.9)).toBe('SAFE');
      expect(getLevelRiskLabel(-6.0)).toBe('SAFE');
      expect(getLevelRiskLabel(-3.0)).toBe('SAFE');
    });

    it('should return LOW when peakDb is less than or equal to -12', () => {
      expect(getLevelRiskLabel(-12.0)).toBe('LOW');
      expect(getLevelRiskLabel(-20.0)).toBe('LOW');
      expect(getLevelRiskLabel(-60.0)).toBe('LOW');
      expect(getLevelRiskLabel(-Infinity)).toBe('LOW'); // Edge case handling
    });
  });
});
