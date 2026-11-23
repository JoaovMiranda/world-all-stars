// Career extraction run (handoff v3 §7.2, D03–D05): every call is recorded in ai_invocations; facts reach the
// human queue only after level 1 (schema) and level 2 (the evidence quote exists LITERALLY in the source) pass.
import { createHash } from 'node:crypto';

import { aiInvocations, aiModels, type Database, promptVersions, seedId, sourceLinks } from '@was/db';
import { uuidv7 } from '@was/shared';
import { sql } from 'drizzle-orm';

import { ExtractionOutputSchema } from '../schemas/enrichment.schema';
import type { AiProvider } from './ai-provider.interface';
import type { EnrichItem } from './enrich-item.interface';
import { quoteExists, quoteSupports } from './evidence.helper';
import { extractionPrompt } from './extraction-prompt.helper';
import { PROMPT_VERSION } from './prompt-version.const';

/** Runs one extraction per item; records every invocation and queues the proposals that pass levels 1–2. */
export const runEnrichment = async (db: Database, provider: AiProvider | null, items: EnrichItem[]) => {
  if (!provider) return { skipped: true, invocations: 0, proposals: 0, rejected: 0 };
  const [model] = await db
    .insert(aiModels)
    .values({
      id: seedId('ai_model', provider.provider, provider.model, provider.version),
      createdVia: 'system:enrich',
      provider: provider.provider,
      name: provider.model,
      version: provider.version,
    })
    .onConflictDoNothing()
    .returning();
  const modelId = model?.id ?? seedId('ai_model', provider.provider, provider.model, provider.version);
  const promptHash = createHash('sha256').update(extractionPrompt('', '')).digest('hex');
  await db
    .insert(promptVersions)
    .values({ id: seedId('prompt', PROMPT_VERSION), createdVia: 'system:enrich', task: 'career-extractor', version: PROMPT_VERSION, templateHash: promptHash })
    .onConflictDoNothing();
  let invocations = 0;
  let proposals = 0;
  let rejected = 0;
  for (const item of items) {
    const inputHash = createHash('sha256').update(`${PROMPT_VERSION}\n${item.sourceText}`).digest('hex');
    const started = Date.now();
    let status: 'ok' | 'error' = 'ok';
    let output: unknown = null;
    let error: string | null = null;
    let tokens = { tokensIn: 0, tokensOut: 0 };
    try {
      const r = await provider.generate(extractionPrompt(item.name, item.sourceText));
      output = r.output;
      tokens = { tokensIn: r.tokensIn, tokensOut: r.tokensOut };
    } catch (e) {
      status = 'error';
      error = String((e as Error).message ?? e);
    }
    const parsed = ExtractionOutputSchema.safeParse(output);
    const facts = parsed.success ? parsed.data.facts : [];
    const level = !parsed.success ? 0 : facts.every((f) => quoteExists(f.evidence_quote, item.sourceText)) ? 2 : 1;
    const invocationId = uuidv7();
    await db.insert(aiInvocations).values({
      id: invocationId,
      createdVia: 'system:enrich',
      modelId,
      promptVersionId: seedId('prompt', PROMPT_VERSION),
      task: 'career-extractor',
      inputRef: `${item.sourceUrl}#${item.sectionKey}`,
      inputHash,
      output: (output ?? null) as Record<string, unknown> | null,
      tokensIn: tokens.tokensIn,
      tokensOut: tokens.tokensOut,
      latencyMs: Date.now() - started,
      estimatedCost: 0,
      status,
      error,
      validationLevel: level,
      evidence: facts.map((f) => f.evidence_quote),
    });
    invocations++;
    // The source link the proposal hangs from (the queue's FK), get-or-create.
    const linkId = seedId('ai-link', item.entityId, item.sourceUrl);
    await db
      .insert(sourceLinks)
      .values({ id: linkId, createdVia: 'system:enrich', entityType: 'athletes', entityId: item.entityId, url: item.sourceUrl, origin: 'system' })
      .onConflictDoNothing();
    for (const f of facts) {
      if (!quoteExists(f.evidence_quote, item.sourceText)) {
        rejected++;
        continue;
      }
      const sectionHash = createHash('sha256').update(`${item.sectionKey}|${f.field}|${f.value}`).digest('hex');
      await db.execute(sql`
        insert into ai_extraction_queue (id, created_via, source_link_id, section_key, section_hash, status, result_json, model, prompt_version, tokens_in, tokens_out, invocation_id)
        values (${uuidv7()}, 'system:enrich', ${linkId}, ${item.sectionKey}, ${sectionHash}, 'pending', ${JSON.stringify({ type: 'fact', ...f, supported: quoteSupports(f) })}::jsonb, ${provider.model}, ${PROMPT_VERSION}, ${tokens.tokensIn}, ${tokens.tokensOut}, ${invocationId})
        on conflict do nothing`);
      proposals++;
    }
  }
  return { skipped: false, invocations, proposals, rejected };
};
