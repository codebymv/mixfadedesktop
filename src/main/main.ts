import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain, nativeImage, shell, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let visualizerWindow: BrowserWindow | null = null;

const isDev = process.argv.includes('--dev');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window
  
  // Set app user model ID for Windows taskbar
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.mixfade.app');
  }
  
  // Function to set window icon
  const setWindowIcon = (window: BrowserWindow | null) => {
    if (!window) return false;
    
    try {
      // Try multiple possible icon locations and formats
      const iconPaths = [
        path.join(__dirname, '..', '..', 'public', 'mixfade_icon-icoext.ico'),
        path.join(process.resourcesPath, 'mixfade_icon-icoext.ico'),
      ];
      
      for (const iconPath of iconPaths) {
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
  
  // Remove duplicate mainWindow declaration - using global one
  
  // Use PNG for both window and taskbar icon
  const iconPath = isDev
    ? path.join(__dirname, '..', '..', 'public', 'mixfade_icon.png')
    : path.join(process.resourcesPath, 'mixfade_icon.png');

  // Create window with default settings
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 1065,
    minWidth: 1440,
    minHeight: 1065,
    useContentSize: true,
    icon: iconPath, // Use PNG for both window and taskbar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev
        ? path.join(__dirname, '..', '..', 'public', 'preload.js')
        : path.join(__dirname, 'preload.js'),
      sandbox: true,
      webSecurity: true,
      devTools: isDev // Enable DevTools only in development mode
    },
    show: false,
    titleBarStyle: 'default' as const,
    backgroundColor: '#ffffff',
    frame: true,
    autoHideMenuBar: true,
    title: 'MixFade'
  });
  
  // Set window icon after creation
  setWindowIcon(mainWindow);

  // Load the app
  const indexPath = isDev 
    ? 'http://localhost:5173/' 
    : `file://${path.join(__dirname, '..', '..', 'dist-renderer', 'index.html')}`;
  
  mainWindow?.loadURL(indexPath).catch((err: unknown) => {
    console.error('Failed to load URL:', err);
  });

  // Show window when ready
  mainWindow?.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Only force close DevTools in production mode
    if (!isDev && mainWindow && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    
    // Open DevTools automatically in development mode
    if (isDev && mainWindow) {
      mainWindow.webContents.openDevTools();
    }
    
    // Try to force set the taskbar icon after window is ready
    if (process.platform === 'win32' && fs.existsSync(iconPath)) {
      try {
        const icon = nativeImage.createFromPath(iconPath);
        if (!icon.isEmpty() && mainWindow) {
          mainWindow.setIcon(icon);
          console.log('Set taskbar icon from PNG file:', iconPath);
        }
      } catch (error) {
        console.warn('Failed to set taskbar icon:', error);
      }
    }
  });

  // Only prevent DevTools in production mode
  if (!isDev) {
    mainWindow?.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });

    // Disable context menu to prevent "Inspect Element" option in production
    mainWindow?.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  // Handle window closed
  mainWindow?.on('closed', () => {
    mainWindow = null;
  });
}

// Set app properties before app is ready
if (process.platform === 'win32') {
  app.setAppUserModelId('com.mixfade.app');
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set up Content Security Policy (CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Basic CSP that allows standard React/Vite functionality but restricts external execution
    const csp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws://localhost:* http://localhost:*;"
      : "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  console.log('MixFade app starting with icon from:', path.join(__dirname, '..', '..', 'public', 'mixfade_icon.png'));

  createWindow();

  // Create application menu
  createMenu();

  // Set up IPC handlers
  setupIPC();

  

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Set up IPC handlers for window controls
function setupIPC() {
  // Window control handlers
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // External visualizer window
  ipcMain.handle('open-visualizer-window', () => {
    if (visualizerWindow && !visualizerWindow.isDestroyed()) {
      visualizerWindow.focus();
      return;
    }

    const iconPath = isDev
      ? path.join(__dirname, '..', '..', 'public', 'mixfade_icon.png')
      : path.join(process.resourcesPath, 'mixfade_icon.png');

    visualizerWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      minWidth: 640,
      minHeight: 360,
      icon: iconPath,
      title: 'MixFade Visualizer',
      backgroundColor: '#000000',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: isDev
          ? path.join(__dirname, '..', '..', 'public', 'preload.js')
          : path.join(__dirname, 'preload.js'),
        sandbox: true,
        webSecurity: true,
        devTools: isDev,
      },
      show: false,
      autoHideMenuBar: true,
    });

    const baseUrl = isDev
      ? 'http://localhost:5173/'
      : `file://${path.join(__dirname, '..', '..', 'dist-renderer', 'index.html')}`;

    visualizerWindow.loadURL(`${baseUrl}?visualizer=1`).catch((err: unknown) => {
      console.error('Failed to load visualizer window URL:', err);
    });

    visualizerWindow.once('ready-to-show', () => {
      visualizerWindow?.show();
    });

    visualizerWindow.on('closed', () => {
      visualizerWindow = null;
    });
  });
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Create application menu
function createMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Set up logging
const logFile = path.join(app.getPath('userData'), 'main.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[Main] ${message}`, ...args);
  
  // Log to file in production
  if (!isDev) {
    const logPath = path.join(app.getPath('logs'), 'mixfade-main.log');
    const logMessage = `[${timestamp}] ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
    fs.appendFileSync(logPath, logMessage, 'utf8');
  }
}

// Clean up on exit
app.on('will-quit', () => {
  log('Application quitting...');
  logStream.end();
});
