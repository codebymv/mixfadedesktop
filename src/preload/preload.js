// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const { contextBridge, ipcRenderer } = require('electron');

// White-listed channels
const validChannels = [
  'menu-open-files',
  'dialog:openFile',
  'dialog:openDirectory'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Send messages to main process
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive messages from main process
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
});
