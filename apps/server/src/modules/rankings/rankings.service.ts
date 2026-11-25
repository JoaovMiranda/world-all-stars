// Rankings (handoff v3 §8, E01–E05): evidence is read from the universal model, the pure @was/ranking engine
// calculates, and the result is stored as an immutable candidate snapshot. Publication needs two DIFFERENT admins
// (same rule as the Hall dossiers); a published snapshot never changes (DB trigger) — a recalculation is a new one.
import {
  type Actor,
  active,
  athletes,
  competitors,
  rankingCalculationRuns,
  rankingEntries,
  rankingEntryItems,
  rankingEntryMetrics,
  rankingMethodologies,
  rankingRulesets,
  rankingSnapshotApprovals,
  rankingSnapshots,
  seedId,
  teams,
} from '@was/db';
import { METHODOLOGIES, type RankingInput, sha256 } from '@was/ranking';
import {
  AdminAuditAction,
  type RankingDetailResponse,
  type RankingFilterFields,
  type RankingFilterOptionsResponse,
  type RankingSnapshotSummary,
  RankingSort,
  type RankingsListQuery,
  type RankingsListResponse,
  uuidv7,
} from '@was/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { BaseService } from '../../core/base.service';
import type { AppDeps } from '../../http/app-deps.interface';
import { forbidden, notFound } from '../../http/http-error.helper';
import { rankingEntryFacts } from './ranking-facts.helper';
import { activeRankingFilters, matchesRankingFilters, rankingFilterOptions } from './ranking-filters.helper';
import { RankingPublicationService } from './ranking-publication.service';
import { EVIDENCE } from './rankings.const';
import { competitorsOf } from './rankings-evidence.helper';
import { rows } from './rankings-sql.helper';

/** Rankings use cases: calculation of candidate snapshots, two-admin approval, public and admin reads. */
export class RankingsService extends BaseService {
  /** Calculates every ranking of a methodology and stores CANDIDATE snapshots (status calculated). */
  static async calculateRankings(deps: AppDeps, methodologyKey: string, actor: Actor): Promise<string[]> {
    const methodology = METHODOLOGIES[methodologyKey];
    const loadEvidence = EVIDENCE[methodologyKey];
    if (!methodology || !loadEvidence) throw notFound();
    const db = deps.db;
    const evidence = await loadEvidence(db);
    const input: RankingInput = { evidence, competitors: await competitorsOf(db, [...new Set(evidence.map((e) => e.competitorId))]) };
    const config = methodology.defaultConfig;
    const methodologyId = seedId('ranking_methodology', methodology.key);
    await db
      .insert(rankingMethodologies)
      .values({ id: methodologyId, createdVia: 'system:ranking', key: methodology.key, outputKind: methodology.outputKind, name: methodology.key })
      .onConflictDoNothing();
    const rulesetId = seedId('ranking_ruleset', methodology.key, methodology.version, sha256(config));
    await db
      .insert(rankingRulesets)
      .values({
        id: rulesetId,
        createdVia: 'system:ranking',
        methodologyId,
        version: methodology.version,
        config: config as Record<string, unknown>,
        configHash: sha256(config),
        activatedAt: new Date(),
      })
      .onConflictDoNothing();
    const created: string[] = [];
    for (const def of methodology.rankingDefinitions(config)) {
      const result = methodology.calculate(def.key, input, config);
      const rankingKey = `${methodology.key}:${def.key}`;
      await db.transaction(async (tx) => {
        const runId = uuidv7();
        await tx.insert(rankingCalculationRuns).values({
          id: runId,
          createdVia: 'system:ranking',
          methodologyId,
          rulesetId,
          algorithmVersion: result.engineVersion,
          methodologyVersion: result.methodologyVersion,
          rankingKey,
          scope: def.scope,
          params: {},
          inputManifest: result.manifest,
          inputHash: result.inputHash,
          outputHash: result.outputHash,
          status: 'success',
          startedAt: new Date(),
          finishedAt: new Date(),
        });
        const snapshotId = uuidv7();
        await tx.insert(rankingSnapshots).values({
          id: snapshotId,
          createdVia: 'system:ranking',
          runId,
          rankingKey,
          title: def.title,
          status: 'calculated',
          inputHash: result.inputHash,
          outputHash: result.outputHash,
        });
        for (const e of result.entries) {
          const entryId = uuidv7();
          await tx.insert(rankingEntries).values({
            id: entryId,
            createdVia: 'system:ranking',
            snapshotId,
            competitorId: e.competitorId,
            rank: e.rank,
            rankTied: e.rankTied,
            band: e.band,
            score: e.score,
            eligible: e.eligible,
            eligibilityReason: e.eligibilityReason,
          });
          const metrics = Object.entries(e.metrics);
          if (metrics.length)
            await tx
              .insert(rankingEntryMetrics)
              .values(metrics.map(([metric, value]) => ({ id: uuidv7(), createdVia: 'system:ranking', entryId, metric, value })));
          if (e.items.length)
            await tx.insert(rankingEntryItems).values(
              e.items.map((i) => ({
                id: uuidv7(),
                createdVia: 'system:ranking',
                entryId,
                evidenceType: methodologyKey === 'bjj-career' ? 'competition_results' : 'entry_members',
                evidenceId: i.evidenceId,
                contribution: i.contribution,
                note: i.note,
              })),
            );
        }
        created.push(snapshotId);
      });
    }
    // D12: auto-publish only when the reproducibility gate passes (RANKING_AUTO_PUBLISH=true in production).
    if (deps.config.rankingAutoPublish) for (const snapshotId of created) await RankingPublicationService.autoPublish(deps, snapshotId);
    await deps.repo.audit(
      actor,
      AdminAuditAction.RankingCalculated,
      { type: 'ranking_snapshots', id: created[0] ?? methodologyId },
      { target: methodologyKey, reason: null },
    );
    return created;
  }

