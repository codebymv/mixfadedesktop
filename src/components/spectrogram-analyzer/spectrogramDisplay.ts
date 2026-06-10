export const formatSpectrogramFrequency = (frequency: number): string => {
  if (frequency >= 1000) {
    return `${(frequency / 1000).toFixed(1)}k`;
  }

  return `${frequency}`;
};

export const getFrequencyProgressPercent = (frequency: number) => {
  return Math.min(
    100,
    (Math.log10(Math.max(frequency, 20) / 20) / Math.log10(1000)) * 100
  );
};

export const getDynamicRangeProgressPercent = (dynamicRange: number) => {
  return Math.min(100, (dynamicRange / 40) * 100);
};
