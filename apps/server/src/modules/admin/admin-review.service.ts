// A1 (proposals + tier signals) and A6 (dossiers).
import { applyBiography } from '@was/ingest';
import { active, aiExtractionQueue, athleteTranslations, type BaseRepository, fieldConflicts, fieldProvenance, greatsDossierApprovals, greatsDossiers, sourceLinks, users } from '@was/db';
import {
  type AdminDecision,
  AdminAuditAction,
  AdminDecision as Decision,
  type AdminDossier,
  ApiErrorCode,
  type CrawlerProposal,
  ReviewStatus,
  type TierSignal,
  reviewDossierOutcome,
  tierSignalOf,
  tierVoteCounts,
} from '@was/shared';
import { and, eq, inArray } from 'drizzle-orm';

import type { RequestContext } from '../../http/app-context.type';
import { notFound, unprocessable, unprocessableKey } from '../../http/http-error.error';
import { isoOf } from '../catalog/catalog.mapper';
import { allVotes } from '../tier-votes/tier-votes.repository';

const iso = (d: Date | string | null) => (d instanceof Date ? d.toISOString() : d ? `${d}T00:00:00.000Z` : new Date(0).toISOString());
const resolutionStatus = (r: string): CrawlerProposal['status'] =>
  r === 'pending' ? ReviewStatus.Pending : r === 'rejected' ? ReviewStatus.Rejected : ReviewStatus.Approved;
const queueStatus = (s: string): CrawlerProposal['status'] =>
  s === 'skipped' ? ReviewStatus.Skipped : s === 'approved' ? ReviewStatus.Approved : s === 'rejected' ? ReviewStatus.Rejected : ReviewStatus.Pending;

/** Value of a dotted stats path (`stats.ufc_title_defenses`) in the athlete career stats. */
const statValue = (stats: Record<string, unknown> | undefined, field: string): string | null => {
  const value = field
    .replace(/^stats\./, '')
    .split('.')
    .reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), stats);
  if (value === undefined || value === null) return null;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

