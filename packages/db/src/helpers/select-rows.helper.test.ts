import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle } from '../client';
import { selectRows } from './select-rows.helper';

describe('selectRows', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
  });
  afterAll(() => h.close());

  it('returns the typed rows of a raw query', async () => {
    const rows = await selectRows<{ n: number; label: string }>(h.db, sql`select g::int as n, 'row ' || g as label from generate_series(1, 3) g order by g`);
    expect(rows).toEqual([
      { n: 1, label: 'row 1' },
      { n: 2, label: 'row 2' },
      { n: 3, label: 'row 3' },
    ]);
  });

  it('returns an empty list when nothing matches', async () => {
    expect(await selectRows(h.db, sql`select 1 as n where false`)).toEqual([]);
  });
});
