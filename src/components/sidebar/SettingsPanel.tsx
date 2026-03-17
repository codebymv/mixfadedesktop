import { useEffect, useRef, useState } from 'react';
import { BarChart3, ChevronDown, Volume2, Keyboard, Undo2, BookOpen, Palette, Tag } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { AppSettings } from '../../types/settings';
import { COLOR_THEME_OPTIONS, withAlpha } from '../../theme/colorThemes';

type CrossfadeCurve = AppSettings['audio']['crossfadeCurve'];

const CROSSFADE_CURVE_OPTIONS: Array<{ id: CrossfadeCurve; label: string }> = [
  { id: 'linear', label: 'Linear' },
  { id: 'equal-power', label: 'Equal Power' },
  { id: 'logarithmic', label: 'Logarithmic' },
];

// Single fade-in envelope curves — each must look visually distinct at small sizes:
// linear: straight diagonal
// equal-power: bows up fast then levels (concave-down / fast-start)
// logarithmic: stays flat then rises steeply (concave-up / slow-start)
const CROSSFADE_CURVE_PATH: Record<CrossfadeCurve, string> = {
  linear: 'M2 15 L16 3',
  'equal-power': 'M2 15 C2 4 10 3 16 3',
  logarithmic: 'M2 15 C9 15 16 12 16 3',
};

function CrossfadeCurveIcon({ curve, className = 'text-slate-400' }: { curve: CrossfadeCurve; className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={CROSSFADE_CURVE_PATH[curve]} />
    </svg>
  );
}

export function SettingsPanel() {
  const { settings, updateSetting, resetToDefaults } = useSettings();
  const [isCrossfadeCurveMenuOpen, setIsCrossfadeCurveMenuOpen] = useState(false);
  const crossfadeCurveMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedCrossfadeCurve =
    CROSSFADE_CURVE_OPTIONS.find((option) => option.id === settings.audio.crossfadeCurve) ?? CROSSFADE_CURVE_OPTIONS[1];

  useEffect(() => {
    if (!isCrossfadeCurveMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (crossfadeCurveMenuRef.current && !crossfadeCurveMenuRef.current.contains(event.target as Node)) {
        setIsCrossfadeCurveMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCrossfadeCurveMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCrossfadeCurveMenuOpen]);

  return (
    <div className="p-4 space-y-6 max-h-full overflow-y-auto scrollbar-sidebar">
      {/* Version */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Version</h3>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">MixFade</span>
          <span className="text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded text-xs">v{__APP_VERSION__}</span>
        </div>
      </div>

      {/* Deck Color Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Theme</h3>
        </div>

        <div className="space-y-2">
          {COLOR_THEME_OPTIONS.map((themeOption) => {
            const isActive = themeOption.id === settings.ui.colorThemeId;

            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => updateSetting('ui', 'colorThemeId', themeOption.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left ${
                  isActive
                    ? 'theme-selected-card neon-glow-fusion'
                    : 'sidebar-theme-button'
                }`}
                style={isActive ? { borderColor: withAlpha(themeOption.deckA.base, 0.55) } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: themeOption.deckA.base }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: themeOption.deckB.base }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-200">{themeOption.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
              onChange={(e) => updateSetting('analysis', 'updateRate', parseInt(e.target.value, 10))}
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
              onChange={(e) => updateSetting('audio', 'crossfadeTime', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Crossfade Curve</label>
            <div className="relative" ref={crossfadeCurveMenuRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCrossfadeCurveMenuOpen}
                onClick={() => setIsCrossfadeCurveMenuOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-800/90 focus:outline-none theme-focus-input active:scale-[0.97]"
              >
                <span className="flex items-center gap-2.5">
                  <CrossfadeCurveIcon curve={selectedCrossfadeCurve.id} />
                  <span>{selectedCrossfadeCurve.label}</span>
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCrossfadeCurveMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCrossfadeCurveMenuOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-sm"
                >
                  {CROSSFADE_CURVE_OPTIONS.map((option) => {
                    const isSelected = option.id === settings.audio.crossfadeCurve;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          updateSetting('audio', 'crossfadeCurve', option.id);
                          setIsCrossfadeCurveMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <CrossfadeCurveIcon curve={option.id} className={isSelected ? 'text-white' : 'text-slate-400'} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 theme-fusion-button text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion"
        >
          <Undo2 size={16} />
          <span>Reset to Defaults</span>
        </button>
        
        {/* Help Button */}
        <button
          onClick={() => window.open('https://mixfade.com/help', '_blank')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 theme-fusion-button text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion"
        >
          <BookOpen size={16} />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
}