/** A1: field conflicts + AI extraction queue + AI-extracted values with evidence (doc 11). Users never propose edits. */
export const listProposals = async ({ deps, locale }: RequestContext): Promise<{ items: CrawlerProposal[] }> => {
  const [view, queue] = await Promise.all([deps.catalog.get(locale), deps.db.select().from(aiExtractionQueue).where(active(aiExtractionQueue))]);
  const athleteNames = new Map(view.rows.athletes.map((a) => [a.id, a.knownAs]));
  const label = (type: string, id: string | null) => (type === 'athletes' && id ? (athleteNames.get(id) ?? id) : (id ?? type));
  const conflicts: CrawlerProposal[] = view.rows.conflicts.map((c) => ({
    id: c.id,
    origin: 'field_conflict',
    entity: { type: c.entityType, id: c.entityId, label: label(c.entityType, c.entityId) },
    field: c.fieldName,
    base: c.baseValue,
    current: c.chosenValue,
    proposed: c.otherValue,
    source: view.source(c.otherSourceLinkId),
    evidenceQuote: null,
    extractedByAi: false,
    model: null,
    status: resolutionStatus(c.resolution),
    reviewNote: c.reviewNote,
    skippedAtGate: null,
    createdAt: c.createdAt.toISOString(),
  }));
  const bioOf = (athleteId: string | null | undefined) => (athleteId ? view.rows.athleteTr.find((t) => t.athleteId === athleteId && t.locale === 'en')?.shortBio ?? null : null);
  const ai: CrawlerProposal[] = queue.map((q) => {
    const link = view.sourceLink(q.sourceLinkId);
    const r = (q.resultJson ?? {}) as { type?: string; en?: string; pt?: string; es?: string; claims?: { evidence_quote: string }[]; field?: string; value?: unknown; evidence_quote?: string };
    if (r.type === 'biography' || r.type === 'fact') {
      return {
        id: q.id,
        origin: 'ai_extraction' as const,
        entity: { type: link?.entityType ?? 'athletes', id: link?.entityId ?? q.id, label: link ? label(link.entityType, link.entityId) : q.sectionKey },
        field: r.type === 'biography' ? 'biography (en / pt-BR / es)' : String(r.field),
        base: null,
        current: r.type === 'biography' ? bioOf(link?.entityId) : null,
        proposed: r.type === 'biography' ? `${r.en}\n\n[pt-BR] ${r.pt}\n\n[es] ${r.es}` : String(r.value),
        source: view.source(q.sourceLinkId),
        evidenceQuote: r.type === 'biography' ? (r.claims ?? []).map((c) => `${(c as { literal?: boolean }).literal === false ? '[NOT VERIFIED] ' : ''}${c.evidence_quote}`).join(' … ') : (r.evidence_quote ?? null),
        extractedByAi: true,
        model: q.model,
        status: queueStatus(q.status),
        reviewNote: q.reviewNote,
        skippedAtGate: q.skippedAtGate,
        createdAt: q.createdAt.toISOString(),
      };
    }
    return {
      id: q.id,
      origin: 'ai_extraction',
      entity: { type: link?.entityType ?? 'unknown', id: link?.entityId ?? q.id, label: link ? label(link.entityType, link.entityId) : q.sectionKey },
      field: q.sectionKey,
      base: null,
      current: null,
      proposed: q.resultJson ? JSON.stringify(q.resultJson) : null,
      source: view.source(q.sourceLinkId),
      evidenceQuote: null,
      extractedByAi: true,
      model: q.model,
      status: queueStatus(q.status),
      reviewNote: q.reviewNote,
      skippedAtGate: q.skippedAtGate,
      createdAt: q.createdAt.toISOString(),
    };
  });
  const extracted: CrawlerProposal[] = view.rows.provenance
    .filter((f) => f.extractionMethod === 'ai' && f.evidenceQuote && f.entityType === 'athletes')
    .flatMap((f) => {
      const value = statValue(view.rows.stats.find((s) => s.athleteId === f.entityId && s.period === 'career')?.stats, f.fieldName);
      if (value === null) return [];
      return [{
        id: f.id,
        origin: 'ai_extraction' as const,
        entity: { type: 'athletes', id: f.entityId, label: label('athletes', f.entityId) },
        field: f.fieldName,
        base: null,
        current: value,
        proposed: value,
        source: view.source(f.sourceLinkId),
        evidenceQuote: f.evidenceQuote,
        extractedByAi: true,
        model: f.model,
        status: ReviewStatus.Approved,
        reviewNote: null,
        skippedAtGate: null,
        createdAt: iso(f.retrievedAt),
      }];
    });
  return { items: [...conflicts, ...ai, ...extracted] };
};

/** PATCH /api/admin/proposals/:id: only pending items; decision + reason recorded and audited. */
export const reviewProposal = async (ctx: RequestContext, id: string, decision: AdminDecision, reason: string) => {
  const item = (await listProposals(ctx)).items.find((p) => p.id === id);
  if (!item) throw notFound();
  if (item.status !== ReviewStatus.Pending) throw unprocessableKey(ApiErrorCode.AlreadyDecided, 'proposalDecided');
  const approve = decision === Decision.Approve;
  const review = { reviewNote: reason, reviewedBy: ctx.actor.userId, reviewedAt: new Date() };
  await ctx.deps.repo.transaction(async (repo) => {
    if (item.origin === 'field_conflict') await repo.update(fieldConflicts, id, { resolution: approve ? 'approved' : 'rejected', ...review }, ctx.actor, { reason });
    else {
      await repo.update(aiExtractionQueue, id, { status: approve ? 'approved' : 'rejected', ...review }, ctx.actor, { reason });
      // An approved AI proposal is applied to the profile, with an approved provenance row (G03: a human decided).
      if (approve) await applyAiProposal(repo, ctx, id, reason);
    }
    await repo.audit(ctx.actor, approve ? AdminAuditAction.ProposalApproved : AdminAuditAction.ProposalRejected, { type: item.origin, id }, { target: `${item.entity.label} · ${item.field}`, reason });
  });
  return { ok: true as const };
};

