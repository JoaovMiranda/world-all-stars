import { serve } from '@hono/node-server';
import { createDatabase } from '@was/db';

import { createApp } from './app';
import { loadConfig } from './config/env.config';

const config = loadConfig();
const handle = await createDatabase({
  databaseUrl: config.databaseUrl,
  pgliteDataDir: config.pgliteDataDir,
  ...(process.env.MIGRATIONS_DIR ? { migrationsFolder: process.env.MIGRATIONS_DIR } : {}),
});
if (config.migrateOnBoot) await handle.migrate();
const { app, deps } = createApp({ db: handle.db, config });

const server = serve({ fetch: app.fetch, port: config.port, hostname: config.host }, (info) => {
  console.log(`[server] World All Stars API on http://${info.address}:${info.port}/api (db: ${handle.driver} ${handle.location}, auth: ${deps.auth.name})`);
});

const shutdown = async () => {
  server.close();
  await handle.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
