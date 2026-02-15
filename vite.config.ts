import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Provides the API key to the client-side code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // Shim for libraries that expect process.env to exist
    'process.env': {}
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['komi2.onrender.com']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});