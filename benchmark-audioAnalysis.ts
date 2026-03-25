import { performance } from 'perf_hooks';
import {
  RMSAverager,
  StereoAverager,
  SpectrogramAverager,
  FrequencyAverager,
  StereoAnalysis,
  SpectrogramAnalysis,
  FrequencyAnalysis
} from './src/utils/audioAnalysis';

function runBenchmark() {
  console.log('--- Benchmarking Audio Analysis Averagers ---');

  const ITERATIONS = 100000;
  // Use a longer window to show the O(N) penalty vs O(1) benefit clearly
  // e.g. window of 2000ms at 16.67ms update is ~120 frames
  const WINDOW_MS = 2000;
  // Update interval of 0 allows us to force additions every time in our loop,
  // bypassing the throttle for the sake of the benchmark (we fake the performance.now internally,
  // wait actually the throttles use global performance.now. Let's patch global performance for the test
  // or set updateIntervalMs to 0 so it always updates).

  // We'll pass 0 for updateIntervalMs so it never throttles.
  const rmsAverager = new RMSAverager(WINDOW_MS, 0);
  const stereoAverager = new StereoAverager(WINDOW_MS, 0);
  const spectrogramAverager = new SpectrogramAverager(WINDOW_MS, 0);
  const frequencyAverager = new FrequencyAverager(WINDOW_MS, 0);

  // Fake data generators
  const rand = () => Math.random() * 2 - 1; // -1 to 1

  const stereoData: StereoAnalysis = {
    phaseCorrelation: rand(),
    stereoWidth: Math.random() * 100,
    balance: rand(),
    midLevel: Math.random(),
    sideLevel: Math.random(),
    midLufs: rand() * 20 - 20,
    sideLufs: rand() * 20 - 20,
    monoCompatibility: 'GOOD'
  };

  const spectrogramData: SpectrogramAnalysis = {
    brightness: Math.random() * 1000,
    dynamicRange: Math.random() * 100,
    activity: Math.random(),
    toneVsNoise: Math.random(),
    highFreqContent: Math.random() * 20000
  };

  const frequencyData: FrequencyAnalysis = {
    bassEnergy: rand() * 40 - 20,
    midEnergy: rand() * 40 - 20,
    highEnergy: rand() * 40 - 20,
    peakFreq: Math.random() * 20000,
    peakFreqBand: 'mid',
    spectralBalance: 'BALANCED'
  };

  // Pre-warm (JIT)
  for (let i = 0; i < 1000; i++) {
    rmsAverager.addSample(Math.random(), Math.random(), Math.random(), -10, -10, -10);
    rmsAverager.getSmoothedValues();

    stereoAverager.addSample(stereoData);
    stereoAverager.getSmoothedValues();

    spectrogramAverager.addSample(spectrogramData);
    spectrogramAverager.getSmoothedValues();

    frequencyAverager.addSample(frequencyData);
    frequencyAverager.getSmoothedValues();
  }

  // Actual Benchmark
  const startRms = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    rmsAverager.addSample(Math.random(), Math.random(), Math.random(), -10, -10, -10);
    rmsAverager.getSmoothedValues();
  }
  const endRms = performance.now();

  const startStereo = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    stereoAverager.addSample(stereoData);
    stereoAverager.getSmoothedValues();
  }
  const endStereo = performance.now();

  const startSpec = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    spectrogramAverager.addSample(spectrogramData);
    spectrogramAverager.getSmoothedValues();
  }
  const endSpec = performance.now();

  const startFreq = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    frequencyAverager.addSample(frequencyData);
    frequencyAverager.getSmoothedValues();
  }
  const endFreq = performance.now();

  const totalTime = (endRms - startRms) + (endStereo - startStereo) + (endSpec - startSpec) + (endFreq - startFreq);

  console.log(`RMS Averager: ${(endRms - startRms).toFixed(2)}ms`);
  console.log(`Stereo Averager: ${(endStereo - startStereo).toFixed(2)}ms`);
  console.log(`Spectrogram Averager: ${(endSpec - startSpec).toFixed(2)}ms`);
  console.log(`Frequency Averager: ${(endFreq - startFreq).toFixed(2)}ms`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms for ${ITERATIONS} iterations`);
}

runBenchmark();
