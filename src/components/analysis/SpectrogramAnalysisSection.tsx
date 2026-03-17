import React from 'react';
import { Waves } from 'lucide-react';
import { SpectrogramAnalysis } from '../../utils/audioAnalysis';
import { AnalysisSectionHeader } from './AnalysisSectionHeader';
import { 
  formatBrightness, 
  formatActivity, 
  formatToneVsNoise, 
  getBrightnessColor, 
  getDynamicRangeColor, 
  getActivityColor, 
  getToneVsNoiseColor,
  getDelta,
  getSpectrogramDelta
} from '../../utils/analysisFormatters';

interface SpectrogramAnalysisSectionProps {
  trackASpectrogramAnalysis?: SpectrogramAnalysis;
  trackBSpectrogramAnalysis?: SpectrogramAnalysis;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
}

export function SpectrogramAnalysisSection({
  trackASpectrogramAnalysis,
  trackBSpectrogramAnalysis,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false
}: SpectrogramAnalysisSectionProps) {
  if (!trackASpectrogramAnalysis && !trackBSpectrogramAnalysis) {
    return (
      <div className="bg-slate-800 rounded-md overflow-hidden flex">
        <AnalysisSectionHeader
          icon={Waves}
          title="Spectrogram"
          isTransitioning={isTransitioning}
          isTrackAPlaying={isTrackAPlaying}
          isTrackBPlaying={isTrackBPlaying}
          gradientId="spectrogramGradient"
        />
        <div className="flex-1 px-3 py-2 text-xs text-white/70 flex items-center min-w-0">
          No spectrogram data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-md overflow-hidden flex">
      <AnalysisSectionHeader
        icon={Waves}
        title="Spectrogram"
        isTransitioning={isTransitioning}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        gradientId="spectrogramGradient"
      />

      <div className="flex-1 px-3 py-2 min-w-0">
        <div className="space-y-3">
        {/* Brightness Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Brightness (Hz)</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-[10px] font-mono ${trackASpectrogramAnalysis ? 
                getBrightnessColor(trackASpectrogramAnalysis.brightness) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatBrightness(trackASpectrogramAnalysis.brightness) : '--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono ${trackBSpectrogramAnalysis ? 
                getBrightnessColor(trackBSpectrogramAnalysis.brightness) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  formatBrightness(trackBSpectrogramAnalysis.brightness) : '--'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-[10px] font-mono ${getSpectrogramDelta(
                trackASpectrogramAnalysis.brightness,
                trackBSpectrogramAnalysis.brightness
              ).color}`}>
                Δ {getSpectrogramDelta(
                  trackASpectrogramAnalysis.brightness,
                  trackBSpectrogramAnalysis.brightness
                ).text}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Range Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Dynamic Range (dB)</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-[10px] font-mono ${trackASpectrogramAnalysis ? 
                getDynamicRangeColor(trackASpectrogramAnalysis.dynamicRange) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  `${trackASpectrogramAnalysis.dynamicRange.toFixed(1)}` : '--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono ${trackBSpectrogramAnalysis ? 
                getDynamicRangeColor(trackBSpectrogramAnalysis.dynamicRange) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  `${trackBSpectrogramAnalysis.dynamicRange.toFixed(1)}` : '--'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-[10px] font-mono ${getDelta(
                trackASpectrogramAnalysis.dynamicRange,
                trackBSpectrogramAnalysis.dynamicRange
              ).color}`}>
                Δ {getDelta(
                  trackASpectrogramAnalysis.dynamicRange,
                  trackBSpectrogramAnalysis.dynamicRange
                ).text}
              </span>
            </div>
          )}
        </div>

        {/* Activity Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Activity (%)</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-[10px] font-mono ${trackASpectrogramAnalysis ? 
                getActivityColor(trackASpectrogramAnalysis.activity) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatActivity(trackASpectrogramAnalysis.activity) : '--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono ${trackBSpectrogramAnalysis ? 
                getActivityColor(trackBSpectrogramAnalysis.activity) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  formatActivity(trackBSpectrogramAnalysis.activity) : '--'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-[10px] font-mono ${getDelta(
                trackASpectrogramAnalysis.activity * 100,
                trackBSpectrogramAnalysis.activity * 100
              ).color}`}>
                Δ {getDelta(
                  trackASpectrogramAnalysis.activity * 100,
                  trackBSpectrogramAnalysis.activity * 100
                ).text}
              </span>
            </div>
          )}
        </div>

        {/* Tone vs Noise Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Tone vs Noise</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-[10px] font-mono ${trackASpectrogramAnalysis ? 
                getToneVsNoiseColor(trackASpectrogramAnalysis.toneVsNoise) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatToneVsNoise(trackASpectrogramAnalysis.toneVsNoise) : '----'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono ${trackBSpectrogramAnalysis ? 
                getToneVsNoiseColor(trackBSpectrogramAnalysis.toneVsNoise) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  formatToneVsNoise(trackBSpectrogramAnalysis.toneVsNoise) : '----'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
        </div>

        {/* High Frequency Content Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">HF Content (Hz)</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                {trackASpectrogramAnalysis ? 
                  formatBrightness(trackASpectrogramAnalysis.highFreqContent).replace(' Hz', '') : '--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-slate-300">
                {trackBSpectrogramAnalysis ? 
                  formatBrightness(trackBSpectrogramAnalysis.highFreqContent).replace(' Hz', '') : '--'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}