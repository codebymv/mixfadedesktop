const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),

  // App operations
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  quit: () => ipcRenderer.invoke('app:quit'),

  // Menu events
  onMenuOpenFiles: (callback) => ipcRenderer.on('menu-open-files', callback),
  removeMenuOpenFilesListener: (callback) => ipcRenderer.removeListener('menu-open-files', callback),

  // Audio file operations
  loadAudioFile: (filePath) => ipcRenderer.invoke('audio:loadFile', filePath),
  getAudioMetadata: (filePath) => ipcRenderer.invoke('audio:getMetadata', filePath),

  // System operations
  showItemInFolder: (fullPath) => ipcRenderer.invoke('shell:showItemInFolder', fullPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Window operations
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  openVisualizerWindow: () => ipcRenderer.invoke('open-visualizer-window'),

  // Settings/preferences
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),

  // Development/debug
  openDevTools: () => ipcRenderer.invoke('debug:openDevTools'),

  // Utility functions
  platform: process.platform,

  // Event listeners for cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
};

// Primary renderer bridge used by the app
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Backwards-compatible alias so any older code still using window.api does not break
contextBridge.exposeInMainWorld('api', electronAPI);

delete window.require;
delete window.exports;
delete window.module;

console.log('MixFade preload script loaded successfully');
