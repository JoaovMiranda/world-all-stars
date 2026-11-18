// A2 (ingestion runs + AI queue) and A3 (source registry + links queued for the next collection).
import { active, aiExtractionQueue, ingestionLogs, ingestionRuns, sourceLinks, sources } from '@was/db';
import {
  type AddCollectionLinksRequest,
  AdminAuditAction,
  type AdminIngestionResponse,
  type AdminQueuedLink,
  type AdminSourcesResponse,
  type FieldErrors,
  INGESTION_GATE_VALUES,
  IngestionRunStatus,
  type UpdateSourceRequest,
  checkSourceUrl,
} from '@was/shared';
import { asc, desc, eq, inArray, isNull } from 'drizzle-orm';

import type { Actor, BaseRepository } from '@was/db';
import type { AppDeps, RequestContext } from '../../http/app-context.type';
import { invalidFields, notFound } from '../../http/http-error.error';
import { isoOf } from '../catalog/catalog.mapper';
import { loadSourceRules } from '../moderation/moderation.repository';

const emptyGates = () => Object.fromEntries(INGESTION_GATE_VALUES.map((g) => [g, 0])) as Record<(typeof INGESTION_GATE_VALUES)[number], number>;
type LogLevel = 'info' | 'warn' | 'error';

/** A2: runs (newest first) with source, gates, tokens and logs + the AI extraction queue. */
export const listIngestion = async ({ deps }: RequestContext): Promise<AdminIngestionResponse> => {
  const [view, runs, logs, queue] = await Promise.all([
    deps.catalog.get(),
    deps.db.select().from(ingestionRuns).where(active(ingestionRuns)).orderBy(desc(ingestionRuns.startedAt)),
    deps.db.select().from(ingestionLogs).where(active(ingestionLogs)).orderBy(asc(ingestionLogs.at)),
    deps.db.select().from(aiExtractionQueue).where(active(aiExtractionQueue)).orderBy(desc(aiExtractionQueue.createdAt)),
  ]);
  const sourceOf = (id: string | null) => {
    const s = id ? view.rows.sources.find((x) => x.id === id) : undefined;
    return s ? { slug: s.slug, name: s.name } : null;
  };
  return {
    runs: runs.map((r) => ({
      id: r.id,
      jobKey: r.jobKey,
      mode: r.mode,
      startedAt: r.startedAt.toISOString(),
      finishedAt: isoOf(r.finishedAt),
      status: r.status,
      checked: r.checked,
      unchanged: r.unchanged,
      updated: r.updated,
      errors: r.errors,
      source: sourceOf(r.sourceId),
      skipped: { ...emptyGates(), unchanged: r.unchanged, parser: r.errors, ...(r.skipped ?? {}) },
      tokens: r.tokens,
      logs: logs.filter((l) => l.runId === r.id).map((l) => ({ at: l.at.toISOString(), level: l.level as LogLevel, message: l.message })),
    })),
    queue: queue.map((q) => {
      const link = view.sourceLink(q.sourceLinkId);
      const athlete = link?.entityType === 'athletes' && link.entityId ? view.rows.athletes.find((a) => a.id === link.entityId)?.knownAs : null;
      return {
        id: q.id,
        entityLabel: athlete ?? link?.url ?? q.id,
        section: q.sectionKey,
        sourceName: view.source(q.sourceLinkId)?.name ?? null,
        status: q.status,
        skippedAtGate: (q.skippedAtGate as AdminIngestionResponse['queue'][number]['skippedAtGate']) ?? null,
        tokensIn: q.tokensIn,
        tokensOut: q.tokensOut,
        model: q.model,
        createdAt: q.createdAt.toISOString(),
      };
    }),
  };
};

/** POST /api/admin/ingestion-runs: "rodar agora" (SIMULATED until packages/ingest exists: nothing changed upstream). */
export const runIngestion = async (ctx: RequestContext, jobKey: string) => {
  const [last] = await ctx.deps.db.select().from(ingestionRuns).where(active(ingestionRuns, eq(ingestionRuns.jobKey, jobKey))).orderBy(desc(ingestionRuns.startedAt)).limit(1);
  if (!last) throw notFound();
  const at = new Date();
  await ctx.deps.repo.transaction(async (repo) => {
    const run = await repo.insert(
      ingestionRuns,
      { jobKey, sourceId: last.sourceId, mode: 'manual', startedAt: at, finishedAt: at, status: IngestionRunStatus.Success, checked: last.checked, unchanged: last.checked, updated: 0, errors: 0, skipped: { ...emptyGates(), unchanged: last.checked }, tokens: 0 },
      { ...ctx.actor, via: 'system:manual' },
    );
    for (const message of [`${last.checked} link(s) verificados (manual, simulado)`, `${last.checked} sem mudança: portão "sem mudança", 0 tokens`]) {
      await repo.insert(ingestionLogs, { runId: run.id, level: 'info', message, at }, ctx.actor);
    }
    await repo.audit(ctx.actor, AdminAuditAction.IngestionTriggered, { type: 'ingestion_runs', id: run.id }, { target: jobKey, reason: null });
  });
  return { ok: true as const };
};

