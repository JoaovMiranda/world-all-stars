import { createDatabase, type Database, type DatabaseHandle, type DatabaseOptions, loadRootEnv } from '../client';
import { databaseOptionsFromEnv } from '../helpers/database-env.helper';
import type { CliOptions } from '../interfaces/cli-options.interface';

/**
 * Base of every command-line entry point (`pnpm db:*`, `pnpm ingest`, `pnpm rankings:calculate`): loads the root
 * `.env` (unless an explicit `env` is given), opens the database from the environment (Postgres or PGlite), applies migrations, runs `run()` and always
 * closes the handle. `run()` returns the exit code (default 0); an uncaught error is logged and exits with 1.
 * Entry file: `await new MyCli().start();`.
 */
export abstract class BaseCli {
  protected readonly args: readonly string[];
  protected readonly env: NodeJS.ProcessEnv;
  protected readonly log: (message: string) => void;
  private readonly applyMigrations: boolean;
  private readonly loadEnvFile: boolean;
  private handle: DatabaseHandle | null = null;

  constructor(options: CliOptions = {}) {
    this.args = options.argv ?? process.argv.slice(2);
    this.env = options.env ?? process.env;
    this.loadEnvFile = options.env === undefined;
    this.log = options.log ?? ((message) => console.log(message));
    this.applyMigrations = options.migrate ?? true;
  }

  /** The command's work. Runs with the database open; returns the exit code. */
  // biome-ignore lint/suspicious/noConfusingVoidType: subclasses may simply return nothing (exit code 0).
  protected abstract run(): Promise<number | void>;

  /** Where the database lives. Default: `DATABASE_URL` → Postgres, else `PGLITE_DATA_DIR` or `.data/pglite`. */
  protected databaseOptions(): DatabaseOptions {
    return databaseOptionsFromEnv(this.env);
  }

  protected get db(): Database {
    if (!this.handle) throw new Error('The database is only available inside run()');
    return this.handle.db;
  }

  protected get database(): DatabaseHandle {
    if (!this.handle) throw new Error('The database is only available inside run()');
    return this.handle;
  }

  /** First positional argument (the sub-command), if any. */
  protected get command(): string | undefined {
    const first = this.args[0];
    return first && !first.startsWith('--') ? first : undefined;
  }

  /** `--name value` → "value"; a bare `--name` → "true"; absent → undefined. */
  protected flag(name: string): string | undefined {
    const i = this.args.indexOf(`--${name}`);
    if (i < 0) return undefined;
    const next = this.args[i + 1];
    return next && !next.startsWith('--') ? next : 'true';
  }

  /** Comma-separated flag value as a list (`--only a,b` → ["a", "b"]); absent → undefined. */
  protected list(name: string): string[] | undefined {
    return this.flag(name)
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  /** Runs the command and returns its exit code (never throws). */
  async main(): Promise<number> {
    let code = 0;
    try {
      if (this.loadEnvFile) loadRootEnv();
      this.handle = await createDatabase(this.databaseOptions());
      if (this.applyMigrations) await this.handle.migrate();
      code = (await this.run()) ?? 0;
    } catch (error) {
      console.error(error);
      code = 1;
    } finally {
      await this.handle?.close();
      this.handle = null;
    }
    return code;
  }

  /** `main()` + `process.exitCode`, for entry files. */
  async start(): Promise<void> {
    process.exitCode = await this.main();
  }
}
