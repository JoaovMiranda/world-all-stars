import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // apps/server (Hono). Used when VITE_DATA_SOURCE=http (fixtures never call /api).
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8787' },
  },
});
