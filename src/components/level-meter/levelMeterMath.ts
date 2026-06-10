export const linearToDbExtended = (linear: number): number => {
  if (linear <= 0) return -60;
  return Math.max(-60, 20 * Math.log10(linear));
};

export const dbToMeterPosition = (db: number): number => {
  const minDb = -60;
  const maxDb = 6;
  const position = ((db - minDb) / (maxDb - minDb)) * 100;

  return Math.max(0, Math.min(100, position));
};

export const levelGridPositions = {
  minus60: dbToMeterPosition(-60),
  minus48: dbToMeterPosition(-48),
  minus36: dbToMeterPosition(-36),
  minus24: dbToMeterPosition(-24),
  minus18: dbToMeterPosition(-18),
  minus12: dbToMeterPosition(-12),
  minus6: dbToMeterPosition(-6),
  zero: dbToMeterPosition(0),
  plus6: dbToMeterPosition(6),
};

export const getLevelFillClass = (level: number) => {
  const db = linearToDbExtended(level);

  if (db > 3) return 'bg-red-600';
  if (db > 0) return 'bg-red-500';
  if (db > -3) return 'bg-gradient-to-r from-orange-500 to-red-500';
  if (db > -6) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  if (db > -12) return 'bg-gradient-to-r from-[var(--theme-deck-a-base)] to-yellow-500';
  if (db > -18) return 'bg-[var(--theme-deck-a-base)]';
  return 'bg-gradient-to-r from-blue-500 to-[var(--theme-deck-a-base)]';
};

export const getTruePeakHoldClass = (level: number) => {
  const db = linearToDbExtended(level);

  if (db > 0) return 'bg-red-600';
  if (db > -1) return 'bg-orange-500';
  return 'bg-white';
};

export const getRiskToneClass = (levelRisk: string) => {
  if (levelRisk === 'CLIP') return 'text-red-400';
  if (levelRisk === 'HOT') return 'text-orange-400';
  if (levelRisk === 'SAFE') return 'text-green-400';
  return 'text-slate-400';
};
