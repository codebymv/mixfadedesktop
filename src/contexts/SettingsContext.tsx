import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

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
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
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
    console.log(`🔧 UPDATE SETTING: ${String(category)}.${String(key)} = ${value}`);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
      console.log(`🔧 NEW SETTINGS STATE:`, newSettings);
      return newSettings;
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