import type { DocumentAssets } from './document-assets.interface';
import type { ViteDevServer } from './vite-dev-server.interface';
import type { WebRenderModule } from './web-render-module.interface';

export interface ViteDev {
  /** Connect middlewares: /@vite/client, /src/*, /@fs, public files, HMR. Calls `next` for everything else. */
  middlewares: ViteDevServer['middlewares'];
  loadRenderer(): Promise<WebRenderModule>;
  assets(url: string): Promise<DocumentAssets>;
  fixStacktrace(error: unknown): void;
  close(): Promise<void>;
}