/** Links waiting for the next collection (admin or approved suggestion). */
const queuedLinks = async (deps: AppDeps): Promise<AdminQueuedLink[]> => {
  const view = await deps.catalog.get();
  const rows = await deps.db
    .select()
    .from(sourceLinks)
    .where(active(sourceLinks, isNull(sourceLinks.entityId), inArray(sourceLinks.origin, ['admin', 'suggestion'])))
    .orderBy(desc(sourceLinks.createdAt));
  return rows.map((l) => ({
    id: l.id,
    athleteName: l.pendingLabel ?? l.url,
    sport: l.pendingSport,
    url: l.url,
    sourceName: l.sourceId ? (view.rows.sources.find((s) => s.id === l.sourceId)?.name ?? null) : null,
    origin: l.origin === 'suggestion' ? 'suggestion' : 'admin',
    createdAt: l.createdAt.toISOString(),
  }));
};

/** A3: registry overview + license review date + queued links. */
export const listAdminSources = async ({ deps }: RequestContext): Promise<AdminSourcesResponse> => {
  const view = await deps.catalog.get();
  return {
    sources: view.sourcesOverview().map((s) => ({ ...s, licenseReviewedAt: isoOf(view.rows.sources.find((x) => x.slug === s.slug)?.licenseReviewedAt) })),
    queuedLinks: await queuedLinks(deps),
  };
};

/** PATCH /api/admin/sources/:id (id = slug or uuid). */
export const updateSource = async (ctx: RequestContext, key: string, body: UpdateSourceRequest) => {
  const view = await ctx.deps.catalog.get();
  const source = view.rows.sources.find((s) => s.slug === key || s.id === key);
  if (!source) throw notFound();
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(
      sources,
      source.id,
      {
        ...(body.usageStatus ? { usageStatus: body.usageStatus } : {}),
        ...(body.licenseReviewed !== undefined ? { licenseReviewedAt: body.licenseReviewed ? new Date() : null } : {}),
      },
      ctx.actor,
      { reason: body.reason },
    );
    await repo.audit(ctx.actor, AdminAuditAction.SourceUpdated, { type: 'sources', id: source.id }, { target: source.name, reason: body.reason });
  });
  return { ok: true as const };
};

/**
 * Re-checks every link with the shared anti-SSRF/registry rule (checkSourceUrl) and returns the source_links rows
 * to queue for the collector (422 on any invalid link). Runs BEFORE the transaction (reads only).
 * Used by A3 (admin) and by an approved suggestion (A8).
 */
export const prepareCollectionLinks = async (
  deps: AppDeps,
  link: { athleteName: string; sport: string | null; urls: readonly string[]; origin: 'admin' | 'suggestion'; suggestionId?: string },
): Promise<(typeof sourceLinks.$inferInsert)[]> => {
  const [rules, view] = await Promise.all([loadSourceRules(deps.db), deps.catalog.get()]);
  const errors: FieldErrors = {};
  const checked = link.urls.map((url, i) => {
    const r = checkSourceUrl(url, rules);
    if (!r.ok) errors[`urls.${i}`] = r.message;
    return r;
  });
  if (Object.keys(errors).length) throw invalidFields(errors, 'invalidLinks');
  return checked.flatMap((r) =>
    r.ok
      ? [{
          entityType: 'athletes',
          entityId: null,
          url: r.url,
          sourceId: (r.source ? view.rows.sources.find((s) => s.name === r.source!.name)?.id : undefined) ?? null,
          origin: link.origin,
          suggestionId: link.suggestionId ?? null,
          pendingLabel: link.athleteName,
          pendingSport: link.sport,
        }]
      : [],
  );
};

export const insertCollectionLinks = async (repo: BaseRepository, actor: Actor, rows: (typeof sourceLinks.$inferInsert)[]) => {
  for (const row of rows) await repo.insert(sourceLinks, row, actor);
};

/** POST /api/admin/source-links (A3). */
export const addCollectionLinks = async (ctx: RequestContext, body: AddCollectionLinksRequest) => {
  const rows = await prepareCollectionLinks(ctx.deps, { athleteName: body.athleteName, sport: body.sport ?? null, urls: body.urls, origin: 'admin' });
  await ctx.deps.repo.transaction(async (repo) => {
    await insertCollectionLinks(repo, ctx.actor, rows);
    await repo.audit(ctx.actor, AdminAuditAction.LinksQueued, null, { target: body.athleteName, reason: null });
  });
  return { ok: true as const };
};

