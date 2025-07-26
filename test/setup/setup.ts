import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.toDataURL = jest.fn();

// Mock HTMLVideoElement
HTMLVideoElement.prototype.play = jest.fn();

// Mock face-api.js
jest.mock('face-api.js', () => ({
  nets: {
    tinyFaceDetector: {
      loadFromUri: jest.fn().mockResolvedValue(undefined),
    },
    faceLandmark68Net: {
      loadFromUri: jest.fn().mockResolvedValue(undefined),
    },
    faceRecognitionNet: {
      loadFromUri: jest.fn().mockResolvedValue(undefined),
    },
  },
  detectSingleFace: jest.fn(),
  TinyFaceDetectorOptions: jest.fn(),
  euclideanDistance: jest.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
});

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});