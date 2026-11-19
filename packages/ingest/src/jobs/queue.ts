// Postgres-backed job queue (handoff v3 §6.3, A02/A04): no Redis/RabbitMQ yet.
// A job = one ingestion_runs row (params_hash makes enqueueing idempotent while it runs); its items are claimed with
// FOR UPDATE SKIP LOCKED, locked for a lease (a dead worker's items come back when it expires), retried with
// exponential backoff + jitter and dead-lettered after max_attempts. Cancellation is cooperative.
import { createHash } from 'node:crypto';

import { type Database, active, ingestionJobItems, ingestionLogs, ingestionRuns } from '@was/db';
import { IngestionRunStatus, uuidv7 } from '@was/shared';
import { and, eq, sql } from 'drizzle-orm';

import { canonicalJson } from '../documents/document-store';

export type JobItem = typeof ingestionJobItems.$inferSelect;
export type JobRun = typeof ingestionRuns.$inferSelect;

export const paramsHashOf = (jobKey: string, params: Record<string, unknown>) => createHash('sha256').update(canonicalJson({ jobKey, params })).digest('hex');

/** Creates (or returns the running) job with its items. Re-enqueueing the same job never duplicates work. */
export const enqueueJob = async (
  db: Database,
  input: { jobKey: string; params: Record<string, unknown>; items: { key: string; payload?: Record<string, unknown> }[]; requestedBy?: string | null; mode?: string },
): Promise<{ run: JobRun; created: boolean }> => {
  const paramsHash = paramsHashOf(input.jobKey, input.params);
  const [running] = await db.select().from(ingestionRuns).where(active(ingestionRuns, and(eq(ingestionRuns.paramsHash, paramsHash), eq(ingestionRuns.status, IngestionRunStatus.Running))));
  if (running) return { run: running, created: false };
  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(ingestionRuns)
      .values({
        id: uuidv7(), createdVia: 'system:ingest', jobKey: input.jobKey, mode: input.mode ?? 'manual', startedAt: new Date(), status: IngestionRunStatus.Running,
        params: input.params, paramsHash, requestedBy: input.requestedBy ?? null,
      })
      .returning();
    if (input.items.length) {
      await tx
        .insert(ingestionJobItems)
        .values(input.items.map((i) => ({ id: uuidv7(), createdVia: 'system:ingest', runId: run!.id, itemKey: i.key, payload: i.payload ?? {} })))
        .onConflictDoNothing();
    }
    return { run: run!, created: true };
  });
};

