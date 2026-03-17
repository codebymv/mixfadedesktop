declare module 'butterchurn' {
  export interface ButterchurnVisualizer {
    connectAudio(audioNode: AudioNode): void;
    disconnectAudio(audioNode: AudioNode): void;
    loadPreset(presetMap: unknown, blendTime?: number): void;
    render(): void;
    setRendererSize(width: number, height: number, opts?: Record<string, unknown>): void;
  }

  const butterchurn: {
    createVisualizer(
      context: AudioContext,
      canvas: HTMLCanvasElement,
      opts: { width: number; height: number }
    ): ButterchurnVisualizer;
  };

  export default butterchurn;
}

declare module 'butterchurn-presets' {
  const butterchurnPresets: {
    getPresets(): Record<string, unknown>;
  };

  export default butterchurnPresets;
}

declare module 'butterchurn/lib/isSupported.min' {
  const isButterchurnSupported: () => boolean;
  export default isButterchurnSupported;
}

