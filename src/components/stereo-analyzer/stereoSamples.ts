import type { VectorscopeSample } from './stereoAnalyzerTypes';

export const createVectorscopeSamples = (
  leftSamples: Float32Array,
  rightSamples: Float32Array
): VectorscopeSample[] => {
  const sampleStep = Math.max(1, Math.floor(leftSamples.length / 50));
  const newSamples: VectorscopeSample[] = [];

  for (let i = 0; i < leftSamples.length; i += sampleStep) {
    const l = leftSamples[i];
    const r = rightSamples[i];

    if (Math.abs(l) > 0.001 || Math.abs(r) > 0.001) {
      newSamples.push({ x: l, y: r, age: 0 });
    }
  }

  return newSamples;
};

export const mergeVectorscopeSamples = (
  newSamples: VectorscopeSample[],
  previousSamples: VectorscopeSample[],
  maxSamples: number
): VectorscopeSample[] => [
  ...newSamples,
  ...previousSamples.map(sample => ({ ...sample, age: sample.age + 1 })),
].slice(0, maxSamples);

