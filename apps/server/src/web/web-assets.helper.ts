import fs from 'node:fs';
import path from 'node:path';

import type { DocumentAssets } from './document-assets.interface';
import type { ManifestChunk } from './manifest-chunk.interface';
import { CLIENT_ENTRY } from './web-assets.const';

/**
 * Production assets from the Vite client manifest (dist/client/.vite/manifest.json): the entry script, the single
 * stylesheet (cssCodeSplit off) and modulepreloads of the entry's static imports.
 */
export const readProdAssets = (clientDir: string): DocumentAssets => {
  const manifest = JSON.parse(fs.readFileSync(path.join(clientDir, '.vite/manifest.json'), 'utf8')) as Record<string, ManifestChunk>;
  const entry = manifest[CLIENT_ENTRY];
  if (!entry) throw new Error(`${CLIENT_ENTRY} missing from the web manifest`);
  /** A chunk and its static imports, as absolute URLs. */
  const closure = (keys: readonly string[], into = new Set<string>()) => {
    const visit = (key: string) => {
      const chunk = manifest[key];
      if (!chunk || into.has(`/${chunk.file}`)) return;
      into.add(`/${chunk.file}`);
      chunk.imports?.forEach(visit);
    };
    keys.forEach(visit);
    return into;
  };
  const preloads = closure(entry.imports ?? []);
  // Page chunks (lazy routes): preloaded only on the pages of their route, minus what the entry already loads.
  const routeChunks = Object.fromEntries(
    Object.entries(manifest)
      .filter(([key, c]) => c.isDynamicEntry && /^src\/modules\/.+\.page\.tsx$/.test(key))
      .map(([key]) => [key, [...closure([key])].filter((f) => !preloads.has(f) && f !== `/${entry.file}`)]),
  );
  const css = new Set([
    ...(entry.css ?? []),
    ...Object.values(manifest)
      .filter((c) => c.file.endsWith('.css'))
      .map((c) => c.file),
  ]);
  return {
    scripts: [{ attrs: { type: 'module', src: `/${entry.file}` } }],
    css: [...css].map((f) => `/${f}`),
    preloads: [...preloads],
    routeChunks,
  };
};
