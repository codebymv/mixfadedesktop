import { useRef, useEffect, useCallback } from 'react';
import { AudioLevels, AudioUtils, StereoAnalysis } from '../utils/audioAnalysis';
import { AudioContextNodes } from './useAudioContext';

export interface AudioAnalysisCallbacks {
  onAudioLevels?: (levels: AudioLevels) => void;
  onFrequencyData?: (data: Float32Array) => void;
  onStereoData?: (data: StereoAnalysis, leftSamples?: Float32Array, rightSamples?: Float32Array) => void;
}

export const useAudioAnalysis = (
  isPlaying: boolean,
  crossfadeVolume: number,
  updateRate: number,
  getNodes: () => AudioContextNodes,
  callbacks: AudioAnalysisCallbacks
) => {
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const animationFrame = useRef<number | null>(null);

  const updateAnalysisData = useCallback(() => {
    const { analyserNode, leftAnalyser, rightAnalyser } = getNodes();
    const { onAudioLevels, onFrequencyData, onStereoData } = callbacks;

    if (analyserNode && isPlaying) {
      // Get frequency data
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserNode.getFloatFrequencyData(dataArray);
      if (onFrequencyData) {
        onFrequencyData(dataArray);
      }
    }

    if (leftAnalyser && rightAnalyser && isPlaying && (onAudioLevels || onStereoData)) {
      // Get separate channel data for levels
      const leftDataArray = new Uint8Array(leftAnalyser.frequencyBinCount);
      const rightDataArray = new Uint8Array(rightAnalyser.frequencyBinCount);
      
      leftAnalyser.getByteTimeDomainData(leftDataArray);
      rightAnalyser.getByteTimeDomainData(rightDataArray);
      
      // Convert to float samples
      const leftSamples = new Float32Array(leftDataArray.length);
      const rightSamples = new Float32Array(rightDataArray.length);
      
      for (let i = 0; i < leftDataArray.length; i++) {
        leftSamples[i] = (leftDataArray[i] - 128) / 128;
      }
      for (let i = 0; i < rightDataArray.length; i++) {
        rightSamples[i] = (rightDataArray[i] - 128) / 128;
      }
      
      // Calculate separate RMS values
      const { leftRms, rightRms, combinedRms } = AudioUtils.calculateStereoRMS(leftSamples, rightSamples);
      
      // Calculate peak levels (for visual meters)
      const leftPeak = Math.min(1, leftRms * 4);
      const rightPeak = Math.min(1, rightRms * 4);
      
      // Calculate LUFS for combined and individual channels
      const lufs = AudioUtils.estimateLUFS(combinedRms);
      const { leftLufs, rightLufs } = AudioUtils.estimateChannelLUFS(leftRms, rightRms);
      
      // Calculate professional stereo analysis using raw samples (not affected by crossfade)
      if (onStereoData) {
        const stereoAnalysis = AudioUtils.calculateStereoAnalysis(leftSamples, rightSamples);
        onStereoData(stereoAnalysis, leftSamples, rightSamples);
      }
      
      // Apply crossfade volume to reported levels
      if (onAudioLevels) {
        const effectiveLeftPeak = crossfadeVolume === 0 ? 0 : leftPeak;
        const effectiveRightPeak = crossfadeVolume === 0 ? 0 : rightPeak;
        const effectiveLeftRms = crossfadeVolume === 0 ? 0 : leftRms;
        const effectiveRightRms = crossfadeVolume === 0 ? 0 : rightRms;
        const effectiveCombinedRms = crossfadeVolume === 0 ? 0 : combinedRms;
        const effectiveLufs = crossfadeVolume === 0 ? -70 : lufs;
        const effectiveLeftLufs = crossfadeVolume === 0 ? -70 : leftLufs;
        const effectiveRightLufs = crossfadeVolume === 0 ? -70 : rightLufs;
        
        onAudioLevels({
          left: effectiveLeftPeak,
          right: effectiveRightPeak,
          leftRms: effectiveLeftRms,
          rightRms: effectiveRightRms,
          rms: effectiveCombinedRms,
          lufs: effectiveLufs,
          leftLufs: effectiveLeftLufs,
          rightLufs: effectiveRightLufs
        });
      }
    }
  }, [isPlaying, crossfadeVolume, getNodes, callbacks]);

  const sendZeroValues = useCallback(() => {
    const { onAudioLevels, onFrequencyData, onStereoData } = callbacks;
    
    if (onAudioLevels) {
      onAudioLevels({ 
        left: 0, 
        right: 0, 
        rms: 0, 
        lufs: -70,
        leftRms: 0, 
        rightRms: 0, 
        leftLufs: -70,
        rightLufs: -70
      });
    }
    if (onFrequencyData) {
      onFrequencyData(new Float32Array(0));
    }
    if (onStereoData) {
      onStereoData({
        phaseCorrelation: 0,
        stereoWidth: 0,
        balance: 0,
        midLevel: 0,
        sideLevel: 0,
        midLufs: -70,
        sideLufs: -70,
        monoCompatibility: 'EXCELLENT'
      }, new Float32Array(0), new Float32Array(0));
    }
  }, [callbacks]);

  const cleanup = useCallback(() => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  // Audio level monitoring with configurable update rate
  useEffect(() => {
    // Clear any existing intervals
    cleanup();

    if (isPlaying) {
      // Use configurable update rate instead of requestAnimationFrame
      const intervalMs = 1000 / updateRate;
      analysisInterval.current = setInterval(updateAnalysisData, intervalMs);
      console.log(`Started analysis with ${updateRate} FPS (${intervalMs}ms interval)`);
    } else {
      // Send zero values when not playing
      sendZeroValues();
    }

    return cleanup;
  }, [isPlaying, updateRate, updateAnalysisData, sendZeroValues, cleanup]);

  return {
    cleanup
  };
};