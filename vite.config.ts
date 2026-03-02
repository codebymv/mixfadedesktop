import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './', // Important for Electron to load assets correctly
  build: {
    outDir: 'dist-renderer',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Keep logs in dev; strip them from production bundles.
  esbuild: mode === 'production'
    ? {
        drop: ['console', 'debugger']
      }
    : undefined,
  server: {
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
