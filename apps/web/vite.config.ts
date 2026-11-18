import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// apps/web has no dev server of its own: apps/server (Hono) serves pages (SSR) and /api on one port.
// Dev: Vite runs in middleware mode inside the Hono process (apps/server/src/web/vite-dev.ts).
// Build: `vite build` → dist/client (browser assets + .vite/manifest.json) and
//        `vite build --ssr` → dist/server/entry-server.js (imported by the server in production).
export default defineConfig(({ command, isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Build only: its Node entry require()s every locale JSON dynamically (breaks the bundled SSR build); the browser
      // entry is the same API without locales, which is all the app uses (numeric → alpha-2). Dev keeps it external.
      ...(command === 'build' ? [{ find: /^i18n-iso-countries$/, replacement: 'i18n-iso-countries/index.js' }] : []),
    ],
  },
  // Production SSR bundle is self-contained (no node_modules needed next to it); dev keeps deps external (fast).
  ...(command === 'build' ? { ssr: { noExternal: true } } : {}),
  build: isSsrBuild
    ? { outDir: 'dist/server', emptyOutDir: true, copyPublicDir: false, rollupOptions: { input: 'src/app/entry-server.tsx' } }
    : {
        outDir: 'dist/client',
        emptyOutDir: true,
        manifest: true,
        // One stylesheet for the whole app, linked in the server-rendered <head>: page CSS is there before the
        // lazy page chunk loads (no flash of unstyled content after SSR).
        cssCodeSplit: false,
        // Fonts always as files: the CSP allows `font-src 'self'` only (a small subset inlined as data: is blocked).
        assetsInlineLimit: (file: string) => (file.endsWith('.woff2') || file.endsWith('.woff') ? false : undefined),
        rollupOptions: { input: 'src/app/entry-client.tsx' },
      },
}));
