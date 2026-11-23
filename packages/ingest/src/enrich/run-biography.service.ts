// Biography Enricher run (handoff v3 §7.2 task 3, Fase 13 §1.1): every call is recorded in ai_invocations; a
// proposal reaches the human queue only after the schema and literal-quote levels pass; level 3 is auto-applied.
import { createHash } from 'node:crypto';

import { aiExtractionQueue, aiInvocations, aiModels, BaseRepository, type Database, promptVersions, seedId, selectRows, sourceLinks } from '@was/db';
import { uuidv7 } from '@was/shared';
import { and, eq, sql } from 'drizzle-orm';

import { applyBiography } from '../canonical/apply-ai';
import { BiographyOutputSchema } from '../schemas/biography.schema';
import type { AiProvider } from './ai-provider.interface';
import { biographyPrompt } from './biography-prompt.helper';
import type { EnrichItem } from './enrich-item.interface';
import { copiesSource, quoteExists } from './evidence.helper';
import { BIOGRAPHY_PROMPT_VERSION } from './prompt-version.const';

const queue = async (
  db: Database,
  linkId: string,
  sectionKey: string,
  hashKey: string,
  result: Record<string, unknown>,
  model: string,
  promptVersion: string,
  tokens: { tokensIn: number; tokensOut: number },
  invocationId: string,
): Promise<string | null> => {
  const res = await selectRows<{ id: string }>(
    db,
    sql`
    insert into ai_extraction_queue (id, created_via, source_link_id, section_key, section_hash, status, result_json, model, prompt_version, tokens_in, tokens_out, invocation_id)
    values (${uuidv7()}, 'system:enrich', ${linkId}, ${sectionKey}, ${createHash('sha256').update(hashKey).digest('hex')}, 'pending', ${JSON.stringify(result)}::jsonb, ${model}, ${promptVersion}, ${tokens.tokensIn}, ${tokens.tokensOut}, ${invocationId})
    on conflict do nothing returning id`,
  );
  return res[0]?.id ?? null;
};

/** Runs the Biography Enricher; the proposal reaches the human queue only when every claim quote is literal (level 2). */
export const runBiography = async (db: Database, provider: AiProvider | null, items: EnrichItem[]) => {
  if (!provider) return { skipped: true, invocations: 0, unchanged: 0, accepted: 0, proposals: 0, rejected: 0 };
  const modelId = seedId('ai_model', provider.provider, provider.model, provider.version);
  await db
    .insert(aiModels)
    .values({ id: modelId, createdVia: 'system:enrich', provider: provider.provider, name: provider.model, version: provider.version })
    .onConflictDoNothing();
  const promptId = seedId('prompt', BIOGRAPHY_PROMPT_VERSION);
  await db
    .insert(promptVersions)
    .values({
      id: promptId,
      createdVia: 'system:enrich',
      task: 'biography',
      version: BIOGRAPHY_PROMPT_VERSION,
      templateHash: createHash('sha256')
        .update(biographyPrompt('', '', ''))
        .digest('hex'),
    })
    .onConflictDoNothing();
  let proposals = 0;
  let rejected = 0;
  let accepted = 0;
  let unchanged = 0;
  for (const item of items) {
    // Same prompt over the same text was already answered: no new call (Fase 13 §1.2 update mode).
    const inputHash = createHash('sha256').update(`${BIOGRAPHY_PROMPT_VERSION}\n${item.sourceText}`).digest('hex');
    if (
      (
        await db
          .select({ id: aiInvocations.id })
          .from(aiInvocations)
          .where(and(eq(aiInvocations.inputHash, inputHash), eq(aiInvocations.status, 'ok')))
          .limit(1)
      ).length
    ) {
      unchanged++;
      continue;
    }
    const started = Date.now();
    let output: unknown = null;
    let error: string | null = null;
    let tokens = { tokensIn: 0, tokensOut: 0 };
    try {
      const r = await provider.generate(biographyPrompt(item.name, item.facts ?? '', item.sourceText));
      output = r.output;
      tokens = { tokensIn: r.tokensIn, tokensOut: r.tokensOut };
    } catch (e) {
      error = String((e as Error).message ?? e);
    }
    const parsed = BiographyOutputSchema.safeParse(output);
    // Evidence may come from the article OR from the database facts (already verified, with their own provenance).
    const corpus = `${item.sourceText}\n${item.facts ?? ''}`;
    const checked = parsed.success ? parsed.data.claims.map((c) => ({ ...c, literal: quoteExists(c.evidence_quote, corpus) })) : [];
    const verified = checked.filter((c) => c.literal).length;
    // Level 2: at least 2 literal quotes and ≥ 2/3 of them; the unverified ones are shown to the reviewer as such.
    const literal = parsed.success && verified >= 2 && verified * 3 >= checked.length * 2;
    // Level 3 (deterministic): the bio must not be a copy of the source (no 12-word run taken verbatim).
    const copied = parsed.success && copiesSource(parsed.data.bio_en, item.sourceText);
    const level = !parsed.success ? 0 : literal && !copied ? 3 : literal ? 2 : 1;
    const invocationId = uuidv7();
    await db.insert(aiInvocations).values({
      id: invocationId,
      createdVia: 'system:enrich',
      modelId,
      promptVersionId: promptId,
      task: 'biography',
      inputRef: `${item.sourceUrl}#${item.sectionKey}`,
      inputHash,
      output: (output ?? null) as Record<string, unknown> | null,
      tokensIn: tokens.tokensIn,
      tokensOut: tokens.tokensOut,
      latencyMs: Date.now() - started,
      estimatedCost: 0,
      status: error ? 'error' : 'ok',
      error,
      validationLevel: level,
      evidence: parsed.success ? parsed.data.claims.map((c) => c.evidence_quote) : [],
    });
    if (!parsed.success) {
      rejected++;
      continue;
    }
    const linkId = seedId('ai-link', item.entityId, item.sourceUrl);
    await db
      .insert(sourceLinks)
      .values({ id: linkId, createdVia: 'system:enrich', entityType: 'athletes', entityId: item.entityId, url: item.sourceUrl, origin: 'system' })
      .onConflictDoNothing();
    const queueId = await queue(
      db,
      linkId,
      'biography',
      `biography|${item.entityId}|${parsed.data.bio_en}`,
      { type: 'biography', en: parsed.data.bio_en, pt: parsed.data.bio_pt, es: parsed.data.bio_es, claims: checked, copied, level },
      provider.model,
      BIOGRAPHY_PROMPT_VERSION,
      tokens,
      invocationId,
    );
    // Fase 13 §1.1: level 3 is applied automatically; anything else waits in the exception queue.
    if (level === 3 && queueId) {
      const applied = await applyBiography(new BaseRepository(db), queueId, {
        approvedBy: null,
        reason: 'auto-accepted: schema, literal quotes, original text',
        invocationId,
      });
      await db
        .update(aiExtractionQueue)
        .set({ status: applied ? 'approved' : 'pending', reviewNote: applied ? 'auto-accepted (validation level 3)' : 'blocked by a curated bio: review' })
        .where(eq(aiExtractionQueue.id, queueId));
      if (applied) accepted++;
      else proposals++;
    } else {
      proposals++;
      if (level < 2) rejected++;
    }
  }
  return { skipped: false, invocations: items.length - unchanged, unchanged, accepted, proposals, rejected };
};
