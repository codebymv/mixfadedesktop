import butterchurnPresets from 'butterchurn-presets';

export const DEFAULT_VIS_SEED = (Math.random() * 0xFFFFFFFF) >>> 0;

const PRESET_ENTRIES = Object.entries(butterchurnPresets.getPresets());

export const getPresetEntryForSeed = (seed: number) => PRESET_ENTRIES.length
  ? (PRESET_ENTRIES[(seed >>> 0) % PRESET_ENTRIES.length] as [string, unknown])
  : ['No Preset', null] as [string, unknown];
