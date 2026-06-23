import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { localApiPlugin } from './vite-local-api';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Local API (subscription + takbull) uses .env.local keys. Other /api routes proxy to production.
        proxy: {
          '/api': {
            target: 'https://viraly.co.il',
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [react(), localApiPlugin(env)],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          output: {
            // Single vendor chunk – avoids React undefined from chunk load order
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            },
          },
        },
      },
    };
});
