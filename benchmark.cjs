const { performance } = require('perf_hooks');

// Mock AudioBuffer
class MockAudioBuffer {
  constructor(length, numberOfChannels) {
    this.length = length;
    this.numberOfChannels = numberOfChannels;
    this.channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      const data = new Float32Array(length);
      for (let j = 0; j < length; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      this.channels.push(data);
    }
  }

  getChannelData(channel) {
    return this.channels[channel];
  }
}

function originalGenerateStereoWaveformData(audioBuffer) {
  const width = 800;
  const samples = audioBuffer.length;
  const samplesPerPixel = Math.floor(samples / width);

  const leftChannelData = audioBuffer.getChannelData(0);
  const rightChannelData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannelData;

  const leftProcessedData = new Float32Array(width * 2);
  const step = Math.max(1, Math.floor(samplesPerPixel / 100));

  for (let x = 0; x < width; x++) {
    const startSample = x * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, samples);

    let min = 0;
    let max = 0;

    for (let i = startSample; i < endSample; i += step) {
      const sample = leftChannelData[i];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }

    leftProcessedData[x * 2] = min;
    leftProcessedData[x * 2 + 1] = max;
  }

  const rightProcessedData = new Float32Array(width * 2);
  for (let x = 0; x < width; x++) {
    const startSample = x * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, samples);

    let min = 0;
    let max = 0;

    for (let i = startSample; i < endSample; i += step) {
      const sample = rightChannelData[i];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }

    rightProcessedData[x * 2] = min;
    rightProcessedData[x * 2 + 1] = max;
  }

  return { leftProcessedData, rightProcessedData };
}

function optimizedGenerateStereoWaveformData(audioBuffer) {
  const width = 800;
  const samples = audioBuffer.length;
  const samplesPerPixel = Math.floor(samples / width);

  const leftChannelData = audioBuffer.getChannelData(0);
  const isStereo = audioBuffer.numberOfChannels > 1;
  const rightChannelData = isStereo ? audioBuffer.getChannelData(1) : leftChannelData;

  const leftProcessedData = new Float32Array(width * 2);
  const rightProcessedData = new Float32Array(width * 2);

  const step = Math.max(1, Math.floor(samplesPerPixel / 100));

  for (let x = 0; x < width; x++) {
    const startSample = x * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, samples);

    let leftMin = 0;
    let leftMax = 0;
    let rightMin = 0;
    let rightMax = 0;

    for (let i = startSample; i < endSample; i += step) {
        const leftSample = leftChannelData[i];
        if (leftSample < leftMin) leftMin = leftSample;
        else if (leftSample > leftMax) leftMax = leftSample;

        const rightSample = rightChannelData[i];
        if (rightSample < rightMin) rightMin = rightSample;
        else if (rightSample > rightMax) rightMax = rightSample;
    }

    leftProcessedData[x * 2] = leftMin;
    leftProcessedData[x * 2 + 1] = leftMax;
    rightProcessedData[x * 2] = rightMin;
    rightProcessedData[x * 2 + 1] = rightMax;
  }

  return { leftProcessedData, rightProcessedData };
}

function optimizedMonoGenerateStereoWaveformData(audioBuffer) {
  const width = 800;
  const samples = audioBuffer.length;
  const samplesPerPixel = Math.floor(samples / width);

  const leftChannelData = audioBuffer.getChannelData(0);
  const isStereo = audioBuffer.numberOfChannels > 1;
  const rightChannelData = isStereo ? audioBuffer.getChannelData(1) : leftChannelData;

  const leftProcessedData = new Float32Array(width * 2);
  const rightProcessedData = new Float32Array(width * 2);

  const step = Math.max(1, Math.floor(samplesPerPixel / 100));

  for (let x = 0; x < width; x++) {
    const startSample = x * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, samples);

    let leftMin = 0;
    let leftMax = 0;

    if (isStereo) {
        let rightMin = 0;
        let rightMax = 0;

        for (let i = startSample; i < endSample; i += step) {
            const leftSample = leftChannelData[i];
            if (leftSample < leftMin) leftMin = leftSample;
            else if (leftSample > leftMax) leftMax = leftSample;

            const rightSample = rightChannelData[i];
            if (rightSample < rightMin) rightMin = rightSample;
            else if (rightSample > rightMax) rightMax = rightSample;
        }

        leftProcessedData[x * 2] = leftMin;
        leftProcessedData[x * 2 + 1] = leftMax;
        rightProcessedData[x * 2] = rightMin;
        rightProcessedData[x * 2 + 1] = rightMax;
    } else {
        for (let i = startSample; i < endSample; i += step) {
            const sample = leftChannelData[i];
            if (sample < leftMin) leftMin = sample;
            else if (sample > leftMax) leftMax = sample;
        }

        leftProcessedData[x * 2] = leftMin;
        leftProcessedData[x * 2 + 1] = leftMax;
        // In mono, right channel data is same as left
        rightProcessedData[x * 2] = leftMin;
        rightProcessedData[x * 2 + 1] = leftMax;
    }
  }

  return { leftProcessedData, rightProcessedData };
}


function runBenchmark() {
  console.log("Preparing data...");
  // 10 minutes at 44100Hz = 26,460,000 samples
  const bufferStereo = new MockAudioBuffer(26460000, 2);
  const bufferMono = new MockAudioBuffer(26460000, 1);

  const iterations = 50;

  console.log("Running Original Stereo...");
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    originalGenerateStereoWaveformData(bufferStereo);
  }
  let originalStereoTime = performance.now() - start;

  console.log("Running Optimized Stereo...");
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedGenerateStereoWaveformData(bufferStereo);
  }
  let optimizedStereoTime = performance.now() - start;

  console.log("Running Optimized Mono-Branching Stereo...");
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedMonoGenerateStereoWaveformData(bufferStereo);
  }
  let optimizedMonoBranchingStereoTime = performance.now() - start;


  console.log("Running Original Mono...");
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    originalGenerateStereoWaveformData(bufferMono);
  }
  let originalMonoTime = performance.now() - start;

  console.log("Running Optimized Mono...");
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedGenerateStereoWaveformData(bufferMono);
  }
  let optimizedMonoTime = performance.now() - start;

  console.log("Running Optimized Mono-Branching Mono...");
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedMonoGenerateStereoWaveformData(bufferMono);
  }
  let optimizedMonoBranchingMonoTime = performance.now() - start;


  console.log(`\nResults (Total time for ${iterations} iterations):`);
  console.log(`Stereo Original: ${originalStereoTime.toFixed(2)}ms`);
  console.log(`Stereo Optimized: ${optimizedStereoTime.toFixed(2)}ms (${((originalStereoTime - optimizedStereoTime)/originalStereoTime*100).toFixed(2)}% faster)`);
  console.log(`Stereo Optimized (Branching): ${optimizedMonoBranchingStereoTime.toFixed(2)}ms (${((originalStereoTime - optimizedMonoBranchingStereoTime)/originalStereoTime*100).toFixed(2)}% faster)`);

  console.log(`Mono Original: ${originalMonoTime.toFixed(2)}ms`);
  console.log(`Mono Optimized: ${optimizedMonoTime.toFixed(2)}ms (${((originalMonoTime - optimizedMonoTime)/originalMonoTime*100).toFixed(2)}% faster)`);
  console.log(`Mono Optimized (Branching): ${optimizedMonoBranchingMonoTime.toFixed(2)}ms (${((originalMonoTime - optimizedMonoBranchingMonoTime)/originalMonoTime*100).toFixed(2)}% faster)`);

}

runBenchmark();
