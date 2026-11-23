// Merge/unmerge (T1.3, D14): a merge re-points every FK of the registry in one transaction and an unmerge restores the
// database exactly. Proof: a dump of every table the merge touches, taken before the merge and after the unmerge,
// deep-equals (re-pointed tables byte for byte, entity tables except their version bookkeeping).
import { AdminApi } from '@was/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MERGE_REPOINT_TABLES } from '../modules/admin/merge-repoint.const';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';

/** Columns a versioned write (BaseRepository update/restore) changes by design: compared everywhere else. */
const BOOKKEEPING = new Set(['version', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by']);
/** Tables the merge writes through BaseRepository (restored as new versions, or rows it created and unmerge retires). */
const VERSIONED = ['athletes', 'competitors', 'entity_registry', 'slug_redirects', 'field_provenance'];

describe.skipIf(!HAS_PROTOTYPE)('entity merge and exact unmerge (T1.3)', () => {
  let t: TestApp;
  let repointed: string[];
  const rows = async (query: ReturnType<typeof sql>) => ((await t.deps.db.execute(query)) as unknown as { rows: Record<string, unknown>[] }).rows;
  const tableRows = (table: string) => rows(sql`select * from ${sql.identifier(table)} order by id`);
  /** Every row of the re-pointed tables, all columns (soft-deleted rows included). */
  const exactDump = async () => Object.fromEntries(await Promise.all(repointed.map(async (table) => [table, await tableRows(table)] as const)));
  /** Live rows of the versioned tables without the version bookkeeping columns. */
  const liveDump = async () =>
    Object.fromEntries(
      await Promise.all(
        VERSIONED.map(async (table) => [
          table,
          (await tableRows(table)).filter((r) => r.deleted_at === null).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !BOOKKEEPING.has(k)))),
        ]),
      ),
    );

  beforeAll(async () => {
    t = await createTestApp();
    const existing = new Set(
      (await rows(sql`select table_name from information_schema.tables where table_schema = 'public'`)).map((r) => r.table_name as string),
    );
    repointed = [...new Set(MERGE_REPOINT_TABLES.map((r) => r.table))].filter((table) => existing.has(table) && !VERSIONED.includes(table));
  }, 120_000);
  afterAll(() => t.close());

  it('admin only: 401 anonymous, 403 reader', async () => {
    expect((await t.call(AdminApi.listMerges)).status).toBe(401);
    expect((await t.call(AdminApi.listMerges, {}, 'reader')).status).toBe(403);
  });

  it('merge then unmerge restores every affected table exactly', async () => {
    const candidates = (await t.call(AdminApi.mergeCandidates, {}, 'admin')).json.items as { id: string; slug: string; name: string }[];
    const survivor = candidates.find((c) => c.slug === 'pele');
    const merged = candidates.find((c) => c.slug !== 'pele');
    if (!survivor || !merged) throw new Error('the seed needs two athletes');

    const preview = await t.call(AdminApi.previewMerge, { body: { survivorId: survivor.id, mergedId: merged.id } }, 'admin');
    expect(preview.status).toBe(200);
    expect(preview.json.fields.find((f: { field: string }) => f.field === 'slug').merged.value).toBe(merged.slug);
    expect((await t.call(AdminApi.previewMerge, { body: { survivorId: survivor.id, mergedId: survivor.id } }, 'admin')).status).toBe(422);

    const exactBefore = await exactDump();
    const liveBefore = await liveDump();

    const res = await t.call(
      AdminApi.merge,
      { body: { survivorId: survivor.id, mergedId: merged.id, reason: 'same person, two records', fieldChoices: { slug: 'merged', fullName: 'merged' } } },
      'admin',
    );
    expect(res.status, JSON.stringify(res.json)).toBe(200);

    // Merged state: the merged athlete is gone, its rows follow the survivor, the survivor took the merged slug and the
    // survivor's old slug redirects.
    expect((await t.call(AdminApi.mergeCandidates, { query: { q: merged.name } }, 'admin')).json.items.some((c: { id: string }) => c.id === merged.id)).toBe(
      false,
    );
    const [competitor] = await rows(sql`select merged_into_id, deleted_at from competitors where id = ${merged.id}`);
    expect(competitor?.merged_into_id).toBe(survivor.id);
    const [survivorRow] = await rows(sql`select slug from athletes where id = ${survivor.id}`);
    expect(survivorRow?.slug).toBe(merged.slug);
    const [redirect] = await rows(sql`select entity_id from slug_redirects where old_slug = ${survivor.slug} and deleted_at is null`);
    expect(redirect?.entity_id).toBe(survivor.id);
    const [provenance] = await rows(
      sql`select extraction_method from field_provenance where entity_id = ${survivor.id} and field_name = 'slug' and deleted_at is null`,
    );
    expect(provenance?.extraction_method).toBe('manual');
    const history = (await t.call(AdminApi.listMerges, {}, 'admin')).json.items;
    expect(history[0]).toMatchObject({ id: res.json.id, survivor: { id: survivor.id }, merged: { id: merged.id }, undoneAt: null });
    expect(history[0].moved).toBeGreaterThan(0);
    expect(await exactDump()).not.toEqual(exactBefore);

    const undo = await t.call(AdminApi.unmerge, { params: { id: res.json.id }, body: { reason: 'they are two people' } }, 'admin');
    expect(undo.status, JSON.stringify(undo.json)).toBe(200);

    expect(await exactDump()).toEqual(exactBefore);
    expect(await liveDump()).toEqual(liveBefore);
    expect((await t.call(AdminApi.listMerges, {}, 'admin')).json.items[0].undoneAt).not.toBeNull();
    expect((await t.call(AdminApi.unmerge, { params: { id: res.json.id }, body: { reason: 'again please' } }, 'admin')).status).toBe(422);
  });
});
