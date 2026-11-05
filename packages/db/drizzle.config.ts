import { defineConfig } from 'drizzle-kit';

// `pnpm db:generate` → SQL migrations in src/migrations (applied by `pnpm db:migrate` and on server boot).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './src/migrations',
  casing: 'snake_case',
});
