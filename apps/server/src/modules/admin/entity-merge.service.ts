// Merge/unmerge of two competitors (T1.3, D14). One transaction snapshots both entities (entity_versions), re-points
// every FK listed in MERGE_REPOINT_TABLES, retires the merged competitor (merged_into_id + soft delete), applies the
// admin's per-field winners to the survivor (provenance `manual`), adds a slug redirect and writes `entity_merges` with
// the exact undo list (`affected`). Unmerge walks that list backwards, so the affected tables return to their
// pre-merge state. Entity rows are written through BaseRepository (versioned + audited); the FK re-point is one raw
// UPDATE per column (rows of other tables, not entity edits) whose ids are recorded in the merge row.
import { active, athletes, type BaseRepository, competitors, entityMerges, fieldProvenance, slugRedirects } from '@was/db';
import {
  ApiErrorCode,
  EntityType,
  type MergeCandidate,
  type MergeCandidatesResponse,
  type MergeHistoryResponse,
  type MergePreviewResponse,
  type MergeRequest,
  ProvenanceReviewStatus,
} from '@was/shared';
import { desc, eq, ilike, inArray, or, type SQL, sql } from 'drizzle-orm';

import { BaseService } from '../../core/base.service';
import { unprocessable } from '../../http/http-error.helper';
import { MERGE_AFFECTED_PREFIX, MERGE_AUDIT_ACTION, MERGE_CREATED_TABLES, MERGE_RESTORE_TABLES } from './merge-affected.const';
import { MERGE_FIELDS } from './merge-fields.const';
import { MERGE_REPOINT_TABLES } from './merge-repoint.const';
import type { MergeRepointTable } from './merge-repoint-table.interface';

type AthleteRow = typeof athletes.$inferSelect;
type Affected = Record<string, string[]>;

/** Merge/unmerge of competitors with exact restoration (admin only, through EntityMergeController). */
export class EntityMergeService extends BaseService {
  /** Live athletes whose name or slug matches `q` (the two sides of a merge). */
  async candidates(q?: string): Promise<MergeCandidatesResponse> {
    const term = q?.trim();
    const where = term ? or(ilike(athletes.knownAs, `%${term}%`), ilike(athletes.slug, `%${term}%`), ilike(athletes.fullName, `%${term}%`)) : undefined;
    const rows = await this.db
      .select()
      .from(athletes)
      .where(active(athletes, ...(where ? [where] : [])))
      .orderBy(athletes.knownAs)
      .limit(20);
    return { items: rows.map((r) => this.candidateOf(r)) };
  }

  /** Side-by-side values of both entities with the source of each value. */
  async preview(survivorId: string, mergedId: string): Promise<MergePreviewResponse> {
    this.assertDistinct(survivorId, mergedId);
    const survivor = this.notFound(await this.repo.findById(athletes, survivorId));
    const merged = this.notFound(await this.repo.findById(athletes, mergedId));
    const sources = await this.fieldSources([survivorId, mergedId]);
    return {
      survivor: this.candidateOf(survivor),
      merged: this.candidateOf(merged),
      fields: MERGE_FIELDS.map((field) => ({
        field,
        survivor: this.fieldValue(survivor, field, sources),
        merged: this.fieldValue(merged, field, sources),
      })),
    };
  }

