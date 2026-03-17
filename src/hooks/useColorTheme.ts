import { useEffect, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { createThemeCssVariables, getColorTheme } from '../theme/colorThemes';

export const useColorTheme = () => {
  const { settings } = useSettings();

  return useMemo(() => getColorTheme(settings.ui.colorThemeId), [settings.ui.colorThemeId]);
};

export const useApplyColorTheme = () => {
  const theme = useColorTheme();

  useEffect(() => {
    const root = document.documentElement;
    const cssVariables = createThemeCssVariables(theme);

    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  return theme;
};