// Concurrency suite on a real Postgres server (T1.9): skipped unless DATABASE_URL is set
// (scripts/test/start-test-postgres.sh). PGlite has a single connection, so these races only exist on Postgres.
import { eq, sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SYSTEM_ACTOR } from '../consts/system-actor.const';
import { VersionConflictError } from '../errors/version-conflict.error';
import { selectRows } from '../helpers/select-rows.helper';
import type { DatabaseHandle } from '../interfaces/database-handle.interface';
import { licenses } from '../tables/provenance.table';
import { auditLogs, entityVersions } from '../tables/system.table';
import { createFreshPostgres } from '../test/postgres.helper';
import { BaseRepository } from './base.repository';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.skipIf(!process.env.DATABASE_URL)('BaseRepository concurrency on Postgres (T1.9)', () => {
  let pg: Awaited<ReturnType<typeof createFreshPostgres>>;
  let other: DatabaseHandle;
  let repo: BaseRepository;
  let repo2: BaseRepository;
  let n = 0;
  const newLicense = () => repo.insert(licenses, { slug: `lic-${++n}`, name: `License ${n}` }, SYSTEM_ACTOR);

  beforeAll(async () => {
    pg = await createFreshPostgres('base_repository');
    other = await pg.open();
    repo = new BaseRepository(pg.db);
    repo2 = new BaseRepository(other.db);
  });
  afterAll(() => pg?.drop());

  /** Opens a transaction on `repo` that locks the row (as a merge does), applies `patch` and waits for `release()`. */
  const holdRowLock = async (id: string, patch: { name: string }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let locked!: () => void;
    const lockTaken = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const done = repo.transaction(async (tx) => {
      await tx.db.execute(sql`select id from licenses where id = ${id} for update`);
      await tx.update(licenses, id, patch, SYSTEM_ACTOR, { summary: 'merge' });
      locked();
      await gate;
    });
    await lockTaken;
    return { release, done };
  };

  it('simultaneous reviews: of N editors on the same version exactly one is applied and the history stays intact', async () => {
    const row = await newLicense();
    const handles = [pg.db, other.db];
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        new BaseRepository(handles[i % 2]!).update(licenses, row.id, { name: `R${i}` }, SYSTEM_ACTOR, { expectedVersion: row.version }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(7);
    const [stored] = await pg.db.select().from(licenses).where(eq(licenses.id, row.id));
    expect(stored!.version).toBe(row.version + 1);
    const versions = await pg.db.select().from(entityVersions).where(eq(entityVersions.entityId, row.id));
    expect(versions.map((v) => v.versionNumber).sort()).toEqual([row.version, row.version + 1]);
  });

  // KNOWN BUG (T1.9 report): BaseRepository.update reads the row without a lock, so a reviewer who read the same
  // version while the other one was committing passes the expectedVersion check and then fails on the
  // entity_versions unique index (raw 23505 → HTTP 500) instead of VersionConflictError (409).
  // Remove `.fails` once update/softDelete read the row with SELECT … FOR UPDATE.
  it('simultaneous reviews: the losing reviewer gets VersionConflictError', async () => {
    const row = await newLicense();
    const first = await holdRowLock(row.id, { name: 'Reviewer A' });
    const second = repo2.update(licenses, row.id, { name: 'Reviewer B' }, SYSTEM_ACTOR, { expectedVersion: row.version });
    await sleep(200);
    first.release();
    await first.done;
    await expect(second).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('merge during ingestion: the merge row lock blocks the ingestion write until commit; a stale write is rejected', async () => {
    const row = await newLicense();
    const merge = await holdRowLock(row.id, { name: 'Merged' });
    const events: string[] = [];
    const ingest = repo2
      .update(licenses, row.id, { name: 'Stale ingestion' }, SYSTEM_ACTOR, { expectedVersion: row.version })
      .finally(() => events.push('ingest-settled'));
    await sleep(300);
    expect(events).toEqual([]); // still waiting on the merge's row lock
    merge.release();
    await merge.done;
    await expect(ingest).rejects.toThrow();
    const [stored] = await pg.db.select().from(licenses).where(eq(licenses.id, row.id));
    expect(stored!.name).toBe('Merged');
    expect(stored!.version).toBe(row.version + 1);
  });

  // KNOWN BUG (T1.9 report): a blind ingestion write (no expectedVersion) that started during the merge computes its
  // version from the pre-merge read and fails on the entity_versions unique index after the merge commits, instead
  // of being applied on top of the merge. Same fix as above (SELECT … FOR UPDATE in update).
  it('merge during ingestion: a blind ingestion write is applied after the merge (serialized, no error)', async () => {
    const row = await newLicense();
    const merge = await holdRowLock(row.id, { name: 'Merged' });
    const ingest = repo2.update(licenses, row.id, { url: 'https://example.org/ingested' }, SYSTEM_ACTOR, { summary: 'ingest' });
    await sleep(200);
    merge.release();
    await merge.done;
    const ingested = await ingest;
    expect(ingested).toMatchObject({ name: 'Merged', url: 'https://example.org/ingested', version: row.version + 2 });
  });

  it('crash mid-write: an error inside repo.transaction rolls back every write (row, versions, audit)', async () => {
    const before = await selectRows<{ licenses: number; versions: number; audits: number }>(
      pg.db,
      sql`select (select count(*)::int from licenses) licenses, (select count(*)::int from entity_versions) versions, (select count(*)::int from audit_logs) audits`,
    );
    const existing = await newLicense();
    const afterInsert = await pg.db.select().from(licenses).where(eq(licenses.id, existing.id));
    expect(afterInsert).toHaveLength(1);
    await expect(
      repo.transaction(async (tx) => {
        await tx.insert(licenses, { slug: 'crash-new', name: 'Never committed' }, SYSTEM_ACTOR);
        await tx.update(licenses, existing.id, { name: 'Never committed either' }, SYSTEM_ACTOR);
        await tx.audit(SYSTEM_ACTOR, 'test.crash', { type: 'licenses', id: existing.id });
        throw new Error('process crashed mid-write');
      }),
    ).rejects.toThrow('process crashed mid-write');
    expect(await pg.db.select().from(licenses).where(eq(licenses.slug, 'crash-new'))).toHaveLength(0);
    const [kept] = await pg.db.select().from(licenses).where(eq(licenses.id, existing.id));
    expect(kept!.name).toBe(existing.name);
    expect(kept!.version).toBe(existing.version);
    const after = await selectRows<{ licenses: number; versions: number; audits: number }>(
      pg.db,
      sql`select (select count(*)::int from licenses) licenses, (select count(*)::int from entity_versions) versions, (select count(*)::int from audit_logs) audits`,
    );
    // Only the committed insert of `existing` is visible (1 row, 1 version, 1 audit entry).
    expect(after[0]).toEqual({ licenses: before[0]!.licenses + 1, versions: before[0]!.versions + 1, audits: before[0]!.audits + 1 });
    expect(await pg.db.select().from(auditLogs).where(eq(auditLogs.action, 'test.crash'))).toHaveLength(0);
  });

  it('crash mid-write: a connection killed inside the transaction leaves nothing behind', async () => {
    const victim = await pg.open(1);
    // node-postgres emits 'error' on a checked-out client whose backend dies; createDatabase only listens on idle
    // clients (pool 'error'), so without this listener the test process would crash on an uncaught exception.
    (victim.db as unknown as { $client: Pool }).$client.on('connect', (client) => client.on('error', () => undefined));
    const victimRepo = new BaseRepository(victim.db);
    let pid = 0;
    const write = victimRepo.transaction(async (tx) => {
      await tx.insert(licenses, { slug: 'killed-new', name: 'Never committed' }, SYSTEM_ACTOR);
      pid = (await selectRows<{ pid: number }>(tx.db, sql`select pg_backend_pid() pid`))[0]!.pid;
      // Still writing when the process dies: the server terminates this backend before COMMIT.
      await tx.db.execute(sql`select pg_sleep(5)`);
    });
    while (!pid) await sleep(10);
    await sleep(50);
    await pg.db.execute(sql`select pg_terminate_backend(${pid})`);
    await expect(write).rejects.toThrow();
    expect(await pg.db.select().from(licenses).where(eq(licenses.slug, 'killed-new'))).toHaveLength(0);
  });

  it('duplicate ingestion: concurrent get-or-create (ensure) of the same key creates one row', async () => {
    const rows = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        new BaseRepository(i % 2 ? other.db : pg.db).ensure(licenses, { slug: 'ensure-race' }, { slug: 'ensure-race', name: 'Ensured' }, SYSTEM_ACTOR),
      ),
    );
    expect(new Set(rows.map((r) => r.id)).size).toBe(1);
    expect(await pg.db.select().from(licenses).where(eq(licenses.slug, 'ensure-race'))).toHaveLength(1);
    expect(await pg.db.select().from(entityVersions).where(eq(entityVersions.entityId, rows[0]!.id))).toHaveLength(1);
  });
});
