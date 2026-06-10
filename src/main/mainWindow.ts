import { BrowserWindow } from 'electron';
import {
  getPngIconPath,
  getPreloadPath,
  getRendererUrl,
  isDev,
} from './mainPaths';
import {
  setReadyTaskbarIcon,
  setWindowIcon,
  setWindowsAppUserModelId,
} from './windowIcons';

export const createMainWindow = () => {
  setWindowsAppUserModelId();

  const iconPath = getPngIconPath();
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 1065,
    minWidth: 1440,
    minHeight: 1065,
    useContentSize: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: true,
      webSecurity: true,
      devTools: isDev,
    },
    show: false,
    titleBarStyle: 'default' as const,
    backgroundColor: '#ffffff',
    frame: true,
    autoHideMenuBar: true,
    title: 'MixFade',
  });

  setWindowIcon(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.loadURL(getRendererUrl()).catch((err: unknown) => {
    console.error('Failed to load URL:', err);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (!isDev && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    setReadyTaskbarIcon(mainWindow, iconPath);
  });

  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });

    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  return mainWindow;
};
