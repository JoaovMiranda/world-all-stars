// pnpm db:seed — migrations + configuration + the prototype mock DB (plan/front-prototype). Idempotent.
// PGlite is single-process: stop the server (pnpm dev) before seeding the same .data/pglite.
import { SeedCli } from './seed.command';

await new SeedCli().start();
