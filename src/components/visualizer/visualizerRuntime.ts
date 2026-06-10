const MAX_RENDER_DPR = 1.25;
const MAX_RENDER_PIXELS = 2560 * 1440;

export const TARGET_FPS = 45;
export const ACTIVE_PRESET_BLEND_SECONDS = 0.7;

export const getRenderScale = (width: number, height: number) => {
  const cappedDpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
  const desiredPixels = Math.max(1, width * cappedDpr) * Math.max(1, height * cappedDpr);
  if (desiredPixels <= MAX_RENDER_PIXELS) return cappedDpr;
  return cappedDpr * Math.sqrt(MAX_RENDER_PIXELS / desiredPixels);
};

