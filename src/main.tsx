import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext.tsx';

const isExternalVisualizer = new URLSearchParams(window.location.search).get('visualizer') === '1';
const ExternalVisualizerWindow = lazy(() =>
  import('./components/ExternalVisualizerWindow.tsx').then(module => ({
    default: module.ExternalVisualizerWindow,
  }))
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isExternalVisualizer ? (
      <Suspense fallback={null}>
        <ExternalVisualizerWindow />
      </Suspense>
    ) : (
      <SettingsProvider>
        <App />
      </SettingsProvider>
    )}
  </StrictMode>
);
