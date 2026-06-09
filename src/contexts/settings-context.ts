import { createContext, useContext } from 'react';
import type { AppSettings } from '../types/settings';

export interface SettingsContextType {
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

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
