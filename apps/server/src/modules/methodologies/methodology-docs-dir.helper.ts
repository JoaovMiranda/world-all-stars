import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Folder holding `<key>/METHODOLOGY*.md` (T4.2). Production: the server is one esbuild bundle (`dist/main.js`) and
 * `build.mjs` copies the files to `dist/methodologies`, next to the bundle. Development and tests run the sources, so
 * the files are read straight from `packages/ranking/src/methodologies`. `METHODOLOGY_DOCS_DIR` overrides both.
 */
export const resolveMethodologyDocsDir = (env: NodeJS.ProcessEnv = process.env): string => {
  if (env.METHODOLOGY_DOCS_DIR) return env.METHODOLOGY_DOCS_DIR;
  const bundled = fileURLToPath(new URL('./methodologies', import.meta.url));
  if (fs.existsSync(bundled)) return bundled;
  return fileURLToPath(new URL('../../../../../packages/ranking/src/methodologies', import.meta.url));
};
