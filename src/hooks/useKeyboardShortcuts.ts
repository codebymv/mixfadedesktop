import { useEffect } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // For simple keys (space, tab), just use the key directly
      const key = e.key.toLowerCase();

      // Handle simple keys first
      if (key === ' ') {
        if (handlers['space']) {
          e.preventDefault();
          handlers['space']();
          return;
        }
      }

      if (key === 'tab') {
        if (handlers['tab']) {
          e.preventDefault();
          handlers['tab']();
          return;
        }
      }

      // Build key combination string for complex shortcuts
      const parts: string[] = [];

      if (e.ctrlKey || e.metaKey) parts.push(navigator.platform.includes('Mac') ? 'cmd' : 'ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');

      // Add the actual key (skip modifier keys)
      if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta' && key !== ' ' && key !== 'tab') {
        parts.push(key);
      }

      const combination = parts.join('+');

      if (handlers[combination]) {
        e.preventDefault();
        handlers[combination]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// Common shortcuts for audio apps
export const commonShortcuts = {
  // File operations
  'ctrl+o': 'Open File',
  'ctrl+s': 'Save Project',
  'ctrl+shift+s': 'Save As',
  'ctrl+n': 'New Project',
  
  // Playback
  'space': 'Play/Pause',
  'ctrl+space': 'Stop',
  'ctrl+r': 'Record',
  
  // View
  'ctrl+b': 'Toggle Sidebar',
  'f11': 'Toggle Fullscreen',
  'ctrl+shift+p': 'Command Palette',
  'ctrl+p': 'Quick Open',
  
  // Audio
  'ctrl+m': 'Mute',
  'ctrl+shift+m': 'Solo',
  'ctrl+z': 'Undo',
  'ctrl+y': 'Redo',
};
