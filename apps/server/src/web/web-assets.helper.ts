import fs from 'node:fs';
import path from 'node:path';

/** Same shape as `DocumentAssets` of apps/web/src/app/entry-server.tsx (root route of the router manifest). */
export interface DocumentAssets {
  scripts: { attrs?: Record<string, string | boolean>; children?: string }[];
  css: string[];
  preloads: string[];
}

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

interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
}

export const CLIENT_ENTRY = 'src/app/entry-client.tsx';

/**
 * Production assets from the Vite client manifest (dist/client/.vite/manifest.json): the entry script, the single
 * stylesheet (cssCodeSplit off) and modulepreloads of the entry's static imports.
 */
export const readProdAssets = (clientDir: string): DocumentAssets => {
  const manifest = JSON.parse(fs.readFileSync(path.join(clientDir, '.vite/manifest.json'), 'utf8')) as Record<string, ManifestChunk>;
  const entry = manifest[CLIENT_ENTRY];
  if (!entry) throw new Error(`${CLIENT_ENTRY} missing from the web manifest`);
  const preloads = new Set<string>();
  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || preloads.has(`/${chunk.file}`)) return;
    preloads.add(`/${chunk.file}`);
    chunk.imports?.forEach(visit);
  };
  entry.imports?.forEach(visit);
  const css = new Set([...(entry.css ?? []), ...Object.values(manifest).filter((c) => c.file.endsWith('.css')).map((c) => c.file)]);
  return {
    scripts: [{ attrs: { type: 'module', src: `/${entry.file}` } }],
    css: [...css].map((f) => `/${f}`),
    preloads: [...preloads],
  };
};
