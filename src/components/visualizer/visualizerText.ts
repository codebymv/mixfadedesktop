export const normalizePresetName = (name: string): string => {
  const idx = name.lastIndexOf(' - ');
  const raw = idx !== -1 ? name.slice(idx + 3).trim() : name;
  return raw.replace(/\b\w/g, c => c.toUpperCase());
};
