import { BrowserWindow } from 'electron';
import {
  getPngIconPath,
  getPreloadPath,
  getVisualizerUrl,
  isDev,
} from './mainPaths';

export const createVisualizerWindow = (onClosed: () => void) => {
  const visualizerWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    icon: getPngIconPath(),
    title: 'MixFade Visualizer',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: true,
      webSecurity: true,
      devTools: isDev,
    },
    show: false,
    autoHideMenuBar: true,
  });

  visualizerWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  visualizerWindow.loadURL(getVisualizerUrl()).catch((err: unknown) => {
    console.error('Failed to load visualizer window URL:', err);
  });

  visualizerWindow.once('ready-to-show', () => {
    visualizerWindow.show();
  });

  visualizerWindow.on('closed', onClosed);

  return visualizerWindow;
};
