import '@testing-library/jest-dom';

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    state: 'suspended',
    currentTime: 0,
    destination: { connect: jest.fn(), disconnect: jest.fn() },
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    createAnalyser: jest.fn(() => ({
      fftSize: 2048,
      connect: jest.fn(),
      disconnect: jest.fn()
    })),
    createGain: jest.fn(() => ({
      gain: {
        setValueAtTime: jest.fn(),
        cancelScheduledValues: jest.fn(),
        value: 1
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    })),
    createChannelSplitter: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn()
    })),
    createMediaElementSource: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn()
    }))
  }))
});

// Mock HTMLAudioElement
Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    volume: 1,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn()
  }))
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url')
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

// Mock Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Array(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn()
  }))
});

// Suppress console warnings during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});