import type { DocumentAssets } from './document-assets.interface';

/** What apps/web/src/app/entry-server.tsx exports (the server never compiles web code, so the contract is restated). */
export interface WebRenderModule {
  render(options: {
    request: Request;
    nonce: string;
    apiFetch: (request: Request) => Promise<Response>;
    timeZone: string;
    publicUrl: string;
    assets: DocumentAssets;
  }): Promise<Response>;
}
