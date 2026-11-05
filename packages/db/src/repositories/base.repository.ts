import { jsonPatchDiff, uuidv7 } from '@was/shared';
import { and, eq, getTableName, isNull, type SQL, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Database } from '../client';
import { auditLogs, entityVersions } from '../tables/system.table';

/** Who writes: a user (id + display name) or the system (null id). `via` goes to created_via ('user', 'seed', 'system:x'). */
export interface Actor {
  userId: string | null;
  name?: string | null;
  via?: string;
  ipHash?: string | null;
  userAgent?: string | null;
}
export const SYSTEM_ACTOR: Actor = { userId: null, name: 'system', via: 'system' };

/** Every table has the base columns (columns/base.column.ts). */
type BaseCols = { id: PgColumn; version: PgColumn; deletedAt: PgColumn; deletedBy: PgColumn; updatedAt: PgColumn; updatedBy: PgColumn };
export type BaseTable = PgTable & BaseCols;
type Row<T extends BaseTable> = T['$inferSelect'];
type Insert<T extends BaseTable> = T['$inferInsert'];
type Patch<T extends BaseTable> = Partial<Omit<Insert<T>, 'id' | 'version' | 'createdAt' | 'createdBy' | 'createdVia'>>;

export interface ChangeMeta {
  /** Human summary kept in entity_versions (profile "Versões" tab). */
  summary?: string;
  reason?: string | null;
  /** Optimistic lock: refuse when the row moved on (3-way diff on the admin side). */
  expectedVersion?: number;
}

export class VersionConflictError extends Error {
  constructor(readonly entityType: string, readonly entityId: string, readonly expected: number, readonly actual: number) {
    super(`Version conflict on ${entityType}/${entityId}: expected v${expected}, found v${actual}`);
    this.name = 'VersionConflictError';
  }
}
export class EntityNotFoundError extends Error {
  constructor(readonly entityType: string, readonly entityId: string) {
    super(`${entityType}/${entityId} not found`);
    this.name = 'EntityNotFoundError';
  }
}

const cols = (table: BaseTable) => table as unknown as BaseCols;
const toJson = (row: unknown): Record<string, unknown> => JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
const NOT_VERSIONED = new Set(['entity_versions', 'audit_logs']);

/** Live rows only (soft delete): the default filter of every read. */
export const active = (table: { deletedAt: PgColumn }, ...where: (SQL | undefined)[]): SQL | undefined => and(isNull(table.deletedAt), ...where);

/**
 * The ONLY way the app writes (doc 03): in one transaction it (1) applies the change and bumps `version`,
 * (2) stores the full snapshot + JSON Patch in entity_versions, (3) appends to audit_logs. Soft delete only;
 * `ensure` is the get-or-create of aspects. Services never reimplement any of this.
 */
export class BaseRepository {
  constructor(
    readonly db: Database,
    private readonly hooks: { onWrite?: (table: string) => void } = {},
    /** Tables written inside the current transaction: announced to `onWrite` only after the outermost commit. */
    private readonly pending: Set<string> | null = null,
  ) {}

  /**
   * Runs `fn` in a transaction (nested calls become savepoints). Inside it, use ONLY the given `repo` (`repo.db`):
   * a query on the outer handle would wait for this transaction (PGlite has a single connection).
   */
  async transaction<T>(fn: (repo: BaseRepository) => Promise<T>): Promise<T> {
    const pending = this.pending ?? new Set<string>();
    const result = await this.db.transaction((tx) => fn(new BaseRepository(tx as unknown as Database, this.hooks, pending)));
    if (!this.pending) for (const table of pending) this.hooks.onWrite?.(table);
    return result;
  }

  private written(table: string): void {
    if (this.pending) this.pending.add(table);
    else this.hooks.onWrite?.(table);
  }

  async findById<T extends BaseTable>(table: T, id: string): Promise<Row<T> | null> {
    const rows = await this.db.select().from(table as PgTable).where(active(cols(table), eq(cols(table).id, id))).limit(1);
    return (rows[0] as Row<T> | undefined) ?? null;
  }

