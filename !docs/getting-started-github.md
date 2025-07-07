# Github Getting Started Guide

## Prerequisites

Before you begin developing MixFade, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - We recommend [VS Code](https://code.visualstudio.com/)

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mixfade.git
cd MixFade/Prototype4
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Scripts

#### **Development Mode**
```bash
# Start development server with hot reload
npm run dev

# Start Electron in development mode
npm run electron:dev

# Start Electron with custom icon patching
npm run electron:dev-with-icon
```

#### **Building**
```bash
# Build renderer (React frontend)
npm run build:renderer

# Build main process (Electron)
npm run build:main

# Build complete application
npm run build

# Build application icon
npm run build:icon
```

#### **Testing**
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### **Linting**
```bash
# Check code quality
npm run lint
```

#### **Production Distribution**
```bash
# Create distributable packages
npm run dist
```

## Project Architecture

### **Electron Structure**
```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts for IPC
├── components/     # React components
├── hooks/          # Custom React hooks
├── contexts/       # React contexts
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

### **Key Technologies**
- **Electron**: Desktop application framework
- **React**: UI library with TypeScript
- **Vite**: Build tool and development server
- **WaveSurfer.js**: Audio waveform visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Jest**: Testing framework
- **ESLint**: Code linting

## Development Workflow

### **1. Feature Development**
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Develop your feature with tests
3. Run tests: `npm run test`
4. Check linting: `npm run lint`
5. Test in Electron: `npm run electron:dev`

### **2. Audio Component Development**
- Audio components are in `src/components/`
- Use the existing audio context patterns
- Test with various audio file formats
- Ensure proper cleanup of audio resources

### **3. Electron-Specific Features**
- Main process code goes in `src/main/`
- Use preload scripts for secure IPC communication
- Test cross-platform compatibility

## Testing Strategy

### **Component Testing**
```bash
# Test specific component
npm run test -- WaveformPlayer.test.tsx

# Test with coverage
npm run test:coverage
```

### **Electron Testing**
- Use the built-in Electron test suite
- Test main process and renderer process separately
- Verify IPC communication

### **Audio Testing**
- Test with various audio formats
- Verify waveform accuracy
- Test performance with large files

## Build Configuration

### **Electron Builder Settings**
The `package.json` contains build configurations for:
- **Windows**: NSIS installer (`.exe`)
- **macOS**: DMG package
- **Linux**: AppImage and DEB packages

### **Icon Management**
```bash
# Convert icon to ICO format
npm run build:icon

# Patch Electron icon during development
npm run patch-electron-icon

# Restore original Electron icon
npm run restore-electron-icon
```

## Common Development Tasks

### **Adding New Audio Analysis Features**
1. Create component in `src/components/analysis/`
2. Add to the analysis tabs system
3. Implement audio processing logic
4. Add tests and documentation

### **Working with WaveSurfer.js**
- Initialize in React useEffect hooks
- Manage cleanup properly
- Use refs for direct WaveSurfer access
- Handle audio loading states

### **Cross-Platform Considerations**
- Test on multiple operating systems
- Handle file path differences
- Consider native audio API differences
- Test packaging on each platform

## Debugging

### **Development Tools**
```bash
# Open Chrome DevTools in Electron
npm run electron:dev
# Then press Ctrl+Shift+I (Windows/Linux) or Cmd+Opt+I (Mac)
```

### **Main Process Debugging**
```bash
# Start with Node.js debugging
npm run electron:dev -- --inspect=5858
```

### **Audio Debugging**
- Use console logs for audio events
- Monitor Web Audio API performance
- Check browser audio context state

## Contributing

### **Code Style**
- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Write tests for new features

### **Commit Guidelines**
- Use conventional commit messages
- Include tests with feature commits
- Update documentation as needed

### **Pull Request Process**
1. Ensure tests pass: `npm run test`
2. Check linting: `npm run lint`
3. Test Electron build: `npm run electron:dev`
4. Update documentation if needed
5. Submit PR with clear description

## Performance Optimization

### **Audio Performance**
- Use Web Audio API efficiently
- Implement proper audio buffer management
- Consider worker threads for heavy processing

### **Electron Performance**
- Minimize main process workload
- Use renderer process for UI-heavy tasks
- Implement proper memory management

## Troubleshooting

### **Common Issues**
- **Node modules conflicts**: Delete `node_modules` and `package-lock.json`, then `npm install`
- **Electron build issues**: Check Node.js version compatibility
- **Audio playback problems**: Verify browser audio permissions
- **TypeScript errors**: Check `tsconfig.json` configurations

### **Platform-Specific Issues**
- **Windows**: Ensure Visual Studio Build Tools are installed
- **macOS**: Check Xcode Command Line Tools
- **Linux**: Verify audio system dependencies

## Resources

- **Electron Documentation**: https://electronjs.org/docs
- **React Documentation**: https://reactjs.org/docs
- **WaveSurfer.js**: https://wavesurfer-js.org/
- **Vite Documentation**: https://vitejs.dev/
- **Testing Library**: https://testing-library.com/

---

*Happy coding! Build amazing audio tools with MixFade! 🎵* 