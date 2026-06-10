import * as path from 'path';

export const isDev = process.argv.includes('--dev');

export const getPngIconPath = () => {
  return isDev
    ? path.join(__dirname, '..', '..', 'public', 'mixfade_icon.png')
    : path.join(process.resourcesPath, 'mixfade_icon.png');
};

export const getIcoIconPaths = () => [
  path.join(__dirname, '..', '..', 'public', 'mixfade_icon-icoext.ico'),
  path.join(process.resourcesPath, 'mixfade_icon-icoext.ico'),
];

export const getPreloadPath = () => {
  return isDev
    ? path.join(__dirname, '..', '..', 'public', 'preload.js')
    : path.join(__dirname, 'preload.js');
};

export const getRendererUrl = () => {
  return isDev
    ? 'http://localhost:5173/'
    : `file://${path.join(__dirname, '..', '..', 'dist-renderer', 'index.html')}`;
};

export const getVisualizerUrl = () => `${getRendererUrl()}?visualizer=1`;

export const getStartupIconLogPath = () => {
  return path.join(__dirname, '..', '..', 'public', 'mixfade_icon.png');
};
