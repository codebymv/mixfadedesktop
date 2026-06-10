import {
  getLRBalanceColor,
  getStereoCorrelationColor,
  getStereoWidthColor,
} from '../../utils/analysisFormatters';

export const getCorrelationBgColor = (correlation: number) => {
  const textColor = getStereoCorrelationColor(correlation);
  if (textColor.includes('green')) return 'bg-green-500';
  if (textColor.includes('yellow')) return 'bg-yellow-500';
  if (textColor.includes('orange')) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getStereoWidthBgColor = (width: number) => {
  const textColor = getStereoWidthColor(width);
  if (textColor.includes('green')) return 'bg-green-500';
  if (textColor.includes('yellow')) return 'bg-yellow-500';
  if (textColor.includes('orange')) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getBalanceBgColor = (balance: number) => {
  const textColor = getLRBalanceColor(balance);
  if (textColor.includes('green')) return 'bg-green-500';
  if (textColor.includes('yellow')) return 'bg-yellow-500';
  return 'bg-red-500';
};

