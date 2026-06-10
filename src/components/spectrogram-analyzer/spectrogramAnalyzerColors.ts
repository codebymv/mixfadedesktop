import { getDynamicRangeColor } from '../../utils/analysisFormatters';

export const getSpectrogramFrequencyColor = (frequency: number) => {
  if (frequency < 200) {
    return { text: 'text-red-400', bg: 'bg-red-500' };
  }

  if (frequency < 2000) {
    return { text: 'text-orange-400', bg: 'bg-orange-500' };
  }

  if (frequency < 8000) {
    return { text: 'text-green-400', bg: 'bg-green-500' };
  }

  return { text: 'text-purple-400', bg: 'bg-purple-500' };
};

export const getDynamicRangeBgColor = (rangeDb: number) => {
  const textColor = getDynamicRangeColor(rangeDb);

  if (textColor.includes('green')) return 'bg-green-500';
  if (textColor.includes('yellow')) return 'bg-yellow-500';
  if (textColor.includes('orange')) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getActivityBgColor = (activity: number) => {
  if (activity > 0.8) return 'bg-red-500';
  if (activity > 0.6) return 'bg-orange-500';
  if (activity > 0.4) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const getToneVsNoiseBgColor = (ratio: number) => {
  if (ratio > 0.7) return 'bg-green-500';
  if (ratio > 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
};