/** Claims up to `limit` due items (pending, failed with a due retry, or running with an expired lease). */
export const claimItems = async (db: Database, workerId: string, limit = 5, leaseMs = 120_000, runId?: string): Promise<JobItem[]> => {
  const until = new Date(Date.now() + leaseMs);
  const res = (await db.execute(sql`
    update ingestion_job_items set status = 'running', locked_by = ${workerId}, locked_until = ${until.toISOString()}::timestamptz,
      attempts = attempts + 1, updated_at = now(), version = version + 1
    where id in (
      select i.id from ingestion_job_items i join ingestion_runs r on r.id = i.run_id
      where i.deleted_at is null and r.cancel_requested_at is null and r.status = 'running'
        ${runId ? sql`and i.run_id = ${runId}` : sql``}
        and ((i.status in ('pending', 'failed') and i.next_attempt_at <= now()) or (i.status = 'running' and i.locked_until < now()))
      order by r.priority, i.next_attempt_at
      limit ${limit}
      for update of i skip locked
    )
    returning id`)) as unknown as { rows: { id: string }[] };
  const ids = res.rows.map((r) => r.id);
  if (!ids.length) return [];
  return db.select().from(ingestionJobItems).where(sql`${ingestionJobItems.id} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
};

export const completeItem = async (db: Database, item: JobItem, checkpoint?: Record<string, unknown>) => {
  await db
    .update(ingestionJobItems)
    .set({ status: 'done', lockedBy: null, lockedUntil: null, finishedAt: new Date(), checkpoint: checkpoint ?? item.checkpoint, lastError: null })
    .where(eq(ingestionJobItems.id, item.id));
};

/** Exponential backoff with jitter: 2^attempts × base, ±25 %. Dead after max_attempts. */
export const backoffMs = (attempts: number, baseMs = 5_000, random = Math.random) => Math.round(baseMs * 2 ** Math.max(0, attempts - 1) * (0.75 + random() * 0.5));

export const failItem = async (db: Database, item: JobItem, error: unknown, retryAfterMs?: number) => {
  const dead = item.attempts >= item.maxAttempts;
  const delay = Math.max(retryAfterMs ?? 0, backoffMs(item.attempts));
  await db
    .update(ingestionJobItems)
    .set({ status: dead ? 'dead' : 'failed', lockedBy: null, lockedUntil: null, lastError: String(error instanceof Error ? error.message : error).slice(0, 2000), nextAttemptAt: new Date(Date.now() + delay) })
    .where(eq(ingestionJobItems.id, item.id));
  return dead;
};

export const cancelJob = async (db: Database, runId: string) => {
  await db.update(ingestionRuns).set({ cancelRequestedAt: new Date() }).where(eq(ingestionRuns.id, runId));
  await db.update(ingestionJobItems).set({ status: 'cancelled', lockedBy: null, lockedUntil: null }).where(and(eq(ingestionJobItems.runId, runId), sql`${ingestionJobItems.status} in ('pending', 'failed')`));
};

export const logStage = async (db: Database, runId: string, level: 'info' | 'warn' | 'error', stage: string, message: string, extra: { itemId?: string; durationMs?: number } = {}) => {
  await db.insert(ingestionLogs).values({ id: uuidv7(), createdVia: 'system:ingest', runId, level, stage, message: message.slice(0, 4000), at: new Date(), itemId: extra.itemId ?? null, durationMs: extra.durationMs ?? null });
};

/** Closes the run when no item is left to do: success, partial (some dead) or failed (all dead / cancelled). */
export const finishRunIfDone = async (db: Database, runId: string): Promise<JobRun | null> => {
  const counts = (await db.execute(sql`select status, count(*)::int n from ingestion_job_items where run_id = ${runId} and deleted_at is null group by status`)) as unknown as { rows: { status: string; n: number }[] };
  const by = Object.fromEntries(counts.rows.map((r) => [r.status, r.n])) as Record<string, number>;
  const open = (by.pending ?? 0) + (by.failed ?? 0) + (by.running ?? 0);
  if (open > 0) return null;
  const done = by.done ?? 0;
  const dead = (by.dead ?? 0) + (by.cancelled ?? 0);
  const status = dead === 0 ? IngestionRunStatus.Success : done === 0 ? IngestionRunStatus.Failed : IngestionRunStatus.Partial;
  const [run] = await db.update(ingestionRuns).set({ status, finishedAt: new Date(), checked: done + dead, errors: dead }).where(eq(ingestionRuns.id, runId)).returning();
  return run ?? null;
};

export type ItemHandler = (item: JobItem, run: JobRun) => Promise<Record<string, unknown> | void>;

/**
 * Processes items until none is due (or `maxItems`). Each item runs in its own try: a failure never stops the others.
 * Handlers are keyed by job_key. Returns how many items were processed.
 */
export const runWorker = async (db: Database, handlers: Record<string, ItemHandler>, opts: { workerId?: string; maxItems?: number | undefined; runId?: string; batch?: number } = {}) => {
  const workerId = opts.workerId ?? `worker-${process.pid}-${uuidv7().slice(-6)}`;
  let processed = 0;
  for (;;) {
    if (opts.maxItems !== undefined && processed >= opts.maxItems) break;
    const items = await claimItems(db, workerId, opts.batch ?? 5, 120_000, opts.runId);
    if (!items.length) break;
    for (const item of items) {
      const [run] = await db.select().from(ingestionRuns).where(eq(ingestionRuns.id, item.runId));
      const handler = run && handlers[run.jobKey];
      const started = Date.now();
      try {
        if (!run || !handler) throw new Error(`no handler for job ${run?.jobKey ?? item.runId}`);
        if (run.cancelRequestedAt) continue;
        const checkpoint = await handler(item, run);
        await completeItem(db, item, checkpoint ?? undefined);
        await logStage(db, item.runId, 'info', 'item', `${item.itemKey}: done`, { itemId: item.id, durationMs: Date.now() - started });
      } catch (error) {
        const retryAfter = (error as { retryAfterMs?: number }).retryAfterMs;
        const dead = await failItem(db, item, error, retryAfter);
        await logStage(db, item.runId, dead ? 'error' : 'warn', 'item', `${item.itemKey}: ${dead ? 'dead-lettered' : 'will retry'}: ${String((error as Error).message ?? error)}`, { itemId: item.id, durationMs: Date.now() - started });
      }
      processed++;
      await finishRunIfDone(db, item.runId);
    }
  }
  return processed;
};
