import React, { useState } from 'react';
import { LevelMeter } from './LevelMeter';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { StereoAnalyzer } from './StereoAnalyzer';
import { SpectrogramAnalyzer } from './SpectrogramAnalyzer';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';
import { TrendingUp, Waves, Radio, Activity } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('levels');

  return (
    <div className="glass-panel rounded-3xl border border-slate-600 h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex-none flex justify-center pt-3 pb-2">
        <div className="glass-panel rounded-xl p-1 border border-slate-700/50">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('levels')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'levels'
                  ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white neon-glow-fusion'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="inline mr-1.5 h-3.5 w-3.5" />
              Levels
            </button>
            <button
              onClick={() => setActiveTab('frequencies')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'frequencies'
                  ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white neon-glow-fusion'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="inline mr-1.5 h-3.5 w-3.5" />
              Frequencies
            </button>
            <button
              onClick={() => setActiveTab('stereo')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'stereo'
                  ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white neon-glow-fusion'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Radio className="inline mr-1.5 h-3.5 w-3.5" />
              Stereo
            </button>
            <button
              onClick={() => setActiveTab('spectrogram')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'spectrogram'
                  ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white neon-glow-fusion'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Waves className="inline mr-1.5 h-3.5 w-3.5" />
              Spectrogram
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-3 pb-2 flex flex-col">
        {activeTab === 'levels' && (
          <div className="flex-1">
            <LevelMeter
              label={label}
              color={color}
              isActive={true}
              isPlaying={isPlaying}
              audioLevels={audioLevels}
              crossfadeVolume={crossfadeVolume}
            />
          </div>
        )}

        {activeTab === 'frequencies' && (
          <div className="flex-1">
            <FrequencyVisualizer
              frequencyData={frequencyData}
              isActive={true}
              isPlaying={isPlaying}
              crossfadeVolume={crossfadeVolume}
            />
          </div>
        )}

        {activeTab === 'stereo' && (
          <div className="flex-1">
            <StereoAnalyzer
              stereoData={stereoData}
              leftSamples={leftSamples}
              rightSamples={rightSamples}
              isActive={true}
              isPlaying={isPlaying}
              crossfadeVolume={crossfadeVolume}
            />
          </div>
        )}

        {activeTab === 'spectrogram' && (
          <div className="flex-1">
            <SpectrogramAnalyzer
              frequencyData={frequencyData}
              isActive={true}
              isPlaying={isPlaying}
              crossfadeVolume={crossfadeVolume}
            />
          </div>
        )}
      </div>
    </div>
  );
}
