// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const { contextBridge, ipcRenderer } = require('electron');

// White-listed channels
const validChannels = [
  'app-version',
  'app-name',
  'app-path'
];

// Expose protected methods
contextBridge.exposeInMainWorld(
  'api', {
    // Renderer to main
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // Main to renderer
    receive: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Remove listener
    removeListener: (channel, listener) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);
      }
    }
  }
);
