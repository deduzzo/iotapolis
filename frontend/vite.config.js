import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// ── Porte ────────────────────────────────────────────────────────
// Cambiare qui se si modificano le porte in config/custom.js
const BACKEND_PORT = 1337;   // Deve corrispondere a config/custom.js > port
const FRONTEND_PORT = 5173;  // Deve corrispondere a config/custom.js > frontendPort

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: FRONTEND_PORT,
    proxy: {
      '/api': { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
      '/socket.io': { target: `http://localhost:${BACKEND_PORT}`, ws: true },
    },
  },
  build: { outDir: '../.tmp/public', emptyOutDir: true },
});
