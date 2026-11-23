import { sql } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { selectRows } from '../helpers/select-rows.helper';
import { BaseCli } from './base.cli';

const MEMORY_ENV = { PGLITE_DATA_DIR: 'memory://' };

class ProbeCli extends BaseCli {
  seen: Record<string, unknown> = {};
  constructor(
    argv: string[],
    private readonly behaviour: 'ok' | 'code' | 'throw' = 'ok',
    migrate = false,
  ) {
    super({ argv, env: MEMORY_ENV, migrate, log: () => undefined });
  }
  protected async run(): Promise<number | undefined> {
    this.seen = { command: this.command, limit: this.flag('limit'), offline: this.flag('offline'), only: this.list('only'), missing: this.flag('missing') };
    this.seen.one = (await selectRows<{ n: number }>(this.db, sql`select 1 as n`))[0]?.n;
    if (this.behaviour === 'throw') throw new Error('boom');
    return this.behaviour === 'code' ? 3 : undefined;
  }
}

class MigratingCli extends BaseCli {
  tables = 0;
  protected async run() {
    this.tables =
      (await selectRows<{ n: number }>(this.db, sql`select count(*)::int as n from information_schema.tables where table_name = 'audit_logs'`))[0]?.n ?? 0;
  }
}

describe('BaseCli', () => {
  it('parses flags and lists and opens the database for run()', async () => {
    const cli = new ProbeCli(['write', '--limit', '20', '--offline', '--only', 'a, b,,c']);
    expect(await cli.main()).toBe(0);
    expect(cli.seen).toEqual({ command: 'write', limit: '20', offline: 'true', only: ['a', 'b', 'c'], missing: undefined, one: 1 });
  });

  it('returns the exit code given by run()', async () => {
    expect(await new ProbeCli([], 'code').main()).toBe(3);
  });

  it('logs an uncaught error and exits with 1', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await new ProbeCli(['--offline'], 'throw').main()).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
    error.mockRestore();
  });

  it('applies migrations before run() by default', async () => {
    const cli = new MigratingCli({ argv: [], env: MEMORY_ENV });
    expect(await cli.main()).toBe(0);
    expect(cli.tables).toBe(1);
  });
});
