import { useEffect, useRef, useState } from 'react';
import {
  AudioLevels,
  FrequencyAnalysis,
  FrequencyAverager,
  RMSAverager,
  SpectrogramAnalysis,
  SpectrogramAverager,
  SpectrogramBuffer,
  StereoAnalysis,
  StereoAverager,
  calculateFrequencyMetrics,
  calculateSpectrogramMetrics
} from '../../../utils/audioAnalysis';
import {
  selectAnalysisSnapshot
} from './analysisSnapshots';
import { useRecentAnalysisSnapshots } from './useRecentAnalysisSnapshots';
import type { AnalysisPanelProps, AnalysisSnapshot } from './types';

export function useSmoothedAnalysis({
  trackAFile,
  trackBFile,
  trackADeckLevels,
  trackBDeckLevels,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0
}: AnalysisPanelProps): AnalysisSnapshot {
  const [trackASmoothed, setTrackASmoothed] = useState<AudioLevels | null>(null);
  const [trackBSmoothed, setTrackBSmoothed] = useState<AudioLevels | null>(null);

  const [trackAFreqSmoothed, setTrackAFreqSmoothed] = useState<FrequencyAnalysis | null>(null);
  const [trackBFreqSmoothed, setTrackBFreqSmoothed] = useState<FrequencyAnalysis | null>(null);

  const [trackAStereoSmoothed, setTrackAStereoSmoothed] = useState<StereoAnalysis | null>(null);
  const [trackBStereoSmoothed, setTrackBStereoSmoothed] = useState<StereoAnalysis | null>(null);

  const [trackASpectrogramSmoothed, setTrackASpectrogramSmoothed] = useState<SpectrogramAnalysis | null>(null);
  const [trackBSpectrogramSmoothed, setTrackBSpectrogramSmoothed] = useState<SpectrogramAnalysis | null>(null);

  const [preCrossfadeTrackA, setPreCrossfadeTrackA] = useState<AudioLevels | null>(null);
  const [preCrossfadeTrackB, setPreCrossfadeTrackB] = useState<AudioLevels | null>(null);
  const [preCrossfadeFreqA, setPreCrossfadeFreqA] = useState<FrequencyAnalysis | null>(null);
  const [preCrossfadeFreqB, setPreCrossfadeFreqB] = useState<FrequencyAnalysis | null>(null);
  const [preCrossfadeStereoA, setPreCrossfadeStereoA] = useState<StereoAnalysis | null>(null);
  const [preCrossfadeStereoB, setPreCrossfadeStereoB] = useState<StereoAnalysis | null>(null);
  const [preCrossfadeSpectrogramA, setPreCrossfadeSpectrogramA] = useState<SpectrogramAnalysis | null>(null);
  const [preCrossfadeSpectrogramB, setPreCrossfadeSpectrogramB] = useState<SpectrogramAnalysis | null>(null);

  const [prevIsTransitioning, setPrevIsTransitioning] = useState(false);

  const rmsAveragerA = useRef<RMSAverager | null>(null);
  const rmsAveragerB = useRef<RMSAverager | null>(null);
  const frequencyAveragerA = useRef<FrequencyAverager | null>(null);
  const frequencyAveragerB = useRef<FrequencyAverager | null>(null);
  const stereoAveragerA = useRef<StereoAverager | null>(null);
  const stereoAveragerB = useRef<StereoAverager | null>(null);
  const spectrogramAveragerA = useRef<SpectrogramAverager | null>(null);
  const spectrogramAveragerB = useRef<SpectrogramAverager | null>(null);
  const spectrogramBufferA = useRef<SpectrogramBuffer | null>(null);
  const spectrogramBufferB = useRef<SpectrogramBuffer | null>(null);

  useEffect(() => {
    if (!rmsAveragerA.current) {
      rmsAveragerA.current = new RMSAverager(300, 100);
    }
    if (!rmsAveragerB.current) {
      rmsAveragerB.current = new RMSAverager(300, 100);
    }
    if (!frequencyAveragerA.current) {
      frequencyAveragerA.current = new FrequencyAverager(300, 100);
    }
    if (!frequencyAveragerB.current) {
      frequencyAveragerB.current = new FrequencyAverager(300, 100);
    }
    if (!stereoAveragerA.current) {
      stereoAveragerA.current = new StereoAverager(300, 100);
    }
    if (!stereoAveragerB.current) {
      stereoAveragerB.current = new StereoAverager(300, 100);
    }
    if (!spectrogramAveragerA.current) {
      spectrogramAveragerA.current = new SpectrogramAverager(300, 100);
    }
    if (!spectrogramAveragerB.current) {
      spectrogramAveragerB.current = new SpectrogramAverager(300, 100);
    }
    if (!spectrogramBufferA.current) {
      spectrogramBufferA.current = new SpectrogramBuffer(5000, 100);
    }
    if (!spectrogramBufferB.current) {
      spectrogramBufferB.current = new SpectrogramBuffer(5000, 100);
    }
  }, []);

  useEffect(() => {
    if (!isTrackAPlaying && rmsAveragerA.current) {
      rmsAveragerA.current.reset();
    }
    if (!isTrackAPlaying && frequencyAveragerA.current) {
      frequencyAveragerA.current.reset();
    }
    if (!isTrackAPlaying && stereoAveragerA.current) {
      stereoAveragerA.current.reset();
    }
    if (!isTrackAPlaying && spectrogramAveragerA.current) {
      spectrogramAveragerA.current.reset();
    }
    if (!isTrackAPlaying && spectrogramBufferA.current) {
      spectrogramBufferA.current.reset();
    }
  }, [isTrackAPlaying]);

  useEffect(() => {
    if (!isTrackBPlaying && rmsAveragerB.current) {
      rmsAveragerB.current.reset();
    }
    if (!isTrackBPlaying && frequencyAveragerB.current) {
      frequencyAveragerB.current.reset();
    }
    if (!isTrackBPlaying && stereoAveragerB.current) {
      stereoAveragerB.current.reset();
    }
    if (!isTrackBPlaying && spectrogramAveragerB.current) {
      spectrogramAveragerB.current.reset();
    }
    if (!isTrackBPlaying && spectrogramBufferB.current) {
      spectrogramBufferB.current.reset();
    }
  }, [isTrackBPlaying]);

  useEffect(() => {
    if (trackADeckLevels && isTrackAPlaying && rmsAveragerA.current) {
      const shouldUpdate = rmsAveragerA.current.addSample(
        trackADeckLevels.leftRms,
        trackADeckLevels.rightRms,
        trackADeckLevels.rms,
        trackADeckLevels.lufs,
        trackADeckLevels.leftLufs,
        trackADeckLevels.rightLufs
      );

      if (shouldUpdate) {
        const smoothed = rmsAveragerA.current.getSmoothedValues();
        setTrackASmoothed({
          left: trackADeckLevels.left,
          right: trackADeckLevels.right,
          leftRms: smoothed.leftRmsSmoothed,
          rightRms: smoothed.rightRmsSmoothed,
          rms: smoothed.rmsSmoothed,
          lufs: smoothed.lufsSmoothed,
          leftLufs: smoothed.leftLufsSmoothed,
          rightLufs: smoothed.rightLufsSmoothed
        });
      }
    }
  }, [trackADeckLevels, isTrackAPlaying]);

  useEffect(() => {
    if (trackBDeckLevels && isTrackBPlaying && rmsAveragerB.current) {
      const shouldUpdate = rmsAveragerB.current.addSample(
        trackBDeckLevels.leftRms,
        trackBDeckLevels.rightRms,
        trackBDeckLevels.rms,
        trackBDeckLevels.lufs,
        trackBDeckLevels.leftLufs,
        trackBDeckLevels.rightLufs
      );

      if (shouldUpdate) {
        const smoothed = rmsAveragerB.current.getSmoothedValues();
        setTrackBSmoothed({
          left: trackBDeckLevels.left,
          right: trackBDeckLevels.right,
          leftRms: smoothed.leftRmsSmoothed,
          rightRms: smoothed.rightRmsSmoothed,
          rms: smoothed.rmsSmoothed,
          lufs: smoothed.lufsSmoothed,
          leftLufs: smoothed.leftLufsSmoothed,
          rightLufs: smoothed.rightLufsSmoothed
        });
      }
    }
  }, [trackBDeckLevels, isTrackBPlaying]);

  useEffect(() => {
    if (trackAFrequencyData && isTrackAPlaying && frequencyAveragerA.current) {
      const freqAnalysis = calculateFrequencyMetrics(trackAFrequencyData, true, isTrackAPlaying);
      const shouldUpdate = frequencyAveragerA.current.addSample(freqAnalysis);

      if (shouldUpdate) {
        setTrackAFreqSmoothed(frequencyAveragerA.current.getSmoothedValues());
      }
    }
  }, [trackAFrequencyData, isTrackAPlaying]);

  useEffect(() => {
    if (trackBFrequencyData && isTrackBPlaying && frequencyAveragerB.current) {
      const freqAnalysis = calculateFrequencyMetrics(trackBFrequencyData, true, isTrackBPlaying);
      const shouldUpdate = frequencyAveragerB.current.addSample(freqAnalysis);

      if (shouldUpdate) {
        setTrackBFreqSmoothed(frequencyAveragerB.current.getSmoothedValues());
      }
    }
  }, [trackBFrequencyData, isTrackBPlaying]);

  useEffect(() => {
    if (trackAStereoData && isTrackAPlaying && stereoAveragerA.current) {
      const shouldUpdate = stereoAveragerA.current.addSample(trackAStereoData);

      if (shouldUpdate) {
        setTrackAStereoSmoothed(stereoAveragerA.current.getSmoothedValues());
      }
    }
  }, [trackAStereoData, isTrackAPlaying]);

  useEffect(() => {
    if (trackBStereoData && isTrackBPlaying && stereoAveragerB.current) {
      const shouldUpdate = stereoAveragerB.current.addSample(trackBStereoData);

      if (shouldUpdate) {
        setTrackBStereoSmoothed(stereoAveragerB.current.getSmoothedValues());
      }
    }
  }, [trackBStereoData, isTrackBPlaying]);

  useEffect(() => {
    if (trackAFrequencyData && isTrackAPlaying && spectrogramAveragerA.current && spectrogramBufferA.current) {
      const spectrogramAnalysis = calculateSpectrogramMetrics(trackAFrequencyData, spectrogramBufferA.current, 48000, true, isTrackAPlaying);
      const shouldUpdate = spectrogramAveragerA.current.addSample(spectrogramAnalysis);

      if (shouldUpdate) {
        setTrackASpectrogramSmoothed(spectrogramAveragerA.current.getSmoothedValues());
      }
    }
  }, [trackAFrequencyData, isTrackAPlaying]);

  useEffect(() => {
    if (trackBFrequencyData && isTrackBPlaying && spectrogramAveragerB.current && spectrogramBufferB.current) {
      const spectrogramAnalysis = calculateSpectrogramMetrics(trackBFrequencyData, spectrogramBufferB.current, 48000, true, isTrackBPlaying);
      const shouldUpdate = spectrogramAveragerB.current.addSample(spectrogramAnalysis);

      if (shouldUpdate) {
        setTrackBSpectrogramSmoothed(spectrogramAveragerB.current.getSmoothedValues());
      }
    }
  }, [trackBFrequencyData, isTrackBPlaying]);

  useEffect(() => {
    if (isTransitioning && !prevIsTransitioning) {
      setPreCrossfadeTrackA(null);
      setPreCrossfadeTrackB(null);

      if (trackASmoothed) {
        setPreCrossfadeTrackA(trackASmoothed);
      }
      if (trackBSmoothed) {
        setPreCrossfadeTrackB(trackBSmoothed);
      }
      if (trackAFreqSmoothed) {
        setPreCrossfadeFreqA(trackAFreqSmoothed);
      }
      if (trackBFreqSmoothed) {
        setPreCrossfadeFreqB(trackBFreqSmoothed);
      }
      if (trackAStereoSmoothed) {
        setPreCrossfadeStereoA(trackAStereoSmoothed);
      }
      if (trackBStereoSmoothed) {
        setPreCrossfadeStereoB(trackBStereoSmoothed);
      }
      if (trackASpectrogramSmoothed) {
        setPreCrossfadeSpectrogramA(trackASpectrogramSmoothed);
      }
      if (trackBSpectrogramSmoothed) {
        setPreCrossfadeSpectrogramB(trackBSpectrogramSmoothed);
      }
    }

    setPrevIsTransitioning(isTransitioning);
  }, [isTransitioning, prevIsTransitioning, trackASmoothed, trackBSmoothed, trackAFreqSmoothed, trackBFreqSmoothed, trackAStereoSmoothed, trackBStereoSmoothed, trackASpectrogramSmoothed, trackBSpectrogramSmoothed]);

  useEffect(() => {
    setPreCrossfadeTrackA(null);
    setPreCrossfadeTrackB(null);
    setPreCrossfadeFreqA(null);
    setPreCrossfadeFreqB(null);
    setPreCrossfadeStereoA(null);
    setPreCrossfadeStereoB(null);
    setPreCrossfadeSpectrogramA(null);
    setPreCrossfadeSpectrogramB(null);
  }, [trackAFile, trackBFile]);

  const recentAnalysis = useRecentAnalysisSnapshots({
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
  });

  return selectAnalysisSnapshot({
    files: { trackAFile, trackBFile },
    raw: { trackAStereoData, trackBStereoData, trackAFrequencyData, trackBFrequencyData },
    smoothed: {
      trackASmoothed,
      trackBSmoothed,
      trackAFreqSmoothed,
      trackBFreqSmoothed,
      trackAStereoSmoothed,
      trackBStereoSmoothed,
      trackASpectrogramSmoothed,
      trackBSpectrogramSmoothed
    },
    crossfade: {
      preCrossfadeTrackA,
      preCrossfadeTrackB,
      preCrossfadeFreqA,
      preCrossfadeFreqB,
      preCrossfadeStereoA,
      preCrossfadeStereoB,
      preCrossfadeSpectrogramA,
      preCrossfadeSpectrogramB
    },
    recentAnalysis,
    isTrackAPlaying,
    isTrackBPlaying,
    isTransitioning,
    volumeA,
    volumeB
  });
}
