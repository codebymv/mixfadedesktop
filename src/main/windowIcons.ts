import { app, BrowserWindow, nativeImage } from 'electron';
import * as fs from 'fs';
import { getIcoIconPaths } from './mainPaths';

export const setWindowsAppUserModelId = () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.mixfade.app');
  }
};

export const setWindowIcon = (window: BrowserWindow | null) => {
  if (!window) return false;

  try {
    for (const iconPath of getIcoIconPaths()) {
      try {
        if (fs.existsSync(iconPath)) {
          const icon = nativeImage.createFromPath(iconPath);
          if (icon && typeof icon.getSize === 'function') {
            window.setIcon(icon);
            console.log('Successfully set window icon from:', iconPath);
            return true;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to load icon from ${iconPath}:`, errorMessage);
      }
    }

    console.warn('Could not find a valid icon file');
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error setting window icon:', errorMessage);
    return false;
  }
};

export const setReadyTaskbarIcon = (window: BrowserWindow | null, iconPath: string) => {
  if (process.platform !== 'win32' || !fs.existsSync(iconPath)) return;

  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty() && window) {
      window.setIcon(icon);
      console.log('Set taskbar icon from PNG file:', iconPath);
    }
  } catch (error) {
    console.warn('Failed to set taskbar icon:', error);
  }
};
