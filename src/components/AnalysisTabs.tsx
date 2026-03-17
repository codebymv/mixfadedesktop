import { useState } from 'react';
import { LevelMeter } from './LevelMeter';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { StereoAnalyzer } from './StereoAnalyzer';
import { SpectrogramAnalyzer } from './SpectrogramAnalyzer';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';
import { TrendingUp, Waves, Radio, Activity } from 'lucide-react';

type AnalysisTabId = 'levels' | 'frequencies' | 'stereo' | 'spectrogram';

interface AnalysisTabsProps {
  label: string;
  color: 'green' | 'purple';
  audioLevels: AudioLevels;
  frequencyData: Float32Array;
  stereoData: StereoAnalysis;
  leftSamples?: Float32Array;
  rightSamples?: Float32Array;
  isPlaying: boolean;
  crossfadeVolume: number;
}

export function AnalysisTabs({
  label,
  color,
  audioLevels,
  frequencyData,
  stereoData,
  leftSamples,
  rightSamples,
  isPlaying,
  crossfadeVolume,
}: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabId>('levels');

  const tabs: Array<{ id: AnalysisTabId; label: string; icon: typeof TrendingUp }> = [
    { id: 'levels', label: 'Levels', icon: TrendingUp },
    { id: 'frequencies', label: 'Frequencies', icon: Activity },
    { id: 'stereo', label: 'Stereo', icon: Radio },
    { id: 'spectrogram', label: 'Spectrogram', icon: Waves },
  ];

  return (
    <div className="glass-panel rounded-3xl border border-slate-600 h-full overflow-hidden flex flex-col">
      <div className="border-b border-slate-700/50 bg-slate-950/35 px-3 py-2">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={`${label} ${tab.label}`}
                aria-label={`${label} ${tab.label}`}
                className={`w-full min-w-0 rounded-xl border transition-all flex items-center justify-center gap-2 px-3 py-2 ${
                  activeTab === tab.id
                    ? 'border-slate-500/60 bg-theme-fusion text-white neon-glow-fusion'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold leading-none select-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 px-3 py-2 flex flex-col overflow-hidden">
        {activeTab === 'levels' && (
          <LevelMeter
            label={label}
            color={color}
            isActive={true}
            isPlaying={isPlaying}
            audioLevels={audioLevels}
            crossfadeVolume={crossfadeVolume}
          />
        )}

        {activeTab === 'frequencies' && (
          <FrequencyVisualizer
            frequencyData={frequencyData}
            isActive={true}
            isPlaying={isPlaying}
            crossfadeVolume={crossfadeVolume}
          />
        )}

        {activeTab === 'stereo' && (
          <StereoAnalyzer
            stereoData={stereoData}
            leftSamples={leftSamples}
            rightSamples={rightSamples}
            isActive={true}
            isPlaying={isPlaying}
            crossfadeVolume={crossfadeVolume}
          />
        )}

        {activeTab === 'spectrogram' && (
          <SpectrogramAnalyzer
            frequencyData={frequencyData}
            isActive={true}
            isPlaying={isPlaying}
            crossfadeVolume={crossfadeVolume}
          />
        )}
      </div>
    </div>
  );
}
