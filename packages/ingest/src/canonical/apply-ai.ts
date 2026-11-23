// Applies an AI biography to the profile (handoff v3 Fase 13 §1.1): automatic when it passed the three validation
// levels (review_status auto_accepted), or after a human decision on an exception (approved). Precedence: curated
// bios (seed / manual) are never overwritten — only empty bios or bios written by the system itself.
import { type Actor, aiExtractionQueue, athleteTranslations, type BaseRepository, type Database, fieldProvenance, selectRows, sourceLinks } from '@was/db';
import { and, eq, sql } from 'drizzle-orm';

import { AI_ACTOR } from './ai-actor.const';
import type { BiographyResult } from './biography-result.interface';

const SYSTEM_WRITERS = new Set(['system:canonical', 'system:enrich']);

/** Writes the bio (en/pt-BR/es) of the proposal's athlete; returns false when a curated bio blocks it. */
export const applyBiography = async (
  repo: BaseRepository,
  queueId: string,
  mode: { approvedBy: string | null; reason: string | null; invocationId: string | null },
  actor: Actor = AI_ACTOR,
) => {
  const [q] = await repo.db.select().from(aiExtractionQueue).where(eq(aiExtractionQueue.id, queueId));
  const [link] = q ? await repo.db.select().from(sourceLinks).where(eq(sourceLinks.id, q.sourceLinkId)) : [];
  const r = q?.resultJson as BiographyResult | null;
  if (!q || !link?.entityId || link.entityType !== 'athletes' || r?.type !== 'biography') return false;
  let wrote = false;
  for (const [locale, text] of [
    ['en', r.en],
    ['pt-BR', r.pt],
    ['es', r.es],
  ] as const) {
    if (!text) continue;
    const [existing] = await repo.db
      .select()
      .from(athleteTranslations)
      .where(and(eq(athleteTranslations.athleteId, link.entityId), eq(athleteTranslations.locale, locale)));
    if (existing?.shortBio && !SYSTEM_WRITERS.has(existing.createdVia) && mode.approvedBy === null) continue; // curated wins
    if (existing)
      await repo.update(athleteTranslations, existing.id, { shortBio: text } as never, actor, {
        reason: mode.reason,
        summary: `biography (${q.model}, ${q.promptVersion})`,
      });
    else await repo.insert(athleteTranslations, { athleteId: link.entityId, locale, shortBio: text } as never, actor);
    wrote = true;
  }
  if (!wrote) return false;
  await repo.db
    .update(fieldProvenance)
    .set({ isCurrent: false, reviewStatus: 'superseded' })
    .where(and(eq(fieldProvenance.entityId, link.entityId), eq(fieldProvenance.fieldName, 'short_bio'), eq(fieldProvenance.isCurrent, true)));
  await repo.insert(
    fieldProvenance,
    {
      entityType: 'athletes',
      entityId: link.entityId,
      fieldName: 'short_bio',
      sourceLinkId: link.id,
      extractionMethod: 'ai',
      model: `${q.model} · ${q.promptVersion}${mode.invocationId ? ` · ${mode.invocationId}` : ''}`,
      evidenceQuote: r.claims
        .filter((c) => c.literal !== false)
        .map((c) => c.evidence_quote)
        .join(' … ')
        .slice(0, 2000),
      reviewStatus: mode.approvedBy ? 'approved' : 'auto_accepted',
      approvedBy: mode.approvedBy,
      approvedAt: mode.approvedBy ? new Date() : null,
      isCurrent: true,
    } as never,
    actor,
  );
  return true;
};

/** Marks the athletes whose profile still waits for an AI biography (no Ollama, or not reached yet). */
export const needsEnrichment = async (db: Database) => ({ rows: await selectRows<{ id: string }>(db, sqlNeeds) });
const sqlNeeds = sql`select a.id from athletes a where a.deleted_at is null and not exists (select 1 from field_provenance p where p.entity_id = a.id and p.field_name = 'short_bio' and p.extraction_method = 'ai' and p.is_current)`;