  /** One approval by an admin; the second approval by a DIFFERENT admin publishes (and archives the previous one). */
  static async approveSnapshot(deps: AppDeps, snapshotId: string, actor: Actor, reason: string): Promise<{ ok: true; published: boolean }> {
    const [snap] = await deps.db
      .select()
      .from(rankingSnapshots)
      .where(active(rankingSnapshots, eq(rankingSnapshots.id, snapshotId)));
    if (!snap) throw notFound();
    if (snap.status !== 'calculated' || !actor.userId) throw forbidden();
    const inserted = await deps.db
      .insert(rankingSnapshotApprovals)
      .values({ id: uuidv7(), createdVia: 'user', snapshotId, adminUserId: actor.userId, reason })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) return { ok: true as const, published: false };
    const approvals = (
      await deps.db
        .select()
        .from(rankingSnapshotApprovals)
        .where(active(rankingSnapshotApprovals, eq(rankingSnapshotApprovals.snapshotId, snapshotId)))
    ).length;
    await deps.db.update(rankingSnapshots).set({ approvalsCount: approvals }).where(eq(rankingSnapshots.id, snapshotId));
    await deps.repo.audit(actor, AdminAuditAction.RankingApproved, { type: 'ranking_snapshots', id: snapshotId }, { target: snap.title, reason });
    if (approvals < snap.approvalsRequired) return { ok: true as const, published: false };
    await deps.db.transaction(async (tx) => {
      await tx
        .update(rankingSnapshots)
        .set({ status: 'archived' })
        .where(and(eq(rankingSnapshots.rankingKey, snap.rankingKey), eq(rankingSnapshots.status, 'published')));
      await tx.update(rankingSnapshots).set({ status: 'published', publishedAt: new Date() }).where(eq(rankingSnapshots.id, snapshotId));
    });
    await deps.repo.audit(actor, AdminAuditAction.RankingPublished, { type: 'ranking_snapshots', id: snapshotId }, { target: snap.title, reason });
    return { ok: true as const, published: true };
  }

  /** Calculates candidate snapshots of a methodology as the current actor. */
  calculate(methodologyKey: string): Promise<string[]> {
    return RankingsService.calculateRankings(this.ctx.deps, methodologyKey, this.actor);
  }

  /** Approves a snapshot as the current actor (publishes on the second distinct approval). */
  approve(snapshotId: string, reason: string): Promise<{ ok: true; published: boolean }> {
    return RankingsService.approveSnapshot(this.ctx.deps, snapshotId, this.actor, reason);
  }

  /** Reverts a publication to the previous snapshot of the same ranking (D12). */
  async revert(snapshotId: string, reason: string): Promise<{ ok: true }> {
    const result = await RankingPublicationService.revert(this.ctx.deps, snapshotId, this.actor, reason);
    if (!result.ok) throw forbidden();
    return { ok: true as const };
  }

  /** Published snapshots; optional filters (T2.5): methodology, sport and the ranking's sex category (scope gender). */
  async listPublished(filters: RankingsListQuery = {}): Promise<RankingsListResponse> {
    const where = sql`s.status = 'published'`;
    if (filters.methodology) where.append(sql` and m.key = ${filters.methodology}`);
    if (filters.gender) where.append(sql` and r.scope->>'gender' = ${filters.gender}`);
    const items = await this.summaries(where);
    return { items: filters.sport ? items.filter((i) => i.sport === filters.sport) : items };
  }

  /** URL filters of a published snapshot's methodology with the values present in its entries (T2.5). */
  async filterOptions(id: string): Promise<RankingFilterOptionsResponse> {
    const [snapshot] = await this.summaries(sql`s.id = ${id} and s.status in ('published', 'archived')`);
    if (!snapshot) throw notFound();
    const facts = await rankingEntryFacts(this.db, id, this.ctx.locale);
    return rankingFilterOptions(snapshot.methodology, facts.values(), this.ctx.locale);
  }

  async listAll(): Promise<RankingsListResponse> {
    return { items: await this.summaries(sql`true`) };
  }

  /**
   * Entries of a snapshot, one page. Optional URL filters (T2.5) keep only the entries whose competitor or counted
   * evidence matches (positions stay those of the whole snapshot); keys outside the methodology are ignored, and
   * without filters the answer is the whole snapshot as before. `sort=name` orders by competitor name.
   */
  async detail(
    id: string,
    page: number,
    pageSize: number,
    publishedOnly = true,
    query: RankingFilterFields & { sort?: RankingSort | undefined } = {},
  ): Promise<RankingDetailResponse> {
    const [snapshot] = await this.summaries(sql`s.id = ${id} and ${publishedOnly ? sql`s.status in ('published', 'archived')` : sql`true`}`);
    if (!snapshot) throw notFound();
    let entries = await this.db
      .select()
      .from(rankingEntries)
      .where(eq(rankingEntries.snapshotId, id))
      .orderBy(sql`${rankingEntries.rank} asc nulls last`, rankingEntries.competitorId);
    const filters = activeRankingFilters(snapshot.methodology, query);
    if (Object.keys(filters).length) {
      const facts = await rankingEntryFacts(this.db, id, this.ctx.locale);
      entries = entries.filter((e) => {
        const f = facts.get(e.id);
        return f !== undefined && matchesRankingFilters(f, filters);
      });
    }
    const byName = query.sort === RankingSort.Name;
    const named = byName ? entries : entries.slice((page - 1) * pageSize, page * pageSize);
    const people = named.length
      ? await this.db
          .select({ id: athletes.id, name: athletes.knownAs, slug: athletes.slug, visibility: competitors.profileVisibility })
          .from(athletes)
          .innerJoin(competitors, eq(competitors.id, athletes.id))
          .where(
            inArray(
              athletes.id,
              named.map((e) => e.competitorId),
            ),
          )
      : [];
    const team = named.length
      ? await this.db
          .select({ id: teams.id, name: teams.name })
          .from(teams)
          .where(
            inArray(
              teams.id,
              named.map((e) => e.competitorId),
            ),
          )
      : [];
    type Who = { id: string; name: string; slug: string | null; kind: string; hasProfile: boolean };
    const who = new Map<string, Who>([
      ...people.map((p): [string, Who] => [p.id, { id: p.id, name: p.name, slug: p.slug, kind: 'person', hasProfile: p.visibility === 'public' }]),
      ...team.map((t): [string, Who] => [t.id, { id: t.id, name: t.name, slug: null, kind: 'team', hasProfile: false }]),
    ]);
    if (byName) {
      const collator = new Intl.Collator(this.ctx.locale);
      entries = [...entries].sort((a, b) => collator.compare(who.get(a.competitorId)?.name ?? '', who.get(b.competitorId)?.name ?? ''));
    }
    const slice = byName ? entries.slice((page - 1) * pageSize, page * pageSize) : named;
    const ids = slice.map((e) => e.id);
    const metrics = ids.length ? await this.db.select().from(rankingEntryMetrics).where(inArray(rankingEntryMetrics.entryId, ids)) : [];
    return {
      snapshot,
      total: entries.length,
      page,
      pageSize,
      entries: slice.map((e) => ({
        rank: e.rank,
        rankTied: e.rankTied,
        score: e.score,
        band: e.band,
        eligible: e.eligible,
        eligibilityReason: e.eligibilityReason,
        competitor: who.get(e.competitorId) ?? { id: e.competitorId, name: '?', slug: null, kind: 'person', hasProfile: false },
        metrics: Object.fromEntries(metrics.filter((m) => m.entryId === e.id).map((m) => [m.metric, m.value ?? 0])),
      })),
    };
  }

  async athleteRankings(slug: string) {
    const [a] = await this.db
      .select()
      .from(athletes)
      .where(active(athletes, eq(athletes.slug, slug)));
    if (!a) throw notFound();
    const list = await this.db
      .select({
        snapshotId: rankingSnapshots.id,
        title: rankingSnapshots.title,
        rank: rankingEntries.rank,
        rankTied: rankingEntries.rankTied,
        score: rankingEntries.score,
        rankingKey: rankingSnapshots.rankingKey,
        band: rankingEntries.band,
      })
      .from(rankingEntries)
      .innerJoin(rankingSnapshots, eq(rankingSnapshots.id, rankingEntries.snapshotId))
      .where(and(eq(rankingEntries.competitorId, a.id), eq(rankingSnapshots.status, 'published'), eq(rankingEntries.eligible, true)))
      .orderBy(desc(rankingSnapshots.publishedAt));
    return { items: list };
  }

  /** Registered methodologies and the rankings each produces with its default config. */
  methodologies() {
    return {
      items: Object.values(METHODOLOGIES).map((m) => ({
        key: m.key,
        version: m.version,
        sport: m.sport,
        outputKind: m.outputKind,
        rankings: m.rankingDefinitions().map((r) => ({ key: r.key, title: r.title })),
      })),
    };
  }

  private async summaries(where: ReturnType<typeof sql>): Promise<RankingSnapshotSummary[]> {
    return (
      await rows(
        this.db,
        sql`
      select s.*, r.methodology_version, m.key methodology, m.output_kind, sp.slug sport, (select count(*)::int from ranking_entries e where e.snapshot_id = s.id) n
      from ranking_snapshots s join ranking_calculation_runs r on r.id = s.run_id join ranking_methodologies m on m.id = r.methodology_id left join sports sp on sp.id = m.sport_id
      where s.deleted_at is null and ${where} order by s.ranking_key, s.created_at desc`,
      )
    ).map((s) => ({
      id: String(s.id),
      rankingKey: String(s.ranking_key),
      methodology: String(s.methodology),
      methodologyVersion: String(s.methodology_version),
      sport: s.methodology === 'football-champions' ? 'football' : s.methodology === 'bjj-career' ? 'jiu-jitsu' : ((s.sport as string | null) ?? null),
      title: String(s.title),
      outputKind: s.output_kind as RankingSnapshotSummary['outputKind'],
      status: s.status as RankingSnapshotSummary['status'],
      entries: Number(s.n),
      inputHash: String(s.input_hash),
      outputHash: String(s.output_hash),
      approvals: Number(s.approvals_count),
      approvalsRequired: Number(s.approvals_required),
      calculatedAt: new Date(String(s.created_at)).toISOString(),
      publishedAt: s.published_at ? new Date(String(s.published_at)).toISOString() : null,
    }));
  }
}

/** Compatibility entry for the CLI and tests: `calculateRankings(deps, methodologyKey, actor)`. */
export const calculateRankings = RankingsService.calculateRankings;

/** Compatibility entry for tests: `approveSnapshot(deps, snapshotId, actor, reason)`. */
export const approveSnapshot = RankingsService.approveSnapshot;
