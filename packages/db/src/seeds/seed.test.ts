import fs from 'node:fs';
import path from 'node:path';

import { DEMO_SESSION_EMAILS, LEGAL_DOCUMENT_VERSIONS, REQUIRED_LEGAL_DOCUMENTS } from '@was/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase } from '../client';
import { findRepoRoot } from '../helpers/repo-root.helper';
import { seedId } from '../helpers/seed-id.helper';
import { selectRows } from '../helpers/select-rows.helper';
import type { DatabaseHandle } from '../interfaces/database-handle.interface';
import { seedDatabase } from './seed';

const root = findRepoRoot();
const hasPrototype = fs.existsSync(path.join(root, 'plan/front-prototype/mock'));
const COUNTED = [
  'athletes',
  'users',
  'tier_votes',
  'comments',
  'notifications',
  'greats_dossier_approvals',
  'competition_levels',
  'champion_tiers',
  'sport_translations',
];

const counts = async (h: DatabaseHandle) =>
  Object.fromEntries(
    await Promise.all(COUNTED.map(async (t) => [t, (await selectRows<{ n: number }>(h.db, sql.raw(`select count(*)::int as n from ${t}`)))[0]!.n])),
  );

describe('seed', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
  });
  afterAll(() => h.close());

  it('seeds the configuration even without plan/', async () => {
    await seedDatabase(h.db, '/nonexistent-repo');
    const c = await counts(h);
    expect(c.competition_levels).toBe(4);
    expect(c.champion_tiers).toBe(4);
  });

  it.skipIf(!hasPrototype)('loads the prototype and is idempotent', async () => {
    await seedDatabase(h.db, root);
    const first = await counts(h);
    expect(first.athletes).toBe(18);
    await seedDatabase(h.db, root);
    expect(await counts(h)).toEqual(first);
  });

  it.skipIf(!hasPrototype)('demo accounts accept the CURRENT legal versions, also when an older seed is upgraded', async () => {
    const accepted = async () =>
      (
        (await h.db.execute(sql`
        select u.email, la.document_kind as kind, la.document_version as version from legal_acceptances la join users u on u.id = la.user_id
        where u.email in (${DEMO_SESSION_EMAILS.reader}, ${DEMO_SESSION_EMAILS.admin}) and la.deleted_at is null`)) as unknown as {
          rows: { email: string; kind: string; version: string }[];
        }
      ).rows;
    // A database seeded by an older version: one row per document (id without the version), an older version accepted.
    for (const email of [DEMO_SESSION_EMAILS.reader, DEMO_SESSION_EMAILS.admin]) {
      for (const kind of REQUIRED_LEGAL_DOCUMENTS) {
        await h.db.execute(
          sql`update legal_acceptances set id = ${seedId('la', email, kind)}, document_version = '0.0-old' where id = ${seedId('la', email, kind, LEGAL_DOCUMENT_VERSIONS[kind].version)}`,
        );
      }
    }
    expect((await accepted()).every((r) => r.version === '0.0-old')).toBe(true);
    await seedDatabase(h.db, root);
    const rows = await accepted();
    for (const email of [DEMO_SESSION_EMAILS.reader, DEMO_SESSION_EMAILS.admin]) {
      for (const kind of REQUIRED_LEGAL_DOCUMENTS) {
        expect(rows).toContainEqual({ email, kind, version: LEGAL_DOCUMENT_VERSIONS[kind].version });
      }
    }
  });

  // The trigger is FOR EACH ROW: target a table the configuration seed always fills (CI has no plan/).
  it('refuses physical DELETE (soft delete only)', async () => {
    const error = await h.db.execute(sql`delete from competition_levels`).then(
      () => null,
      (e: Error & { cause?: Error }) => e,
    );
    expect(String(error?.cause?.message ?? error?.message)).toMatch(/forbidden/i);
  });
});
