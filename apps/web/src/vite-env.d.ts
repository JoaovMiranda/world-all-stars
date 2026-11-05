/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `http` = call the Hono API; anything else = generated fixtures (default while apps/server does not exist). */
  readonly VITE_DATA_SOURCE?: 'fixtures' | 'http';
  /** Base URL of the API (default same origin, /api proxied by Vite in dev). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
