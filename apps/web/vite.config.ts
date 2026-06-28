import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'entry-client': resolve(__dirname, 'src/entry-client.tsx'),
        'entry-admin': resolve(__dirname, 'src/admin/entry-admin.tsx'),
      },
      // Stable, unhashed names so server.ts can reference /assets/entry-*.js
      // directly. (No cache-busting hash — acceptable for MVP; revisit with a
      // manifest if long-cache headers are added.)
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: { environment: 'jsdom' },
});