  /** Merges `mergedId` into `survivorId` in one transaction; returns the merge id. */
  async merge(input: MergeRequest): Promise<{ id: string }> {
    const { survivorId, mergedId, reason } = input;
    this.assertDistinct(survivorId, mergedId);
    const meta = { reason, summary: 'merge' };
    const result = await this.transaction(async (repo) => {
      const survivor = this.notFound(await repo.findById(athletes, survivorId));
      const merged = this.notFound(await repo.findById(athletes, mergedId));
      this.notFound(await repo.findById(competitors, mergedId));
      const affected: Affected = {};
      const append = (key: string, value: string) => {
        affected[key] = [...(affected[key] ?? []), value];
      };
      const restore = (table: keyof typeof MERGE_RESTORE_TABLES, id: string, version: number) =>
        append(`${MERGE_AFFECTED_PREFIX.restore}${table}`, `${id}@${version}`);
      const created = (table: keyof typeof MERGE_CREATED_TABLES, id: string) => append(`${MERGE_AFFECTED_PREFIX.created}${table}`, id);

      // 1. Snapshots: a fresh entity_versions row of the exact pre-merge state of both entities.
      const snapshot = { ...meta, summary: 'merge: snapshot' };
      const survivorSnap = await repo.update(athletes, survivorId, {}, this.actor, snapshot);
      const mergedSnap = await repo.update(athletes, mergedId, {}, this.actor, snapshot);
      const competitorSnap = await repo.update(competitors, mergedId, {}, this.actor, snapshot);

      // 2. Per-field winners (survivor keeps its own value unless the merged one was picked).
      const patch: Record<string, unknown> = {};
      for (const field of MERGE_FIELDS) if (input.fieldChoices[field] === 'merged' && merged[field] !== survivor[field]) patch[field] = merged[field];
      // Survivor first: unmerge restores it before the merged row takes its slug/QID back.
      if (Object.keys(patch).length) restore('athletes', survivorId, survivorSnap.version);
      restore('athletes', mergedId, mergedSnap.version);
      restore('competitors', mergedId, competitorSnap.version);

      // 3. Re-point every FK of the registry (tables of the current schema only).
      for (const target of await this.existingTargets(repo)) {
        const { moved, kept } = await this.repoint(repo, target, mergedId, survivorId);
        const key = `${target.table}.${target.column}`;
        if (moved.length) affected[key] = moved;
        if (kept.length) affected[`${MERGE_AFFECTED_PREFIX.kept}${key}`] = kept;
      }

      // 4. Retire the merged competitor (its unique slug/QID are free from here on).
      await repo.update(competitors, mergedId, { mergedIntoId: survivorId, deletedAt: new Date(), deletedBy: this.actor.userId }, this.actor, meta);
      await repo.softDelete(athletes, mergedId, this.actor, meta);

      // 5. Apply the winners with provenance `manual`.
      if (Object.keys(patch).length) {
        await repo.update(athletes, survivorId, patch as never, this.actor, { ...meta, summary: 'merge: field choices' });
        for (const fieldName of Object.keys(patch)) {
          const row = await repo.insert(
            fieldProvenance,
            {
              entityType: 'athletes',
              entityId: survivorId,
              fieldName,
              extractionMethod: 'manual',
              ref: `merge:${mergedId}`,
              reviewStatus: ProvenanceReviewStatus.Approved,
              approvedBy: this.actor.userId,
              approvedAt: new Date(),
              isCurrent: true,
            },
            this.actor,
            meta,
          );
          created('field_provenance', row.id);
        }
      }

      // 6. The slug that is no longer live redirects to the survivor.
      const finalSlug = (patch.slug as string | undefined) ?? survivor.slug;
      const droppedSlug = finalSlug === merged.slug ? survivor.slug : merged.slug;
      const [existing] = await repo.db
        .select({ id: slugRedirects.id })
        .from(slugRedirects)
        .where(active(slugRedirects, eq(slugRedirects.entityType, EntityType.Competitor), eq(slugRedirects.scope, ''), eq(slugRedirects.oldSlug, droppedSlug)));
      if (!existing) {
        const redirect = await repo.insert(slugRedirects, { entityType: EntityType.Competitor, entityId: survivorId, oldSlug: droppedSlug }, this.actor, meta);
        created('slug_redirects', redirect.id);
      }

      // 7. The merge row: who, why and the exact undo list.
      const row = await repo.insert(
        entityMerges,
        { entityType: EntityType.Competitor, survivorId, mergedId, reason, actorId: this.actor.userId, affected, mergedAt: new Date() },
        this.actor,
        meta,
      );
      await repo.audit(
        this.actor,
        MERGE_AUDIT_ACTION.merged,
        { type: 'entity_merges', id: row.id },
        { target: `${merged.knownAs} → ${survivor.knownAs}`, reason },
      );
      return row;
    });
    return { id: result.id };
  }

  /** Undoes a merge exactly: re-points the recorded rows back, restores the snapshots and retires what it created. */
  async unmerge(id: string, reason: string): Promise<{ ok: true }> {
    await this.transaction(async (repo) => {
      const merge = this.notFound(await repo.findById(entityMerges, id));
      if (merge.undoneAt) throw unprocessable(ApiErrorCode.AlreadyDecided, 'This merge was already undone.');
      const meta = { reason, summary: 'unmerge' };
      const entries = Object.entries(merge.affected);
      // 1. What the merge inserted (redirect, manual provenance) is retired.
      for (const [key, ids] of entries) {
        if (!key.startsWith(MERGE_AFFECTED_PREFIX.created)) continue;
        const table = MERGE_CREATED_TABLES[key.slice(MERGE_AFFECTED_PREFIX.created.length) as keyof typeof MERGE_CREATED_TABLES];
        for (const rowId of ids) await repo.softDelete(table, rowId, this.actor, meta);
      }
      // 2. Entity rows back to their pre-merge snapshot (survivor first, then the merged athlete and competitor).
      for (const [key, refs] of entries) {
        if (!key.startsWith(MERGE_AFFECTED_PREFIX.restore)) continue;
        const table = MERGE_RESTORE_TABLES[key.slice(MERGE_AFFECTED_PREFIX.restore.length) as keyof typeof MERGE_RESTORE_TABLES];
        for (const ref of refs) {
          const [entityId, version] = ref.split('@') as [string, string];
          await repo.restore(table, entityId, Number(version), this.actor);
        }
      }
      // 3. Every re-pointed row goes back to the merged entity (only if nobody moved it since).
      for (const [key, ids] of entries) {
        if (key.startsWith('__') || !ids.length) continue;
        const [table, column] = key.split('.') as [string, string];
        await repo.db.execute(
          sql`update ${sql.identifier(table)} set ${sql.identifier(column)} = ${merge.mergedId} where ${sql.identifier(column)} = ${merge.survivorId} and id in (${sql.join(
            ids.map((rowId) => sql`${rowId}`),
            sql`, `,
          )})`,
        );
      }
      await repo.update(entityMerges, id, { undoneAt: new Date(), undoneBy: this.actor.userId, undoReason: reason }, this.actor, meta);
      await repo.audit(this.actor, MERGE_AUDIT_ACTION.unmerged, { type: 'entity_merges', id }, { reason });
    });
    return { ok: true };
  }

