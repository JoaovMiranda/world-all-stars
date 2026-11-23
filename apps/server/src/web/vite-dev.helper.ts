import fs from 'node:fs';
import type { Server } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { DocumentAssets } from './document-assets.interface';
import { ENTRY_SERVER, GLOBAL_CSS } from './vite-dev.const';
import type { ViteDev } from './vite-dev.interface';
import type { ViteModule } from './vite-module.interface';
import { CLIENT_ENTRY } from './web-assets.const';
import type { WebRenderModule } from './web-render-module.interface';

/** Script tags Vite injects in an HTML document (vite client + React Refresh preamble), as router manifest scripts. */
const scriptsOf = (html: string): DocumentAssets['scripts'] =>
  [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(([, rawAttrs = '', children = '']) => {
    const attrs: Record<string, string | boolean> = {};
    for (const [, name = '', value] of rawAttrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[name] = value ?? true;
    return children.trim() ? { attrs, children } : { attrs };
  });

/**
 * DEV ONLY: Vite in middleware mode inside the Hono process (one port for pages, /api and HMR). The SSR entry is
 * loaded through Vite on every request (edits apply without restart); CSS modules already seen by the SSR module
 * graph are linked in <head> so the first paint is styled.
 */
export const createViteDev = async ({ webRoot, httpServer }: { webRoot: string; httpServer: Server }): Promise<ViteDev> => {
  const vitePath = createRequire(path.join(webRoot, 'package.json')).resolve('vite');
  const { createServer } = (await import(pathToFileURL(vitePath).href)) as ViteModule;
  const vite = await createServer({
    root: webRoot,
    configFile: path.join(webRoot, 'vite.config.ts'),
    // Evaluate the config in Vite's module runner (no temp .mjs file next to it: tsx watch would restart on it).
    configLoader: 'runner',
    appType: 'custom',
    server: { middlewareMode: true, hmr: { server: httpServer } },
  });
  const load = () => vite.ssrLoadModule(ENTRY_SERVER) as unknown as Promise<WebRenderModule>;
  // Warm the SSR graph with every page (lazy chunks), so their CSS is linked from the very first request.
  const pages = fs
    .readdirSync(path.join(webRoot, 'src/modules'), { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.page.tsx'))
    .map((f) => `/src/modules/${f.split(path.sep).join('/')}`);
  // A page that fails to load here must not stop the server: the error shows up again on its request.
  await Promise.all([load(), ...pages.map((p) => vite.ssrLoadModule(p))]).catch((error: unknown) => {
    if (error instanceof Error) vite.ssrFixStacktrace(error);
    console.error('[web] SSR warm-up failed', error);
  });
  return {
    middlewares: vite.middlewares,
    loadRenderer: load,
    async assets(url) {
      const html = await vite.transformIndexHtml(url, '<!doctype html><html><head></head><body></body></html>');
      const css = [...vite.environments.ssr.moduleGraph.idToModuleMap.values()].filter((m) => m.id && /\.css$/.test(m.id)).map((m) => `${m.url}?direct`);
      css.unshift(`${GLOBAL_CSS}?direct`);
      return { scripts: [...scriptsOf(html), { attrs: { type: 'module', src: `/${CLIENT_ENTRY}` } }], css, preloads: [] };
    },
    fixStacktrace: (error) => {
      if (error instanceof Error) vite.ssrFixStacktrace(error);
    },
    close: () => vite.close(),
  };
};
