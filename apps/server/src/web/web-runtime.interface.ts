import type { DocumentAssets } from './document-assets.interface';
import type { WebRenderModule } from './web-render-module.interface';

/** How pages are produced: Vite dev (middleware mode) or the production build (dist/client + dist/server). */
export interface WebRuntime {
  dev: boolean;
  loadRenderer(): Promise<WebRenderModule>;
  assets(url: string): Promise<DocumentAssets>;
  /** Production: dist/client (hashed /assets/* and public files). Dev: Vite serves them before Hono. */
  clientDir?: string;
  /** Dev: maps SSR stack traces back to the sources. */
  fixStacktrace?(error: unknown): void;
}
