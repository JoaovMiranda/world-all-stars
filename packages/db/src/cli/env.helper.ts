import { loadRootEnv } from '../client';

// Side effect on purpose: the legacy db CLIs import this module first so the root .env is loaded before they run.
// New CLIs extend BaseCli, which loads it explicitly.
loadRootEnv();

export { databaseOptionsFromEnv } from '../helpers/database-env.helper';
