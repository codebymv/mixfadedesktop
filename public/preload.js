const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
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
  
  // Audio file operations (for MixFade specific functionality)
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
});

// Additional security: remove access to Node.js APIs
delete window.require;
delete window.exports;
delete window.module;

// Optional: Log when preload script is loaded (for debugging)
console.log('MixFade preload script loaded successfully');
