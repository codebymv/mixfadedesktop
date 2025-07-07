// Utility functions for formatting and coloring audio analysis data
// Extracted from AnalysisPanel.tsx for better code organization

// Helper function to convert linear amplitude to dB
export const linearToDb = (linear: number): number => {
  return linear > 0 ? 20 * Math.log10(linear) : -Infinity;
};

// Format decibel values with appropriate precision and infinity handling
export const formatDb = (db: number): string => {
  if (db === -Infinity || isNaN(db)) return '-∞';
  if (db < -60) return '-∞';
  return db.toFixed(1);
};

// Format frequency values with appropriate units (Hz/kHz)
export const formatFrequency = (freq: number): string => {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`;
  }
  return freq.toFixed(0);
};

// Format correlation values (-1 to 1 range)
export const formatCorrelation = (correlation: number): string => {
  return correlation.toFixed(2);
};

// Format stereo width as percentage
export const formatStereoWidth = (width: number): string => {
  return `${width.toFixed(0)}%`;
};

// Format brightness (spectral centroid) values
export const formatBrightness = (brightness: number): string => {
  if (brightness >= 1000) {
    return `${(brightness / 1000).toFixed(1)}k`;
  }
  return brightness.toFixed(0);
};

// Format activity as percentage
export const formatActivity = (activity: number): string => {
  return `${(activity * 100).toFixed(0)}%`;
};

// Format tone vs noise ratio
export const formatToneVsNoise = (ratio: number): string => {
  if (ratio > 0.7) return 'TONE';
  if (ratio > 0.3) return 'MIX';
  return 'NOISE';
};

// Get color class for frequency bands
export const getBandColor = (band: string): string => {
  switch (band) {
    case 'bass': return 'text-red-400';
    case 'mid': return 'text-yellow-400';
    case 'high': return 'text-blue-400';
    default: return 'text-slate-300';
  }
};

// Get color class for balance analysis
export const getBalanceColor = (balance: string): string => {
  switch (balance) {
    case 'bass-heavy': return 'text-red-400';
    case 'bright': return 'text-blue-400';
    case 'balanced': return 'text-green-400';
    default: return 'text-slate-300';
  }
};

// Get color class for stereo correlation
export const getStereoCorrelationColor = (correlation: number): string => {
  if (correlation > 0.8) return 'text-green-400'; // Good correlation
  if (correlation > 0.5) return 'text-yellow-400'; // Moderate correlation
  if (correlation > 0) return 'text-orange-400'; // Low correlation
  return 'text-red-400'; // Phase issues
};

// Get color class for stereo width
export const getStereoWidthColor = (width: number): string => {
  if (width > 60) return 'text-green-400'; // Good width (wide)
  if (width > 30) return 'text-yellow-400'; // Fair width (moderate)
  if (width > 10) return 'text-orange-400'; // Poor width (narrow)
  return 'text-red-400'; // Very poor (mono/phase issues)
};

// Get color class for L/R balance
export const getLRBalanceColor = (balance: number): string => {
  const absBalance = Math.abs(balance);
  if (absBalance < 0.1) return 'text-green-400'; // Well balanced
  if (absBalance < 0.3) return 'text-yellow-400'; // Slightly off
  return 'text-red-400'; // Significantly unbalanced
};

// Get color class for mono compatibility
export const getMonoCompatibilityColor = (compatibility: number): string => {
  if (compatibility > 0.8) return 'text-green-400'; // Excellent
  if (compatibility > 0.6) return 'text-yellow-400'; // Good
  if (compatibility > 0.4) return 'text-orange-400'; // Fair
  return 'text-red-400'; // Poor
};

// Get color class for brightness (spectral centroid)
export const getBrightnessColor = (brightness: number): string => {
  if (brightness > 4000) return 'text-blue-400'; // Very bright
  if (brightness > 2000) return 'text-cyan-400'; // Bright
  if (brightness > 1000) return 'text-green-400'; // Balanced
  if (brightness > 500) return 'text-yellow-400'; // Warm
  return 'text-red-400'; // Dark
};

// Get color class for dynamic range
export const getDynamicRangeColor = (range: number): string => {
  if (range > 20) return 'text-green-400'; // Excellent dynamics
  if (range > 15) return 'text-yellow-400'; // Good dynamics
  if (range > 10) return 'text-orange-400'; // Moderate dynamics
  return 'text-red-400'; // Compressed
};

// Get color class for activity level
export const getActivityColor = (activity: number): string => {
  if (activity > 0.8) return 'text-red-400'; // Very active
  if (activity > 0.6) return 'text-orange-400'; // Active
  if (activity > 0.4) return 'text-yellow-400'; // Moderate
  if (activity > 0.2) return 'text-green-400'; // Calm
  return 'text-green-400'; // Very calm
};

// Get color class for tone vs noise ratio
export const getToneVsNoiseColor = (ratio: number): string => {
  if (ratio > 0.7) return 'text-blue-400'; // Tonal
  if (ratio > 0.3) return 'text-yellow-400'; // Mixed
  return 'text-red-400'; // Noisy
};

// Calculate and format delta between two values
export const getDelta = (valueA: number, valueB: number) => {
  const delta = valueA - valueB;
  const absDelta = Math.abs(delta);
  const sign = delta >= 0 ? '+' : '';
  
  let color = 'text-slate-400';
  if (absDelta > 3) {
    color = delta > 0 ? 'text-green-400' : 'text-red-400';
  } else if (absDelta > 1) {
    color = delta > 0 ? 'text-green-300' : 'text-red-300';
  }
  
  let text: string;
  if (absDelta < 0.1) {
    text = '0.0';
  } else if (absDelta < 1) {
    text = `${sign}${delta.toFixed(1)}`;
  } else {
    text = `${sign}${delta.toFixed(0)}`;
  }
  
  return { value: delta, text, color };
};

// Calculate and format frequency delta
export const getFrequencyDelta = (freqA: number, freqB: number) => {
  const delta = freqA - freqB;
  const absDelta = Math.abs(delta);
  const sign = delta >= 0 ? '+' : '';
  
  let color = 'text-slate-400';
  if (absDelta > 1000) {
    color = 'text-orange-400';
  } else if (absDelta > 500) {
    color = 'text-yellow-400';
  }
  
  let text: string;
  if (absDelta < 10) {
    text = `${sign}${delta.toFixed(0)}`;
  } else if (absDelta >= 1000) {
    text = `${sign}${(delta / 1000).toFixed(1)}k`;
  } else {
    text = `${sign}${delta.toFixed(0)}`;
  }
  
  return { value: delta, text, color };
};

// Calculate and format stereo percentage delta
export const getStereoPercent = (widthA: number, widthB: number) => {
  const deltaPercent = widthA - widthB; // Values are already in percentage (0-100)
  const absDelta = Math.abs(deltaPercent);
  const sign = deltaPercent >= 0 ? '+' : '';
  
  let color = 'text-slate-400';
  if (absDelta > 20) {
    color = 'text-orange-400';
  } else if (absDelta > 10) {
    color = 'text-yellow-400';
  }
  
  let text: string;
  if (absDelta < 1) {
    text = `${sign}${deltaPercent.toFixed(1)}%`;
  } else {
    text = `${sign}${deltaPercent.toFixed(0)}%`;
  }
  
  return { value: deltaPercent, text, color };
};

// Get color class for audio levels based on dB value
export const getLevelColor = (db: number): string => {
  if (db > 0) return 'text-red-400'; // Poor - digital clipping
  if (db > -6) return 'text-orange-400'; // Poor - hot zone
  if (db > -12) return 'text-yellow-400'; // Fair - loud zone
  if (db > -18) return 'text-green-400'; // Good - optimal zone
  if (db > -30) return 'text-green-400'; // Good - safe zone
  return 'text-green-400'; // Good - very low level (still usable)
};

// Get background color class for audio levels based on dB value
export const getLevelBgColor = (db: number): string => {
  if (db > 0) return 'bg-red-500'; // Poor - digital clipping
  if (db > -6) return 'bg-orange-500'; // Poor - hot zone
  if (db > -12) return 'bg-yellow-500'; // Fair - loud zone
  if (db > -18) return 'bg-green-500'; // Good - optimal zone
  if (db > -30) return 'bg-green-500'; // Good - safe zone
  return 'bg-green-500'; // Good - very low level (still usable)
};

// Calculate and format spectrogram delta
export const getSpectrogramDelta = (valueA: number, valueB: number) => {
  const delta = valueA - valueB;
  const absDelta = Math.abs(delta);
  const sign = delta >= 0 ? '+' : '';
  
  let color = 'text-slate-400';
  if (absDelta > 1000) {
    color = 'text-orange-400';
  } else if (absDelta > 500) {
    color = 'text-yellow-400';
  }
  
  let text: string;
  if (absDelta >= 1000) {
    text = `${sign}${(delta / 1000).toFixed(1)}k`;
  } else {
    text = `${sign}${delta.toFixed(0)}`;
  }
  
  return { value: delta, text, color };
};