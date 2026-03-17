import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ExternalVisualizerWindow } from './components/ExternalVisualizerWindow.tsx';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext.tsx';

const isExternalVisualizer = new URLSearchParams(window.location.search).get('visualizer') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isExternalVisualizer ? (
      <ExternalVisualizerWindow />
    ) : (
      <SettingsProvider>
        <App />
      </SettingsProvider>
    )}
  </StrictMode>
);
