import fs from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getRequestListener } from '@hono/node-server';
import { createDatabase, findRepoRoot, loadRootEnv } from '@was/db';

import { createApp } from './app';
import { promoteAdminEmails } from './auth/admin-bootstrap.helper';
import { loadConfig, type ServerConfig } from './config/env.config';
import { startCleanupScheduler } from './maintenance/cleanup.scheduler';
import { readProdAssets, type WebRenderModule } from './web/web-assets.helper';
import type { WebRuntime } from './web/web-handler';
import { createViteDev, type ViteDev } from './web/vite-dev';

// Root .env (Google + Better Auth secrets, ADMIN_EMAILS…), never overriding the shell. See .env.example.
const envLoaded = loadRootEnv();
const config = loadConfig();
const handle = await createDatabase({
  databaseUrl: config.databaseUrl,
  pgliteDataDir: config.pgliteDataDir,
  pool: config.dbPool,
  ...(process.env.MIGRATIONS_DIR ? { migrationsFolder: process.env.MIGRATIONS_DIR } : {}),
});
if (config.migrateOnBoot) await handle.migrate();

/** Production web build (vite build): dist/server/entry-server.js renders, dist/client is served. */
const prodWeb = async ({ webDistDir }: ServerConfig): Promise<WebRuntime | undefined> => {
  const entry = path.join(webDistDir, 'server/entry-server.js');
  const clientDir = path.join(webDistDir, 'client');
  if (!fs.existsSync(entry) || !fs.existsSync(path.join(clientDir, '.vite/manifest.json'))) {
    console.warn(`[server] no web build in ${webDistDir}: serving the API only (run \`pnpm build\`).`);
    return undefined;
  }
  const renderer = (await import(pathToFileURL(entry).href)) as WebRenderModule;
  const assets = readProdAssets(clientDir);
  return { dev: false, clientDir, loadRenderer: async () => renderer, assets: async () => assets };
};

// One HTTP server: in dev, Vite's middlewares (modules, HMR websocket) run first and hand everything else to Hono.
// The server is created first because Vite's HMR websocket attaches to it.
let vite: ViteDev | undefined;
let listener: ReturnType<typeof getRequestListener> | undefined;
const toHono = (req: IncomingMessage, res: ServerResponse) => void listener?.(req, res);
const httpServer = createServer((req, res) => {
  if (vite && !req.url?.startsWith('/api/')) vite.middlewares(req, res, () => toHono(req, res));
  else toHono(req, res);
});

// Slow or stalled clients cannot hold sockets forever: headers within 15 s, the whole request within 30 s. Keep-alive
// above the usual load-balancer idle timeout (60 s) so the proxy, not Node, closes idle connections.
httpServer.headersTimeout = 15_000;
httpServer.requestTimeout = 30_000;
httpServer.keepAliveTimeout = 65_000;

let web: WebRuntime | undefined;
if (config.webDev) {
  vite = await createViteDev({ webRoot: path.join(findRepoRoot(), 'apps/web'), httpServer });
  const dev = vite;
  web = { dev: true, loadRenderer: dev.loadRenderer, assets: dev.assets, fixStacktrace: dev.fixStacktrace };
} else {
  web = await prodWeb(config);
}
const { app, deps } = createApp({ db: handle.db, config, ...(web ? { web } : {}) });
listener = getRequestListener(app.fetch);

if (!config.google) console.warn('[auth] Google sign-in not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing in .env): the login dialog says so.');
if (config.authSimulated) console.warn('[auth] AUTH_SIMULATED on: the dev session switcher (demo reader/admin) is accepted. Never in production.');
const stopCleanup = startCleanupScheduler(handle.db, config.cleanupIntervalMinutes);
const promoted = await promoteAdminEmails(deps.repo, config.adminEmails);
if (promoted) console.log(`[auth] ADMIN_EMAILS: ${promoted} account(s) promoted to admin`);

httpServer.listen(config.port, config.host, () => {
  const mode = config.webDev ? 'pages: SSR + Vite HMR' : web ? 'pages: SSR (build)' : 'API only';
  console.log(`[server] World All Stars on http://${config.host === '127.0.0.1' ? 'localhost' : config.host}:${config.port} (${mode}; db: ${handle.driver} ${handle.location}, auth: ${deps.auth.name}, rate limit: ${config.rateLimitStore}${config.google ? ' (Google on)' : ''}${envLoaded ? ', .env loaded' : ''})`);
});

const shutdown = async () => {
  stopCleanup();
  httpServer.close();
  await vite?.close();
  await handle.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
