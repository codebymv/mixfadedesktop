import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export function SettingsDebugInfo() {
  const { settings } = useSettings();
  
  // Clean: removed noisy render log
  
  return (
    <div className="p-3 mt-4 bg-slate-800/50 border border-slate-700 rounded-md">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Active Settings</h4>
      <div className="space-y-1 text-xs text-slate-500">
        <div>Analysis Rate: <span className="text-emerald-400">{settings.analysis.updateRate} FPS</span></div>
        <div>Crossfade Time: <span className="text-purple-400">{settings.audio.crossfadeTime}s</span></div>
        <div>Crossfade Curve: <span className="text-blue-400">{settings.audio.crossfadeCurve}</span></div>
      </div>
      <div className="text-xs text-slate-600 mt-2">
        💡 Settings are live! Change them above to see immediate effects.
      </div>
    </div>
  );
} 