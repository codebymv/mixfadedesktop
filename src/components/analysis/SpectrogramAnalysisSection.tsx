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
      <div className="px-3 py-2 bg-slate-800 rounded-md">
        <AnalysisSectionHeader
          icon={Waves}
          title="Spectrogram"
          isTransitioning={isTransitioning}
          isTrackAPlaying={isTrackAPlaying}
          isTrackBPlaying={isTrackBPlaying}
          gradientId="spectrogramGradient"
        />
        <div className="text-xs text-white/70">
          No spectrogram data available
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 bg-slate-800 rounded-md">
      <AnalysisSectionHeader
        icon={Waves}
        title="Spectrogram"
        isTransitioning={isTransitioning}
        isTrackAPlaying={isTrackAPlaying}
        isTrackBPlaying={isTrackBPlaying}
        gradientId="spectrogramGradient"
      />

      <div className="space-y-3">
        {/* Brightness Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Brightness</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-xs font-mono ${trackASpectrogramAnalysis ? 
                getBrightnessColor(trackASpectrogramAnalysis.brightness) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatBrightness(trackASpectrogramAnalysis.brightness) : '-- Hz'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono ${trackBSpectrogramAnalysis ? 
                getBrightnessColor(trackBSpectrogramAnalysis.brightness) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  formatBrightness(trackBSpectrogramAnalysis.brightness) : '-- Hz'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-xs font-mono ${getSpectrogramDelta(
                trackASpectrogramAnalysis.brightness,
                trackBSpectrogramAnalysis.brightness
              ).color}`}>
                Δ {getSpectrogramDelta(
                  trackASpectrogramAnalysis.brightness,
                  trackBSpectrogramAnalysis.brightness
                ).text} Hz
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Range Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Dynamic Range</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-xs font-mono ${trackASpectrogramAnalysis ? 
                getDynamicRangeColor(trackASpectrogramAnalysis.dynamicRange) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  `${trackASpectrogramAnalysis.dynamicRange.toFixed(1)} dB` : '-- dB'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono ${trackBSpectrogramAnalysis ? 
                getDynamicRangeColor(trackBSpectrogramAnalysis.dynamicRange) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  `${trackBSpectrogramAnalysis.dynamicRange.toFixed(1)} dB` : '-- dB'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-xs font-mono ${getDelta(
                trackASpectrogramAnalysis.dynamicRange,
                trackBSpectrogramAnalysis.dynamicRange
              ).color}`}>
                Δ {getDelta(
                  trackASpectrogramAnalysis.dynamicRange,
                  trackBSpectrogramAnalysis.dynamicRange
                ).text} dB
              </span>
            </div>
          )}
        </div>

        {/* Activity Comparison */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Activity</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className={`text-xs font-mono ${trackASpectrogramAnalysis ? 
                getActivityColor(trackASpectrogramAnalysis.activity) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatActivity(trackASpectrogramAnalysis.activity) : '--%'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono ${trackBSpectrogramAnalysis ? 
                getActivityColor(trackBSpectrogramAnalysis.activity) : 'text-slate-300'}`}>
                {trackBSpectrogramAnalysis ? 
                  formatActivity(trackBSpectrogramAnalysis.activity) : '--%'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                B
              </span>
            </div>
          </div>
          {trackASpectrogramAnalysis && trackBSpectrogramAnalysis && (
            <div className="text-center mt-1">
              <span className={`text-xs font-mono ${getDelta(
                trackASpectrogramAnalysis.activity * 100,
                trackBSpectrogramAnalysis.activity * 100
              ).color}`}>
                Δ {getDelta(
                  trackASpectrogramAnalysis.activity * 100,
                  trackBSpectrogramAnalysis.activity * 100
                ).text}%
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
              <span className={`text-xs font-mono ${trackASpectrogramAnalysis ? 
                getToneVsNoiseColor(trackASpectrogramAnalysis.toneVsNoise) : 'text-slate-300'}`}>
                {trackASpectrogramAnalysis ? 
                  formatToneVsNoise(trackASpectrogramAnalysis.toneVsNoise) : '----'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono ${trackBSpectrogramAnalysis ? 
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
          <div className="text-xs text-slate-400 mb-1">HF Content</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                A
              </span>
              <span className="text-xs font-mono text-slate-300">
                {trackASpectrogramAnalysis ? 
                  formatBrightness(trackASpectrogramAnalysis.highFreqContent).replace(' Hz', '') : '--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-300">
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
  );
}