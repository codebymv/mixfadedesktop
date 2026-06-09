import { useEffect, useState } from 'react';
import {
  buildAnalysisSnapshot,
  hasSmoothedAnalysis,
  type SmoothedAnalysisValues
} from './analysisSnapshots';
import type { StereoAnalysis } from '../../../utils/audioAnalysis';
import type { AnalysisSnapshot } from './types';

interface UseRecentAnalysisSnapshotsParams extends SmoothedAnalysisValues {
  trackAFile?: File;
  trackBFile?: File;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
}

const RECENT_ANALYSIS_KEY = 'mixfade-recent-analysis';

export function useRecentAnalysisSnapshots({
  trackAFile,
  trackBFile,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  trackASmoothed,
  trackBSmoothed,
  trackAFreqSmoothed,
  trackBFreqSmoothed,
  trackAStereoSmoothed,
  trackBStereoSmoothed,
  trackASpectrogramSmoothed,
  trackBSpectrogramSmoothed
}: UseRecentAnalysisSnapshotsParams): AnalysisSnapshot[] {
  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisSnapshot[]>([]);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(RECENT_ANALYSIS_KEY);
    if (savedAnalysis) {
      try {
        setRecentAnalysis(JSON.parse(savedAnalysis));
      } catch (error) {
        console.warn('Failed to load recent analysis from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECENT_ANALYSIS_KEY, JSON.stringify(recentAnalysis));
  }, [recentAnalysis]);

  useEffect(() => {
    const smoothed = {
      trackASmoothed,
      trackBSmoothed,
      trackAFreqSmoothed,
      trackBFreqSmoothed,
      trackAStereoSmoothed,
      trackBStereoSmoothed,
      trackASpectrogramSmoothed,
      trackBSpectrogramSmoothed
    };

    const shouldCapture = (
      (trackAFile || trackBFile) &&
      (!isTrackAPlaying || !isTrackBPlaying) &&
      hasSmoothedAnalysis(smoothed)
    );

    if (shouldCapture) {
      const snapshotId = `${Date.now()}-${trackAFile?.name || 'none'}-${trackBFile?.name || 'none'}`;
      const newSnapshot = buildAnalysisSnapshot(
        snapshotId,
        { trackAFile, trackBFile },
        { trackAStereoData, trackBStereoData, trackAFrequencyData, trackBFrequencyData },
        smoothed
      );

      setRecentAnalysis(prev => {
        const filtered = prev.filter(snap => snap.id !== snapshotId);
        return [newSnapshot, ...filtered].slice(0, 10);
      });
    }
  }, [isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile, trackASmoothed, trackBSmoothed, trackAFreqSmoothed, trackBFreqSmoothed, trackAStereoSmoothed, trackBStereoSmoothed, trackASpectrogramSmoothed, trackBSpectrogramSmoothed, trackAStereoData, trackBStereoData, trackAFrequencyData, trackBFrequencyData]);

  return recentAnalysis;
}
