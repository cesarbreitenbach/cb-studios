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
    },
  },
  test: { environment: 'jsdom' },
});
