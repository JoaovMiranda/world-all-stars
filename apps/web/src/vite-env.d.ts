/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `http` = call the Hono API (`pnpm dev:api`); anything else = generated fixtures (`pnpm dev`). */
  readonly VITE_DATA_SOURCE?: 'fixtures' | 'http';
  /** Base URL of the API in the browser (default same origin: apps/server serves pages and /api). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
