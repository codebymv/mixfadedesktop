export const DEFAULT_VIS_SEED = (Math.random() * 0xffffffff) >>> 0;

export const getFallbackPresetName = (seed: number) => `Seed ${seed >>> 0}`;
