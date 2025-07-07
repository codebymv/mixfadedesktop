# Electron Architecture Overview

## Process Architecture

MixFade uses Electron's multi-process architecture to ensure security, stability, and performance for audio processing applications.

### **Main Process** (`src/main/`)
The main process is the entry point of the Electron application and manages the lifecycle of renderer processes.

#### **Responsibilities:**
- **Window Management**: Creating and managing browser windows
- **Application Lifecycle**: Handling app events (ready, window-all-closed, etc.)
- **Native APIs**: File system access, menu management, system notifications
- **Security**: Enforcing security policies and sandboxing
- **Audio Device Management**: Managing system audio devices and permissions

#### **Key Files:**
```
src/main/
├── main.ts           # Main process entry point
├── preload.js        # Preload script for secure IPC
└── window-manager.ts # Window creation and management
```

### **Renderer Process** (`src/components/`, `src/hooks/`, etc.)
The renderer process runs the React application and handles the user interface.

#### **Responsibilities:**
- **UI Rendering**: React components and DOM manipulation
- **Audio Processing**: Web Audio API integration
- **User Interactions**: Event handling and state management
- **Waveform Visualization**: Canvas-based audio rendering
- **Real-time Analysis**: Audio analysis and visualization

#### **Process Isolation:**
- Sandboxed environment for security
- Limited access to Node.js APIs
- Communication via IPC (Inter-Process Communication)

## Inter-Process Communication (IPC)

### **Preload Script Pattern**
MixFade uses the secure preload script pattern for IPC communication:

```typescript
// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Audio device management
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  setAudioDevice: (deviceId) => ipcRenderer.invoke('set-audio-device', deviceId),
  
  // Application events
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback),
  onWindowFocus: (callback) => ipcRenderer.on('window-focus', callback)
});
```

### **Secure Communication Channels**

#### **File Operations**
```typescript
// Main Process
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a'] }
    ]
  });
  return result;
});

// Renderer Process
const handleFileOpen = async () => {
  const files = await window.electronAPI.openFileDialog();
  if (files && files.length > 0) {
    loadAudioFile(files[0]);
  }
};
```

#### **Audio Device Management**
```typescript
// Main Process - Audio device enumeration
ipcMain.handle('get-audio-devices', async () => {
  // Use native audio APIs to enumerate devices
  return await getSystemAudioDevices();
});

// Renderer Process - Device selection
const audioDevices = await window.electronAPI.getAudioDevices();
```

## Security Model

### **Sandbox Configuration**
```typescript
// Main process window creation
new BrowserWindow({
  webPreferences: {
    sandbox: true,                    // Enable sandbox
    contextIsolation: true,           // Isolate context
    enableRemoteModule: false,        // Disable remote module
    nodeIntegration: false,           // Disable Node.js in renderer
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### **Content Security Policy (CSP)**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  media-src 'self' data: blob:;
  connect-src 'self' file:;
">
```

### **Audio File Security**
- **Local Processing**: All audio files are processed locally
- **No Network Access**: Audio data never leaves the device
- **File Validation**: Validate audio file types and sizes
- **Memory Management**: Proper cleanup of audio buffers

## Audio Architecture Integration

### **Web Audio API in Electron**
```typescript
// Audio context management
class AudioManager {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer;
  
  async loadAudioFile(filePath: string) {
    // Read file via Electron's file system
    const arrayBuffer = await window.electronAPI.readAudioFile(filePath);
    
    // Decode audio data
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Initialize analysis nodes
    this.setupAnalysisNodes();
  }
}
```

### **Performance Considerations**

#### **Memory Management**
- **Audio Buffer Cleanup**: Properly dispose of AudioBuffer objects
- **Canvas Optimization**: Use RequestAnimationFrame for smooth rendering
- **Worker Threads**: Offload heavy audio processing to workers

#### **Cross-Platform Audio**
```typescript
// Platform-specific audio handling
const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  return new AudioContextClass({
    sampleRate: 44100,
    latencyHint: 'interactive'
  });
};
```

## Build and Packaging

### **Electron Builder Configuration**
```json
{
  "build": {
    "appId": "com.mixfade.app",
    "productName": "MixFade",
    "directories": {
      "buildResources": "assets"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/mixfade_icon-icoext.ico"
    },
    "mac": {
      "target": "dmg", 
      "icon": "public/mixfade_icon.png",
      "category": "public.app-category.music"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "public/mixfade_icon.png",
      "category": "AudioVideo"
    }
  }
}
```

### **Code Signing and Distribution**
- **Windows**: Code signing with Windows certificates
- **macOS**: App Store or Developer ID signing
- **Linux**: GPG signing for repositories

## Development Workflow

### **Hot Reload Setup**
```typescript
// Development mode configuration
if (isDevelopment) {
  // Enable hot reload for renderer
  mainWindow.loadURL('http://localhost:5173');
  
  // Open DevTools
  mainWindow.webContents.openDevTools();
  
  // Auto-reload on main process changes
  require('electron-reload')(__dirname);
}
```

### **Debugging**
- **Main Process**: Node.js debugging with `--inspect`
- **Renderer Process**: Chrome DevTools
- **IPC Communication**: Event logging and message tracing

## Error Handling

### **Crash Reporting**
```typescript
// Main process crash handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Send crash report
  // Graceful shutdown
});

// Renderer process error boundary
class AudioErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error to main process
    window.electronAPI.logError({ error, errorInfo });
  }
}
```

### **Audio Error Recovery**
```typescript
// Audio context error handling
audioContext.addEventListener('statechange', () => {
  if (audioContext.state === 'suspended') {
    // Attempt to resume audio context
    audioContext.resume();
  }
});
```

## Performance Monitoring

### **Resource Usage**
```typescript
// Monitor memory usage
setInterval(() => {
  const memInfo = process.getProcessMemoryInfo();
  console.log('Memory usage:', memInfo);
}, 30000);

// Monitor audio performance
const analyzePerformance = () => {
  const start = performance.now();
  // Audio processing...
  const end = performance.now();
  console.log('Audio processing time:', end - start);
};
```

### **Optimization Strategies**
- **Lazy Loading**: Load audio components on demand
- **Memory Pooling**: Reuse audio buffer objects
- **Efficient Rendering**: Optimize canvas operations
- **Background Processing**: Use Web Workers for heavy computations

---

This architecture ensures MixFade delivers professional-grade audio analysis while maintaining security, performance, and cross-platform compatibility. 