// Production bundle: dist/main.js (workspace packages @was/* inlined; npm deps stay external) + dist/migrations.
// Run with `node apps/server/dist/main.js` (doc 06: one process): API + SSR pages from apps/web/dist (doc 12).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8'));
const external = Object.keys(pkg.dependencies).filter((d) => !d.startsWith('@was/'));
const out = path.join(here, 'dist');

fs.rmSync(out, { recursive: true, force: true });
await build({
  entryPoints: [path.join(here, 'src/main.ts')],
  outfile: path.join(out, 'main.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  // vite is only imported in dev (WEB_DEV, src/web/vite-dev.ts), from apps/web: never bundled.
  external: [...external, ...external.map((d) => `${d}/*`), 'vite'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'info',
});
fs.cpSync(path.join(here, '../../packages/db/src/migrations'), path.join(out, 'migrations'), { recursive: true });
console.log('[build] dist/main.js + dist/migrations');
