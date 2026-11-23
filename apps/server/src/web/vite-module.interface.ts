import type { ViteDevServer } from './vite-dev-server.interface';

/** The part of the `vite` module used here. */
export interface ViteModule {
  createServer(config: Record<string, unknown>): Promise<ViteDevServer>;
}
