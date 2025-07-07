import { BarChart3, Volume2, Keyboard, Undo2, BookOpen } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export function SettingsPanel() {
  const { settings, updateSetting, resetToDefaults } = useSettings();

  return (
    <div className="p-4 space-y-6 max-h-full overflow-y-auto scrollbar-sidebar">
      {/* Audio Analysis Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Audio Analysis</h3>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Update Rate</label>
              <span className="text-xs text-slate-500">{settings.analysis.updateRate} FPS</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={settings.analysis.updateRate}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                console.log(`🎚️ SLIDER MOVED: ${newValue} FPS`);
                updateSetting('analysis', 'updateRate', newValue);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Audio Engine Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Audio Engine</h3>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Crossfade Time</label>
              <span className="text-xs text-slate-500">{settings.audio.crossfadeTime}s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={settings.audio.crossfadeTime}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                console.log(`🎚️ CROSSFADE TIME SLIDER: ${newValue}s`);
                updateSetting('audio', 'crossfadeTime', newValue);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Crossfade Curve</label>
            <select 
              value={settings.audio.crossfadeCurve}
              onChange={(e) => {
                const newCurve = e.target.value as 'linear' | 'equal-power' | 'logarithmic';
                console.log(`🎚️ CROSSFADE CURVE DROPDOWN: ${newCurve}`);
                updateSetting('audio', 'crossfadeCurve', newCurve);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="linear">Linear</option>
              <option value="equal-power">Equal Power (Recommended)</option>
              <option value="logarithmic">Logarithmic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Keyboard size={16} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Keyboard Shortcuts</h3>
        </div>
        
        <div className="space-y-2">
          {Object.entries(settings.shortcuts).map(([action, shortcut]) => (
            <div key={action} className="flex items-center justify-between text-sm">
              <span className="text-slate-300 capitalize">
                {action.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <span className="text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded text-xs">
                {shortcut}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      {/* <SettingsDebugInfo /> */}

      {/* Reset Button */}
      <div className="pt-4 border-t border-slate-700 space-y-3">
        <button
          onClick={resetToDefaults}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion"
        >
          <Undo2 size={16} />
          <span>Reset to Defaults</span>
        </button>
        
        {/* Help Button */}
        <button
          onClick={() => window.open('https://mixfade.com/help', '_blank')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion"
        >
          <BookOpen size={16} />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
}
