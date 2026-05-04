import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// During local development, proxy /api to the production server. This lets
// `npm run dev` work end-to-end without running the Go backend locally.
// In production, nginx serves /api on the same origin, so this proxy never
// runs there.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://gracie-webdesign.me',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
