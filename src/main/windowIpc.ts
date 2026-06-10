import { BrowserWindow, ipcMain } from 'electron';
import { createVisualizerWindow } from './visualizerWindow';

interface WindowIpcOptions {
  getMainWindow: () => BrowserWindow | null;
  getVisualizerWindow: () => BrowserWindow | null;
  setVisualizerWindow: (window: BrowserWindow | null) => void;
}

const toggleWindowMaximize = (window: BrowserWindow | null) => {
  if (!window) return;

  if (window.isMaximized()) {
    window.unmaximize();
    return;
  }

  window.maximize();
};

export const setupWindowIpc = ({
  getMainWindow,
  getVisualizerWindow,
  setVisualizerWindow,
}: WindowIpcOptions) => {
  const minimizeMainWindow = () => {
    getMainWindow()?.minimize();
  };

  const toggleMainWindowMaximize = () => {
    toggleWindowMaximize(getMainWindow());
  };

  const closeMainWindow = () => {
    getMainWindow()?.close();
  };

  const openVisualizerWindow = () => {
    const visualizerWindow = getVisualizerWindow();

    if (visualizerWindow && !visualizerWindow.isDestroyed()) {
      visualizerWindow.focus();
      return;
    }

    setVisualizerWindow(createVisualizerWindow(() => {
      setVisualizerWindow(null);
    }));
  };

  ipcMain.handle('window:minimize', minimizeMainWindow);
  ipcMain.on('window-minimize', minimizeMainWindow);

  ipcMain.handle('window:maximize', toggleMainWindowMaximize);
  ipcMain.on('window-maximize', toggleMainWindowMaximize);

  ipcMain.handle('window:close', closeMainWindow);
  ipcMain.on('window-close', closeMainWindow);

  ipcMain.handle('open-visualizer-window', openVisualizerWindow);
};
