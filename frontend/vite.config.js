import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { createRequire } from 'module';

// ── Porte — lette da config/private_iota_conf.js ────────────────
let BACKEND_PORT = 1337;
let FRONTEND_PORT = 5173;
try {
  const require_ = createRequire(import.meta.url);
  const conf = require_('../config/private_iota_conf');
  BACKEND_PORT = conf.PORT || 1337;
  FRONTEND_PORT = conf.FRONTEND_PORT || 5173;
} catch (e) { /* file non ancora creato — usa default */ }

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
