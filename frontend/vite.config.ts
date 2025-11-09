import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/generate_graphs': 'http://localhost:8080',
      '/static': 'http://localhost:8080',
      '/analysis': 'http://localhost:8080',
      '/chat': 'http://localhost:8080'
    }
  },
  optimizeDeps: {
    exclude: ['chunk-YGLZ2JQH']
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
});
