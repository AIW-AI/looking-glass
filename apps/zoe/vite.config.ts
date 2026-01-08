import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend (will be configured in Phase 5)
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  define: {
    // Make env vars available to client
    'import.meta.env.VITE_CONTEXT_MCP_URL': JSON.stringify(
      process.env.VITE_CONTEXT_MCP_URL || 'http://localhost:8080'
    ),
  },
});