  /** Merge history, newest first, with both sides (the merged athlete is soft-deleted while the merge stands). */
  async history(): Promise<MergeHistoryResponse> {
    const rows = await this.db.select().from(entityMerges).where(active(entityMerges)).orderBy(desc(entityMerges.mergedAt)).limit(100);
    const ids = [...new Set(rows.flatMap((r) => [r.survivorId, r.mergedId]))];
    const people = ids.length ? await this.db.select().from(athletes).where(inArray(athletes.id, ids)) : [];
    const byId = new Map(people.map((p) => [p.id, this.candidateOf(p)]));
    const side = (entityId: string): MergeCandidate => byId.get(entityId) ?? { id: entityId, slug: entityId, name: entityId };
    return {
      items: rows.map((r) => ({
        id: r.id,
        survivor: side(r.survivorId),
        merged: side(r.mergedId),
        reason: r.reason,
        mergedAt: r.mergedAt.toISOString(),
        undoneAt: r.undoneAt ? r.undoneAt.toISOString() : null,
        undoReason: r.undoReason,
        moved: Object.entries(r.affected)
          .filter(([key]) => !key.startsWith('__'))
          .reduce((n, [, list]) => n + list.length, 0),
      })),
    };
  }

  private assertDistinct(survivorId: string, mergedId: string): void {
    if (survivorId === mergedId) throw unprocessable(ApiErrorCode.Validation, 'An entity cannot be merged into itself.', { mergedId: 'same entity' });
  }

  private candidateOf(row: AthleteRow): MergeCandidate {
    return { id: row.id, slug: row.slug, name: row.knownAs };
  }

  private fieldValue(row: AthleteRow, field: (typeof MERGE_FIELDS)[number], sources: Map<string, string>) {
    const value = row[field];
    const source = sources.get(`${row.id}:${field}`) ?? row.createdVia;
    return { value: value === null || value === undefined ? null : String(value), source };
  }

  /** Latest current provenance of each field (`extraction_method`), keyed `entityId:camelField`. */
  private async fieldSources(entityIds: string[]): Promise<Map<string, string>> {
    const rows = await this.db
      .select({ entityId: fieldProvenance.entityId, fieldName: fieldProvenance.fieldName, method: fieldProvenance.extractionMethod })
      .from(fieldProvenance)
      .where(active(fieldProvenance, inArray(fieldProvenance.entityId, entityIds), eq(fieldProvenance.isCurrent, true)))
      .orderBy(desc(fieldProvenance.createdAt));
    const map = new Map<string, string>();
    for (const r of rows) {
      const key = `${r.entityId}:${r.fieldName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`;
      if (!map.has(key)) map.set(key, r.method);
    }
    return map;
  }

  /** The registry entries whose table and column exist in the current schema. */
  private async existingTargets(repo: BaseRepository): Promise<MergeRepointTable[]> {
    const columns = [...new Set(MERGE_REPOINT_TABLES.map((t) => t.column))];
    const result = await repo.db.execute(
      sql`select table_name, column_name from information_schema.columns where table_schema = 'public' and column_name in (${sql.join(
        columns.map((c) => sql`${c}`),
        sql`, `,
      )})`,
    );
    const existing = new Set(this.rowsOf<{ table_name: string; column_name: string }>(result).map((r) => `${r.table_name}.${r.column_name}`));
    return MERGE_REPOINT_TABLES.filter((t) => existing.has(`${t.table}.${t.column}`));
  }

  /**
   * Moves every row of one column from `from` to `to`: one UPDATE in a savepoint; when it hits a unique conflict
   * (the survivor already has that row), row by row, and the conflicting rows stay where they are (`kept`).
   */
  private async repoint(repo: BaseRepository, target: MergeRepointTable, from: string, to: string): Promise<{ moved: string[]; kept: string[] }> {
    const table = sql.identifier(target.table);
    const column = sql.identifier(target.column);
    const update = (filter: SQL) => sql`update ${table} set ${column} = ${to} where ${column} = ${from}${filter} returning id`;
    try {
      const all = await repo.transaction((r) => r.db.execute(update(sql``)));
      return { moved: this.rowsOf<{ id: string }>(all).map((r) => r.id), kept: [] };
    } catch {
      const ids = this.rowsOf<{ id: string }>(await repo.db.execute(sql`select id from ${table} where ${column} = ${from} order by id`)).map((r) => r.id);
      const moved: string[] = [];
      const kept: string[] = [];
      for (const rowId of ids) {
        try {
          await repo.transaction((r) => r.db.execute(update(sql` and id = ${rowId}`)));
          moved.push(rowId);
        } catch {
          kept.push(rowId);
        }
      }
      return { moved, kept };
    }
  }

  private rowsOf<T>(result: unknown): T[] {
    return (result as { rows: T[] }).rows;
  }
}
