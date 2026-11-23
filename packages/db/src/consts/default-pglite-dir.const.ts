import path from 'node:path';

import { findRepoRoot } from '../helpers/repo-root.helper';

export const DEFAULT_PGLITE_DIR = (): string => path.join(findRepoRoot(), '.data', 'pglite');