/** A1 "Sinais de tier" (doc 17): shared tierSignalOf over the live votes. */
export const listTierSignals = async ({ deps, locale }: RequestContext): Promise<{ items: TierSignal[] }> => {
  const [view, votes] = await Promise.all([deps.catalog.get(locale), allVotes(deps.db)]);
  const votesByAthlete = Map.groupBy(votes, (v) => v.athleteId);
  const items = view.athletes().map((a) => {
    const counts = tierVoteCounts((votesByAthlete.get(a.id) ?? []).map((v) => v.tier));
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    return { athlete: { slug: a.slug, knownAs: a.knownAs, tier: a.tier }, official: a.tier, counts, total, ...tierSignalOf(counts, a.tier) };
  });
  return { items: items.sort((x, y) => Number(y.isSignal) - Number(x.isSignal) || y.topOtherShare - x.topOtherShare) };
};

/** A6: dossiers with evidences and the names of the admins who approved. */
export const listDossiers = async ({ deps, locale }: RequestContext): Promise<{ items: AdminDossier[] }> => {
  const [view, approvals] = await Promise.all([
    deps.catalog.get(locale),
    deps.db
      .select({ dossierId: greatsDossierApprovals.dossierId, userId: users.id, name: users.displayName, at: greatsDossierApprovals.createdAt })
      .from(greatsDossierApprovals)
      .innerJoin(users, eq(users.id, greatsDossierApprovals.adminUserId))
      .where(active(greatsDossierApprovals)),
  ]);
  const approvalsByDossier = Map.groupBy(approvals, (a) => a.dossierId);
  const evidencesByDossier = Map.groupBy(view.rows.evidences, (e) => e.dossierId);
  const items = view.rows.dossiers.map((d) => ({
    id: d.id,
    athlete: view.athleteRef(d.athleteId),
    headline: view.dossierHeadline(d.id) ?? '',
    status: d.status,
    approvalsRequired: d.approvalsRequired,
    approvedBy: (approvalsByDossier.get(d.id) ?? []).sort((a, b) => a.at.getTime() - b.at.getTime()).map((a) => a.name),
    reviewNote: d.reviewNote,
    evidences: (evidencesByDossier.get(d.id) ?? []).map((e) => ({ id: e.id, type: e.evidenceType as AdminDossier['evidences'][number]['type'], description: view.evidenceDescription(e.id), source: view.source(e.sourceLinkId) })),
    updatedAt: isoOf(d.updatedAt)!,
  }));
  return { items: items.sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending')) };
};

/** PATCH /api/admin/dossiers/:id: shared rule (2 approvals by different admins, 1 rejection closes). */
export const reviewDossier = async (ctx: RequestContext, id: string, decision: AdminDecision, reason: string) => {
  const view = await ctx.deps.catalog.get(ctx.locale);
  const dossier = view.rows.dossiers.find((d) => d.id === id);
  if (!dossier) throw notFound();
  const approvers = await ctx.deps.db.select().from(greatsDossierApprovals).where(active(greatsDossierApprovals, inArray(greatsDossierApprovals.dossierId, [id])));
  const outcome = reviewDossierOutcome(
    { status: dossier.status, approvedBy: approvers.map((a) => a.adminUserId), approvalsRequired: dossier.approvalsRequired },
    decision,
    ctx.actor.userId!,
    ctx.locale,
  );
  if (!outcome.ok) throw unprocessable(outcome.error, outcome.message);
  await ctx.deps.repo.transaction(async (repo) => {
    if (decision === Decision.Approve) await repo.insert(greatsDossierApprovals, { dossierId: id, adminUserId: ctx.actor.userId!, reason }, ctx.actor);
    await repo.update(greatsDossiers, id, { status: outcome.status, approvalsCount: outcome.approvedBy.length, reviewNote: reason }, ctx.actor, { reason });
    await repo.audit(ctx.actor, decision === Decision.Approve ? AdminAuditAction.DossierApproved : AdminAuditAction.DossierRejected, { type: 'greats_dossiers', id }, {
      target: view.athleteRef(dossier.athleteId).knownAs,
      reason,
    });
  });
  return { ok: true as const };
};

// Exception approval (Fase 13 §1.1): same canonical apply as the automatic path, with the human as approver.
const applyAiProposal = (repo: BaseRepository, ctx: RequestContext, id: string, reason: string) =>
  applyBiography(repo, id, { approvedBy: ctx.actor.userId, reason, invocationId: null }, ctx.actor);