  async insert<T extends BaseTable>(table: T, values: Insert<T>, actor: Actor, meta: ChangeMeta = {}): Promise<Row<T>> {
    return this.transaction(async (repo) => {
      const stamp = { id: uuidv7(), createdBy: actor.userId, updatedBy: actor.userId, createdVia: actor.via ?? 'user' };
      const [row] = await repo.db.insert(table as PgTable).values({ ...stamp, ...(values as object) } as never).returning();
      await repo.track(table, null, row as Row<T>, actor, 'create', meta);
      return row as Row<T>;
    });
  }

  async update<T extends BaseTable>(table: T, id: string, patch: Patch<T>, actor: Actor, meta: ChangeMeta = {}): Promise<Row<T>> {
    return this.transaction(async (repo) => {
      const before = await repo.mustFind(table, id);
      const current = (before as { version: number }).version;
      if (meta.expectedVersion !== undefined && meta.expectedVersion !== current) {
        throw new VersionConflictError(getTableName(table), id, meta.expectedVersion, current);
      }
      const [row] = await repo.db
        .update(table as PgTable)
        .set({ ...(patch as object), version: current + 1, updatedAt: new Date(), updatedBy: actor.userId } as never)
        .where(eq(cols(table).id, id))
        .returning();
      await repo.track(table, before, row as Row<T>, actor, 'update', meta);
      return row as Row<T>;
    });
  }

  async softDelete<T extends BaseTable>(table: T, id: string, actor: Actor, meta: ChangeMeta = {}): Promise<Row<T>> {
    return this.transaction(async (repo) => {
      const before = await repo.mustFind(table, id);
      const [row] = await repo.db
        .update(table as PgTable)
        .set({ deletedAt: new Date(), deletedBy: actor.userId, version: (before as { version: number }).version + 1, updatedAt: new Date(), updatedBy: actor.userId } as never)
        .where(eq(cols(table).id, id))
        .returning();
      await repo.track(table, before, row as Row<T>, actor, 'soft_delete', meta);
      return row as Row<T>;
    });
  }

  /** Copies the snapshot of `toVersion` as a NEW version (history is never rewritten). */
  async restore<T extends BaseTable>(table: T, id: string, toVersion: number, actor: Actor): Promise<Row<T>> {
    const entityType = getTableName(table);
    const [target] = await this.db
      .select()
      .from(entityVersions)
      .where(active(entityVersions, eq(entityVersions.entityType, entityType), eq(entityVersions.entityId, id), eq(entityVersions.versionNumber, toVersion)));
    if (!target?.snapshot) throw new EntityNotFoundError(`${entityType}@v${toVersion}`, id);
    const { id: _id, version: _v, createdAt: _c, createdBy: _cb, createdVia: _cv, updatedAt: _u, updatedBy: _ub, ...data } = target.snapshot;
    return this.transaction(async (repo) => {
      const [row] = await repo.db.select().from(table as PgTable).where(eq(cols(table).id, id));
      if (!row) throw new EntityNotFoundError(entityType, id);
      const restored = await repo.db
        .update(table as PgTable)
        .set({ ...reviveDates(data), version: (row as { version: number }).version + 1, updatedAt: new Date(), updatedBy: actor.userId } as never)
        .where(eq(cols(table).id, id))
        .returning();
      await repo.track(table, row as Row<T>, restored[0] as Row<T>, actor, 'restore', { summary: `restore v${toVersion}` });
      return restored[0] as Row<T>;
    });
  }

