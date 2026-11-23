import fs from 'node:fs';
import path from 'node:path';

import { findRepoRoot } from '@was/db';

/** The prototype seed (plan/front-prototype/mock) is present: seeded tests can run. */
export const HAS_PROTOTYPE = fs.existsSync(path.join(findRepoRoot(), 'plan/front-prototype/mock'));
