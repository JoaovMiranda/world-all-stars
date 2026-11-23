import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle } from '../client';
import { sources } from '../schema';
import { BaseReadRepository } from './base-read.repository';

class ProbeReadRepository extends BaseReadRepository {
  numbers() {
    return this.selectRows<{ n: number }>(sql`select g::int as n from generate_series(1, 3) g order by g`);
  }
  window(page?: number, size?: number) {
    return this.pageWindow(page, size);
  }
  liveSources() {
    return this.db.select({ slug: sources.slug }).from(sources).where(this.active(sources));
  }
}

describe('BaseReadRepository', () => {
  let h: DatabaseHandle;
  let repo: ProbeReadRepository;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    repo = new ProbeReadRepository(h.db);
  });
  afterAll(() => h.close());

  it('runs typed raw queries', async () => {
    expect(await repo.numbers()).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('filters soft-deleted rows', async () => {
    expect(await repo.liveSources()).toEqual([]);
  });

  it('computes page windows with sane bounds', () => {
    expect(repo.window(1, 24)).toEqual({ limit: 24, offset: 0 });
    expect(repo.window(3, 10)).toEqual({ limit: 10, offset: 20 });
    expect(repo.window(0, 10)).toEqual({ limit: 10, offset: 0 });
    expect(repo.window(2, 1000)).toEqual({ limit: 100, offset: 100 });
    expect(repo.window(Number.NaN, Number.NaN)).toEqual({ limit: 24, offset: 0 });
  });
});
