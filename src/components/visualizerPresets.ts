import butterchurnPresets from 'butterchurn-presets';
export { DEFAULT_VIS_SEED } from './visualizerSeed';

const PRESET_ENTRIES = Object.entries(butterchurnPresets.getPresets());

export const getPresetEntryForSeed = (seed: number) => PRESET_ENTRIES.length
  ? (PRESET_ENTRIES[(seed >>> 0) % PRESET_ENTRIES.length] as [string, unknown])
  : ['No Preset', null] as [string, unknown];
