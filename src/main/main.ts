import { app, BrowserWindow, session } from 'electron';
import { createApplicationMenu } from './applicationMenu';
import { createMainLogger } from './mainLogger';
import { getStartupIconLogPath, isDev } from './mainPaths';
import { createMainWindow } from './mainWindow';
import { buildContentSecurityPolicy } from './security';
import { setupWindowIpc } from './windowIpc';
import { setWindowsAppUserModelId } from './windowIcons';

let mainWindow: BrowserWindow | null = null;
let visualizerWindow: BrowserWindow | null = null;

const { close: closeLogStream, log } = createMainLogger(isDev);

const openMainWindow = () => {
  mainWindow = createMainWindow();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

setWindowsAppUserModelId();

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = buildContentSecurityPolicy(isDev);

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  console.log('MixFade app starting with icon from:', getStartupIconLogPath());

  openMainWindow();
  createApplicationMenu(() => mainWindow);
  setupWindowIpc({
    getMainWindow: () => mainWindow,
    getVisualizerWindow: () => visualizerWindow,
    setVisualizerWindow: (window) => {
      visualizerWindow = window;
    },
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  log('Application quitting...');
  closeLogStream();
});
