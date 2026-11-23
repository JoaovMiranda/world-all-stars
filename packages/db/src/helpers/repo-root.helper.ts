import fs from 'node:fs';
import path from 'node:path';

/** Repository root (folder with pnpm-workspace.yaml), so `.data/` lands in the same place whatever the cwd. */
export const findRepoRoot = (from: string = process.cwd()): string => {
  let dir = path.resolve(from);
  while (!fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
  return dir;
};

/**
 * Loads the root `.env` (secrets of dev: Google, Better Auth…) into process.env when it exists. Never overrides a
 * variable already set by the shell (process.loadEnvFile semantics). Returns whether a file was loaded.
 */
export const loadRootEnv = (root: string = findRepoRoot()): boolean => {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return false;
  process.loadEnvFile(file);
  return true;
};