  /**
   * Get-or-create of an aspect by its unique key (doc 03 "aspects sob demanda"): INSERT … ON CONFLICT DO NOTHING,
   * then read. Safe under concurrency; reads never create aspects.
   */
  async ensure<T extends BaseTable>(table: T, key: Partial<Row<T>>, values: Insert<T>, actor: Actor): Promise<Row<T>> {
    const where = (repo: BaseRepository) =>
      repo.db
        .select()
        .from(table as PgTable)
        .where(active(cols(table), ...Object.entries(key).map(([k, v]) => eq((table as unknown as Record<string, PgColumn>)[k]!, v))))
        .limit(1);
    const [found] = await where(this);
    if (found) return found as Row<T>;
    return this.transaction(async (repo) => {
      const inserted = await repo.db
        .insert(table as PgTable)
        .values({ id: uuidv7(), createdBy: actor.userId, updatedBy: actor.userId, createdVia: actor.via ?? 'user', ...(key as object), ...(values as object) } as never)
        .onConflictDoNothing()
        .returning();
      if (inserted[0]) {
        await repo.track(table, null, inserted[0] as Row<T>, actor, 'create', { summary: 'ensure' });
        return inserted[0] as Row<T>;
      }
      const [row] = await where(repo);
      return row as Row<T>;
    });
  }

  /**
   * Atomic counter change (likes, replies, user counters). Counters are derived data: the row's version is bumped
   * but no snapshot/audit is stored (they would drown the history of real edits).
   */
  async increment<T extends BaseTable>(table: T, id: string, deltas: Partial<Record<keyof Row<T> & string, number>>): Promise<Row<T>> {
    const set: Record<string, SQL> = { version: sql`${cols(table).version} + 1`, updatedAt: sql`now()` };
    for (const [key, delta] of Object.entries(deltas)) {
      const column = (table as unknown as Record<string, PgColumn>)[key]!;
      set[key] = sql`greatest(${column} + ${delta as number}, 0)`;
    }
    const [row] = await this.db.update(table as PgTable).set(set as never).where(eq(cols(table).id, id)).returning();
    this.written(getTableName(table));
    return row as Row<T>;
  }

  /** Domain audit entry (admin decisions): action + target label + reason in metadata. */
  async audit(actor: Actor, action: string, entity: { type: string; id: string | null; version?: number | null } | null, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.db.insert(auditLogs).values({
      id: uuidv7(),
      createdBy: actor.userId,
      createdVia: actor.via ?? 'user',
      actorId: actor.userId,
      actorType: actor.userId ? 'user' : 'system',
      action,
      entityType: entity?.type ?? null,
      entityId: entity?.id ?? null,
      entityVersion: entity?.version ?? null,
      ipHash: actor.ipHash ?? null,
      userAgent: actor.userAgent ?? null,
      metadata: { actorName: actor.name ?? null, ...metadata },
    });
  }

  private async mustFind<T extends BaseTable>(table: T, id: string): Promise<Row<T>> {
    const [row] = await this.db.select().from(table as PgTable).where(active(cols(table), eq(cols(table).id, id)));
    if (!row) throw new EntityNotFoundError(getTableName(table), id);
    return row as Row<T>;
  }

  private async track<T extends BaseTable>(table: T, before: Row<T> | null, after: Row<T>, actor: Actor, action: string, meta: ChangeMeta): Promise<void> {
    const entityType = getTableName(table);
    this.written(entityType);
    if (NOT_VERSIONED.has(entityType)) return;
    const snapshot = toJson(after);
    const version = snapshot.version as number;
    const entityId = snapshot.id as string;
    await this.db.insert(entityVersions).values({
      id: uuidv7(),
      createdBy: actor.userId,
      createdVia: actor.via ?? 'user',
      entityType,
      entityId,
      versionNumber: version,
      snapshot,
      diff: jsonPatchDiff(before ? toJson(before) : null, snapshot),
      summary: meta.summary ?? action,
      author: actor.name ?? (actor.userId ? `user:${actor.userId}` : 'system'),
      reason: meta.reason ?? null,
    });
    await this.audit(actor, action, { type: entityType, id: entityId, version });
  }
}

const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviveDates = (data: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' && ISO_TS.test(v) ? new Date(v) : v]));
