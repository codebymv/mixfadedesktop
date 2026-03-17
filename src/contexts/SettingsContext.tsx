import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

const mergeSettings = (savedSettings?: Partial<AppSettings> | null): AppSettings => ({
  ...DEFAULT_SETTINGS,
  analysis: {
    ...DEFAULT_SETTINGS.analysis,
    ...(savedSettings?.analysis ?? {}),
  },
  ui: {
    ...DEFAULT_SETTINGS.ui,
    ...(savedSettings?.ui ?? {}),
  },
  audio: {
    ...DEFAULT_SETTINGS.audio,
    ...(savedSettings?.audio ?? {}),
  },
  files: {
    ...DEFAULT_SETTINGS.files,
    ...(savedSettings?.files ?? {}),
  },
  export: {
    ...DEFAULT_SETTINGS.export,
    ...(savedSettings?.export ?? {}),
  },
  shortcuts: {
    ...DEFAULT_SETTINGS.shortcuts,
    ...(savedSettings?.shortcuts ?? {}),
  },
});

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => void;
  resetToDefaults: () => void;
  getSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T]
  ) => AppSettings[T][keyof AppSettings[T]];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('mixfade-settings');
    if (saved) {
      try {
        return mergeSettings(JSON.parse(saved) as Partial<AppSettings>);
      } catch {
        return mergeSettings();
      }
    }
    return mergeSettings();
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('mixfade-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(<T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => {
    setSettings(prev => {
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const getSetting = useCallback(<T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T]
  ) => {
    return settings[category][key];
  }, [settings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetToDefaults,
      getSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}