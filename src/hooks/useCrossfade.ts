import { useCallback, useEffect, useRef, useState } from 'react';

type ActiveTrack = 'A' | 'B' | 'both';
type CrossfadeDirection = 'A->B' | 'B->A' | null;
type CrossfadeCurve = 'linear' | 'equal-power' | 'logarithmic';

interface UseCrossfadeOptions {
  hasTrackA: boolean;
  hasTrackB: boolean;
  crossfadeTime: number;
  crossfadeCurve: CrossfadeCurve;
  updateRate: number;
}

interface UseCrossfadeResult {
  activeTrack: ActiveTrack;
  volumeA: number;
  volumeB: number;
  isTransitioning: boolean;
  crossfadeDirection: CrossfadeDirection;
  handleTrackSwitch: (track: ActiveTrack) => void;
}

export function useCrossfade({
  hasTrackA,
  hasTrackB,
  crossfadeTime,
  crossfadeCurve,
  updateRate,
}: UseCrossfadeOptions): UseCrossfadeResult {
  const [activeTrack, setActiveTrack] = useState<ActiveTrack>('A');
  const [volumeA, setVolumeA] = useState(1);
  const [volumeB, setVolumeB] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [crossfadeDirection, setCrossfadeDirection] = useState<CrossfadeDirection>(null);
  const transitionRef = useRef<NodeJS.Timeout | null>(null);

  const clearTransition = useCallback(() => {
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    setIsTransitioning(false);
    setCrossfadeDirection(null);
  }, []);

  const performCrossfade = useCallback((fromTrack: 'A' | 'B', toTrack: 'A' | 'B') => {
    if (isTransitioning) {
      return;
    }

    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }

    setIsTransitioning(true);
    setCrossfadeDirection(fromTrack === 'A' ? 'A->B' : 'B->A');

    const transitionDuration = crossfadeTime * 1000;
    const steps = Math.max(30, Math.floor(updateRate));
    const stepDuration = transitionDuration / steps;
    let currentStep = 0;

    const transition = () => {
      currentStep++;
      const linearProgress = currentStep / steps;

      let fadeOut: number;
      let fadeIn: number;

      switch (crossfadeCurve) {
        case 'linear':
          fadeOut = 1 - linearProgress;
          fadeIn = linearProgress;
          break;
        case 'logarithmic': {
          const logProgress = Math.log(linearProgress * 9 + 1) / Math.log(10);
          fadeOut = 1 - logProgress;
          fadeIn = logProgress;
          break;
        }
        case 'equal-power':
        default: {
          const angle = linearProgress * (Math.PI / 2);
          fadeOut = Math.cos(angle);
          fadeIn = Math.sin(angle);
          break;
        }
      }

      if (fromTrack === 'A' && toTrack === 'B') {
        setVolumeA(fadeOut);
        setVolumeB(fadeIn);
      } else {
        setVolumeA(fadeIn);
        setVolumeB(fadeOut);
      }

      if (currentStep < steps) {
        transitionRef.current = setTimeout(transition, stepDuration);
        return;
      }

      transitionRef.current = null;
      setIsTransitioning(false);
      setCrossfadeDirection(null);

      if (toTrack === 'A') {
        setVolumeA(1);
        setVolumeB(0);
        setActiveTrack('A');
      } else {
        setVolumeA(0);
        setVolumeB(1);
        setActiveTrack('B');
      }
    };

    transitionRef.current = setTimeout(transition, stepDuration);
  }, [crossfadeCurve, crossfadeTime, isTransitioning, updateRate]);

  const handleTrackSwitch = useCallback((track: ActiveTrack) => {
    if (track === 'both') {
      if (activeTrack === 'A') {
        performCrossfade('A', 'B');
      } else if (activeTrack === 'B') {
        performCrossfade('B', 'A');
      } else {
        setVolumeA(1);
        setVolumeB(0);
        setActiveTrack('A');
      }
      return;
    }

    clearTransition();
    setActiveTrack(track);
    if (track === 'A') {
      setVolumeA(1);
      setVolumeB(0);
    } else {
      setVolumeA(0);
      setVolumeB(1);
    }
  }, [activeTrack, clearTransition, performCrossfade]);

  useEffect(() => {
    if (!hasTrackA && !hasTrackB) {
      clearTransition();
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
      return;
    }

    if (hasTrackA && !hasTrackB) {
      clearTransition();
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
      return;
    }

    if (!hasTrackA && hasTrackB) {
      clearTransition();
      setActiveTrack('B');
      setVolumeA(0);
      setVolumeB(1);
      return;
    }

    if (hasTrackA && hasTrackB && activeTrack === 'both') {
      clearTransition();
      setActiveTrack('A');
      setVolumeA(1);
      setVolumeB(0);
    }
  }, [activeTrack, clearTransition, hasTrackA, hasTrackB]);

  useEffect(() => clearTransition, [clearTransition]);

  return {
    activeTrack,
    volumeA,
    volumeB,
    isTransitioning,
    crossfadeDirection,
    handleTrackSwitch,
  };
}
