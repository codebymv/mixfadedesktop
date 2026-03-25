import { renderHook, act } from '@testing-library/react';
import { useAudioContext } from '../../src/hooks/useAudioContext';

// Mock audio element
const mockAudioElement = {
  volume: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

describe('useAudioContext Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with null values', () => {
      const { result } = renderHook(() => useAudioContext());
      const nodes = result.current.getNodes();
      
      expect(nodes.audioContext).toBeNull();
      expect(nodes.analyserNode).toBeNull();
      expect(nodes.gainNode).toBeNull();
      expect(nodes.splitterNode).toBeNull();
      expect(nodes.sourceNode).toBeNull();
      expect(result.current.isSetup()).toBe(false);
    });
  });

  describe('Audio Context Setup', () => {
    it('should create audio context and nodes when setup is called', async () => {
      const { result } = renderHook(() => useAudioContext());
      
      await act(async () => {
        await result.current.setupAudioContext(mockAudioElement as any, 1, false, 1);
      });
      
      const nodes = result.current.getNodes();
      expect(nodes.audioContext).not.toBeNull();
      expect(nodes.analyserNode).not.toBeNull();
      expect(nodes.gainNode).not.toBeNull();
      expect(nodes.splitterNode).not.toBeNull();
      expect(nodes.sourceNode).not.toBeNull();
      expect(result.current.isSetup()).toBe(true);
    });
    
    it('should resume audio context after creation', async () => {
      const { result } = renderHook(() => useAudioContext());
      
      await act(async () => {
        await result.current.setupAudioContext(mockAudioElement as any, 1, false, 1);
      });
      
      const nodes = result.current.getNodes();
      // Verify that resume was called on the mocked AudioContext
      expect(nodes.audioContext?.resume).toHaveBeenCalled();
    });
  });

  describe('Volume Control', () => {
    it('should update volume when audio context is set up', async () => {
      const { result } = renderHook(() => useAudioContext());
      
      await act(async () => {
        await result.current.setupAudioContext(mockAudioElement as any, 1, false, 1);
      });
      
      const nodes = result.current.getNodes();
      
      act(() => {
        result.current.updateVolume(0.5, false, 1);
      });
      
      expect(nodes.gainNode?.gain.setValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.any(Number)
      );
    });
    
    it('should handle volume updates gracefully when not set up', () => {
      const { result } = renderHook(() => useAudioContext());
      
      expect(() => {
        act(() => {
          result.current.updateVolume(0.5, false, 1);
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should close audio context on cleanup', async () => {
      const { result } = renderHook(() => useAudioContext());
      
      await act(async () => {
        await result.current.setupAudioContext(mockAudioElement as any, 1, false, 1);
      });
      
      const nodes = result.current.getNodes();
      const audioContext = nodes.audioContext;
      
      act(() => {
        result.current.cleanup();
      });
      
      expect(audioContext?.close).toHaveBeenCalled();
      expect(result.current.isSetup()).toBe(false);
    });
    
    it('should handle cleanup gracefully when not set up', () => {
      const { result } = renderHook(() => useAudioContext());
      
      expect(() => {
        act(() => {
          result.current.cleanup();
        });
      }).not.toThrow();
    });

    it('should ignore disconnect errors during cleanup', async () => {
      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.setupAudioContext(mockAudioElement as any, 1, false, 1);
      });

      const nodes = result.current.getNodes();

      // Mock disconnect to throw an error
      const mockError = new Error('disconnect error');

      if (nodes.sourceNode) {
        nodes.sourceNode.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.analyserNode) {
        nodes.analyserNode.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.gainNode) {
        nodes.gainNode.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.splitterNode) {
        nodes.splitterNode.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.leftAnalyser) {
        nodes.leftAnalyser.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.rightAnalyser) {
        nodes.rightAnalyser.disconnect = jest.fn().mockImplementation(() => { throw mockError; });
      }
      if (nodes.audioContext) {
        nodes.audioContext.close = jest.fn().mockImplementation(() => { throw mockError; });
      }

      expect(() => {
        act(() => {
          result.current.cleanup();
        });
      }).not.toThrow();

      // Verify cleanup was still performed (nodes are nulled out and state reset)
      expect(result.current.isSetup()).toBe(false);
      const cleanedNodes = result.current.getNodes();
      expect(cleanedNodes.sourceNode).toBeNull();
      expect(cleanedNodes.analyserNode).toBeNull();
      expect(cleanedNodes.gainNode).toBeNull();
      expect(cleanedNodes.splitterNode).toBeNull();
      expect(cleanedNodes.leftAnalyser).toBeNull();
      expect(cleanedNodes.rightAnalyser).toBeNull();
      expect(cleanedNodes.audioContext).toBeNull();
    });
  });
});