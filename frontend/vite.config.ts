import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 15173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
