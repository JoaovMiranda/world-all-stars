// A2 (ingestion runs + AI queue) and A3 (source registry + links queued for the next collection).

import type { BaseRepository } from '@was/db';
import { active, aiExtractionQueue, ingestionLogs, ingestionRuns, sourceLinks, sources } from '@was/db';
import {
  type AddCollectionLinksRequest,
  AdminAuditAction,
  type AdminIngestionResponse,
  type AdminQueuedLink,
  type AdminSourcesResponse,
  checkSourceUrl,
  type FieldErrors,
  INGESTION_GATE_VALUES,
  IngestionRunStatus,
  type UpdateSourceRequest,
} from '@was/shared';
import { asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { BaseService } from '../../core/base.service';
import { isoOf } from '../../helpers/date.helper';
import { invalidFields, notFound } from '../../http/http-error.helper';
import type { CatalogView } from '../catalog/catalog.view';
import { ModerationRepository } from '../moderation/moderation.repository';
import { startIngestion } from './ingestion-runner';

const emptyGates = () => Object.fromEntries(INGESTION_GATE_VALUES.map((g) => [g, 0])) as Record<(typeof INGESTION_GATE_VALUES)[number], number>;
type LogLevel = 'info' | 'warn' | 'error';

/** A2 (ingestion runs, AI queue, "rodar agora") and A3 (source registry, links queued for the next collection). */
export class AdminCollectionService extends BaseService {
  /** A2: runs (newest first) with source, gates, tokens and logs + the AI extraction queue. */
  async listIngestion(): Promise<AdminIngestionResponse> {
    const [view, runs, logs, queue] = await Promise.all([
      this.ctx.deps.catalog.get(this.ctx.locale),
      this.db.select().from(ingestionRuns).where(active(ingestionRuns)).orderBy(desc(ingestionRuns.startedAt)),
      this.db.select().from(ingestionLogs).where(active(ingestionLogs)).orderBy(asc(ingestionLogs.at)),
      this.db.select().from(aiExtractionQueue).where(active(aiExtractionQueue)).orderBy(desc(aiExtractionQueue.createdAt)),
    ]);
    const sourcesById = new Map(view.rows.sources.map((x) => [x.id, x]));
    const athleteNames = new Map(view.rows.athletes.map((a) => [a.id, a.knownAs]));
    const logsByRun = Map.groupBy(logs, (l) => l.runId);
    const sourceOf = (id: string | null) => {
      const s = id ? sourcesById.get(id) : undefined;
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
        logs: (logsByRun.get(r.id) ?? []).map((l) => ({ at: l.at.toISOString(), level: l.level as LogLevel, message: l.message })),
      })),
      queue: queue.map((q) => {
        const link = view.sourceLink(q.sourceLinkId);
        const athlete = link?.entityType === 'athletes' && link.entityId ? athleteNames.get(link.entityId) : null;
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
  }

  /**
   * POST /api/admin/ingestion-runs: "rodar agora". Jobs with a real provider (football, BJJ, Wikidata) are queued and
   * drained in the background by @was/ingest; the others keep the simulated run until their provider exists.
   */
  async runIngestion(jobKey: string, names?: string) {
    const real = await startIngestion(this.db, this.repo, jobKey, this.actor.userId, names ? { names } : {});
    if (real) {
      await this.audit(AdminAuditAction.IngestionTriggered, { type: 'ingestion_runs', id: real.runId }, { target: jobKey, reason: null });
      return { ok: true as const };
    }
    const [last] = await this.db
      .select()
      .from(ingestionRuns)
      .where(active(ingestionRuns, eq(ingestionRuns.jobKey, jobKey)))
      .orderBy(desc(ingestionRuns.startedAt))
      .limit(1);
    if (!last) throw notFound();
    const at = new Date();
    await this.transaction(async (repo) => {
      const run = await repo.insert(
        ingestionRuns,
        {
          jobKey,
          sourceId: last.sourceId,
          mode: 'manual',
          startedAt: at,
          finishedAt: at,
          status: IngestionRunStatus.Success,
          checked: last.checked,
          unchanged: last.checked,
          updated: 0,
          errors: 0,
          skipped: { ...emptyGates(), unchanged: last.checked },
          tokens: 0,
        },
        { ...this.actor, via: 'system:manual' },
      );
      const messages = [
        `${last.checked} link(s) checked (manual, simulated: no provider for this job yet)`,
        `${last.checked} unchanged: "unchanged" gate, 0 tokens`,
      ];
      await repo.insertMany(
        ingestionLogs,
        messages.map((message) => ({ runId: run.id, level: 'info', message, at })),
        this.actor,
      );
      await repo.audit(this.actor, AdminAuditAction.IngestionTriggered, { type: 'ingestion_runs', id: run.id }, { target: jobKey, reason: null });
    });
    return { ok: true as const };
  }

  /** Links waiting for the next collection (admin or approved suggestion). */
  private async queuedLinks(view: CatalogView): Promise<AdminQueuedLink[]> {
    const rows = await this.db
      .select()
      .from(sourceLinks)
      .where(active(sourceLinks, isNull(sourceLinks.entityId), inArray(sourceLinks.origin, ['admin', 'suggestion'])))
      .orderBy(desc(sourceLinks.createdAt));
    const sourceNames = new Map(view.rows.sources.map((s) => [s.id, s.name]));
    return rows.map((l) => ({
      id: l.id,
      athleteName: l.pendingLabel ?? l.url,
      sport: l.pendingSport,
      url: l.url,
      sourceName: l.sourceId ? (sourceNames.get(l.sourceId) ?? null) : null,
      origin: l.origin === 'suggestion' ? 'suggestion' : 'admin',
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /** A3: registry overview + license review date + queued links. */
  async listAdminSources(): Promise<AdminSourcesResponse> {
    const view = await this.ctx.deps.catalog.get(this.ctx.locale);
    const bySlug = new Map(view.rows.sources.map((x) => [x.slug, x]));
    return {
      sources: view.sourcesOverview().map((s) => ({ ...s, licenseReviewedAt: isoOf(bySlug.get(s.slug)?.licenseReviewedAt) })),
      queuedLinks: await this.queuedLinks(view),
    };
  }

  /** PATCH /api/admin/sources/:id (id = slug or uuid). */
  async updateSource(key: string, body: UpdateSourceRequest) {
    const view = await this.ctx.deps.catalog.get(this.ctx.locale);
    const source = view.rows.sources.find((s) => s.slug === key || s.id === key);
    if (!source) throw notFound();
    await this.transaction(async (repo) => {
      await repo.update(
        sources,
        source.id,
        {
          ...(body.usageStatus ? { usageStatus: body.usageStatus } : {}),
          ...(body.licenseReviewed !== undefined ? { licenseReviewedAt: body.licenseReviewed ? new Date() : null } : {}),
        },
        this.actor,
        { reason: body.reason },
      );
      await repo.audit(this.actor, AdminAuditAction.SourceUpdated, { type: 'sources', id: source.id }, { target: source.name, reason: body.reason });
    });
    return { ok: true as const };
  }

  /**
   * Re-checks every link with the shared anti-SSRF/registry rule (checkSourceUrl) and returns the source_links rows
   * to queue for the collector (422 on any invalid link). Runs BEFORE the transaction (reads only).
   * Used by A3 (admin) and by an approved suggestion (A8).
   */
  async prepareCollectionLinks(link: {
    athleteName: string;
    sport: string | null;
    urls: readonly string[];
    origin: 'admin' | 'suggestion';
    suggestionId?: string;
  }): Promise<(typeof sourceLinks.$inferInsert)[]> {
    const locale = this.ctx.locale;
    const [rules, view] = await Promise.all([new ModerationRepository(this.db).loadSourceRules(), this.ctx.deps.catalog.get(locale)]);
    const errors: FieldErrors = {};
    const checked = link.urls.map((url, i) => {
      const r = checkSourceUrl(url, rules, locale);
      if (!r.ok) errors[`urls.${i}`] = r.message;
      return r;
    });
    if (Object.keys(errors).length) throw invalidFields(errors, 'invalidLinks');
    return checked.flatMap((r) =>
      r.ok
        ? [
            {
              entityType: 'athletes',
              entityId: null,
              url: r.url,
              sourceId: (r.source ? view.rows.sources.find((s) => s.name === r.source!.name)?.id : undefined) ?? null,
              origin: link.origin,
              suggestionId: link.suggestionId ?? null,
              pendingLabel: link.athleteName,
              pendingSport: link.sport,
            },
          ]
        : [],
    );
  }

  /** Inserts the prepared rows with the transaction's `repo` (the caller's transaction). */
  async insertCollectionLinks(repo: BaseRepository, rows: (typeof sourceLinks.$inferInsert)[]) {
    await repo.insertMany(sourceLinks, rows, this.actor);
  }

  /** POST /api/admin/source-links (A3). */
  async addCollectionLinks(body: AddCollectionLinksRequest) {
    const rows = await this.prepareCollectionLinks({ athleteName: body.athleteName, sport: body.sport ?? null, urls: body.urls, origin: 'admin' });
    await this.transaction(async (repo) => {
      await this.insertCollectionLinks(repo, rows);
      await repo.audit(this.actor, AdminAuditAction.LinksQueued, null, { target: body.athleteName, reason: null });
    });
    return { ok: true as const };
  }
}
