import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Shims the specific environment variable the app expects
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // Provides a fallback for 'process' to prevent runtime errors in the browser
    'process.env': {}
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});