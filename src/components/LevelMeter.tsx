import { useState, useEffect, useRef } from 'react';
import { AudioLevels, RMSAverager } from '../utils/audioAnalysis';
import { getLevelRiskLabel, getMixToneClass } from '../utils/analysisFormatters';
import { LevelChannelMeter } from './level-meter/LevelChannelMeter';
import { LevelChannelMetrics } from './level-meter/LevelChannelMetrics';
import { LevelMeterFooter } from './level-meter/LevelMeterFooter';
import { getRiskToneClass, linearToDbExtended } from './level-meter/levelMeterMath';

interface LevelMeterProps {
  label: string;
  color: 'green' | 'purple';
  isActive: boolean;
  isPlaying: boolean;
  audioLevels?: AudioLevels;
  crossfadeVolume?: number;
}

export function LevelMeter({
  isActive,
  isPlaying,
  audioLevels,
  crossfadeVolume = 1,
}: LevelMeterProps) {
  const [leftLevel, setLeftLevel] = useState(0);
  const [rightLevel, setRightLevel] = useState(0);
  const [leftPeak, setLeftPeak] = useState(0);
  const [rightPeak, setRightPeak] = useState(0);
  const [leftTruePeak, setLeftTruePeak] = useState(0);
  const [rightTruePeak, setRightTruePeak] = useState(0);
  const [leftRmsSmoothed, setLeftRmsSmoothed] = useState(0);
  const [rightRmsSmoothed, setRightRmsSmoothed] = useState(0);
  const [, setCombinedRmsSmoothed] = useState(0);
  const [, setLufsSmoothed] = useState(-70);
  const [leftLufsSmoothed, setLeftLufsSmoothed] = useState(-70);
  const [rightLufsSmoothed, setRightLufsSmoothed] = useState(-70);

  const rmsAverager = useRef<RMSAverager | null>(null);

  useEffect(() => {
    if (!rmsAverager.current) {
      rmsAverager.current = new RMSAverager(300, 50);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying && rmsAverager.current) {
      rmsAverager.current.reset();
    }
  }, [isPlaying]);

  useEffect(() => {
    const resetSmoothedLevels = () => {
      setLeftRmsSmoothed(0);
      setRightRmsSmoothed(0);
      setCombinedRmsSmoothed(0);
      setLufsSmoothed(-70);
      setLeftLufsSmoothed(-70);
      setRightLufsSmoothed(-70);
    };

    if (!isActive) {
      setLeftLevel(0);
      setRightLevel(0);
      setLeftPeak(0);
      setRightPeak(0);
      setLeftTruePeak(0);
      setRightTruePeak(0);
      resetSmoothedLevels();
      return;
    }

    if (audioLevels && isPlaying) {
      setLeftLevel(audioLevels.left);
      setRightLevel(audioLevels.right);

      if (rmsAverager.current) {
        const shouldUpdate = rmsAverager.current.addSample(
          audioLevels.leftRms,
          audioLevels.rightRms,
          audioLevels.rms,
          audioLevels.lufs,
          audioLevels.leftLufs,
          audioLevels.rightLufs
        );

        if (shouldUpdate) {
          const smoothed = rmsAverager.current.getSmoothedValues();
          setLeftRmsSmoothed(smoothed.leftRmsSmoothed);
          setRightRmsSmoothed(smoothed.rightRmsSmoothed);
          setCombinedRmsSmoothed(smoothed.rmsSmoothed);
          setLufsSmoothed(smoothed.lufsSmoothed);
          setLeftLufsSmoothed(smoothed.leftLufsSmoothed);
          setRightLufsSmoothed(smoothed.rightLufsSmoothed);
        }
      }

      const leftTP = Math.min(1.5, audioLevels.left * 1.08);
      const rightTP = Math.min(1.5, audioLevels.right * 1.08);

      if (audioLevels.left > leftPeak) {
        setLeftPeak(audioLevels.left);
      }
      if (audioLevels.right > rightPeak) {
        setRightPeak(audioLevels.right);
      }
      if (leftTP > leftTruePeak) {
        setLeftTruePeak(leftTP);
      }
      if (rightTP > rightTruePeak) {
        setRightTruePeak(rightTP);
      }
    } else {
      setLeftLevel(0);
      setRightLevel(0);
      resetSmoothedLevels();
    }
  }, [isActive, isPlaying, audioLevels, leftPeak, rightPeak, leftTruePeak, rightTruePeak]);

  useEffect(() => {
    if (!isPlaying) return;

    const peakDecay = setInterval(() => {
      setLeftPeak((prev) => Math.max(0, prev - 0.008));
      setRightPeak((prev) => Math.max(0, prev - 0.008));
      setLeftTruePeak((prev) => Math.max(0, prev - 0.008));
      setRightTruePeak((prev) => Math.max(0, prev - 0.008));
    }, 50);

    return () => clearInterval(peakDecay);
  }, [isPlaying]);

  const combinedTruePeakDb = Math.max(
    linearToDbExtended(leftTruePeak),
    linearToDbExtended(rightTruePeak)
  );
  const levelRisk = getLevelRiskLabel(combinedTruePeakDb);
  const mixToneClass = getMixToneClass(crossfadeVolume, isPlaying);
  const riskToneClass = getRiskToneClass(levelRisk);
  const transportLabel = crossfadeVolume === 0 ? 'MUTED' : isPlaying ? 'PLAYING' : 'PAUSED';

  return (
    <div className="h-full flex flex-col">
      <div className="h-1 shrink-0" />

      <div className="space-y-6 shrink-0 mt-2">
        <div>
          <LevelChannelMetrics
            channelLabel="L"
            lufsValue={leftLufsSmoothed}
            rmsValue={leftRmsSmoothed}
            peakValue={leftPeak}
            truePeakValue={leftTruePeak}
          />
          <LevelChannelMeter
            level={leftLevel}
            peak={leftPeak}
            truePeak={leftTruePeak}
          />
        </div>

        <div>
          <LevelChannelMetrics
            channelLabel="R"
            lufsValue={rightLufsSmoothed}
            rmsValue={rightRmsSmoothed}
            peakValue={rightPeak}
            truePeakValue={rightTruePeak}
          />
          <LevelChannelMeter
            level={rightLevel}
            peak={rightPeak}
            truePeak={rightTruePeak}
          />
        </div>
      </div>

      <div className="flex-1" />

      <LevelMeterFooter
        crossfadeVolume={crossfadeVolume}
        isPlaying={isPlaying}
        levelRisk={levelRisk}
        mixToneClass={mixToneClass}
        riskToneClass={riskToneClass}
        transportLabel={transportLabel}
      />
    </div>
  );
}
