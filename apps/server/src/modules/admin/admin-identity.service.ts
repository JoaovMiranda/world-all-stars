// Identity review queue (handoff v3 §7.1, Fase 6): ambiguous competitors wait for a human. A decision is applied by
// the canonical writer on its next pass (match → the observation is that competitor; create → a new one; reject →
// ignored). Every decision is audited; the system never decides these (G03).
import { active, athletes, identityCandidates, sourceDocuments, sourceObservations } from '@was/db';
import { AdminAuditAction, type AdminIdentitiesResponse, type DecideIdentityRequest } from '@was/shared';
import { CanonicalWriter } from '@was/ingest';
import { desc, eq, inArray } from 'drizzle-orm';

import { notFound, unprocessable } from '../../http/http-error.error';
import type { RequestContext } from '../../http/app-context.type';

export const listIdentities = async (ctx: RequestContext): Promise<AdminIdentitiesResponse> => {
  const rows = await ctx.deps.db
    .select({ c: identityCandidates, o: sourceObservations, url: sourceDocuments.url })
    .from(identityCandidates)
    .innerJoin(sourceObservations, eq(sourceObservations.id, identityCandidates.observationId))
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, sourceObservations.documentId))
    .where(active(identityCandidates))
    .orderBy(desc(identityCandidates.createdAt))
    .limit(500);
  const ids = [...new Set(rows.flatMap((r) => ((r.c.evidence as { candidates?: { entityId: string }[] }).candidates ?? []).map((x) => x.entityId)))];
  const people = ids.length ? await ctx.deps.db.select().from(athletes).where(inArray(athletes.id, ids)) : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  return {
    items: rows.map(({ c, o, url }) => {
      const ev = c.evidence as { candidates?: { entityId: string; confidence: number }[]; externalIds?: Record<string, string>; sport?: string | null };
      return {
        id: c.id, discoveredName: c.discoveredName, sport: ev.sport ?? null, externalIds: ev.externalIds ?? {}, confidence: c.confidence,
        status: c.status as AdminIdentitiesResponse['items'][number]['status'],
        candidates: (ev.candidates ?? []).flatMap((x) => { const p = byId.get(x.entityId); return p ? [{ id: p.id, name: p.knownAs, slug: p.slug, confidence: x.confidence }] : []; }),
        provider: o.providerKey, documentUrl: url, createdAt: c.createdAt.toISOString(),
      };
    }),
  };
};

export const decideIdentity = async (ctx: RequestContext, id: string, body: DecideIdentityRequest) => {
  const [candidate] = await ctx.deps.db.select().from(identityCandidates).where(active(identityCandidates, eq(identityCandidates.id, id)));
  if (!candidate) throw notFound();
  if (body.decision === 'match' && !body.entityId) throw unprocessable('validation', 'entityId is required to match');
  const status = body.decision === 'match' ? 'matched' : body.decision === 'create' ? 'created' : 'rejected';
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(identityCandidates, id, { status, proposedEntityId: body.entityId ?? candidate.proposedEntityId, decidedBy: ctx.actor.userId, decidedAt: new Date() } as never, ctx.actor, { reason: body.reason });
    if (body.decision === 'match') await repo.update(sourceObservations, candidate.observationId, { entityId: body.entityId } as never, ctx.actor, { reason: body.reason });
    await repo.audit(ctx.actor, AdminAuditAction.IdentityDecided, { type: 'identity_candidates', id }, { target: candidate.discoveredName, reason: body.reason });
  });
  // Apply it now for that provider (background: the writer is idempotent).
  const [obs] = await ctx.deps.db.select().from(sourceObservations).where(eq(sourceObservations.id, candidate.observationId));
  if (obs && body.decision !== 'reject') void new CanonicalWriter(ctx.deps.db, ctx.deps.repo).writeProviders([obs.providerKey]).catch((e) => console.error('[ingest] identity re-write failed', e));
  return { ok: true as const };
};
