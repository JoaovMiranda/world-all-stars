// Biography Enricher run (handoff v3 §7.2 task 3, Phase 13 §1.1): every call is recorded in ai_invocations; a
// proposal reaches the human queue only after the schema and literal-quote levels pass; level 3 is auto-applied after
// the independent fact-check stage (T1.7). biography@7 / fact-check@2 cite numbered sentences by ID (quotes are literal
// by construction) under a JSON Schema (structured output). A copied 12-word run is rewritten once; an unsupported
// fact-check triggers exactly one regeneration; a second failure leaves the proposal in the exception queue.
import { createHash } from 'node:crypto';

import { aiExtractionQueue, aiInvocations, aiModels, BaseRepository, type Database, promptVersions, seedId, selectRows, sourceLinks } from '@was/db';
import { uuidv7 } from '@was/shared';
import { and, eq, sql } from 'drizzle-orm';

import { applyBiography } from '../canonical/apply-ai';
import { BiographyOutputSchema } from '../schemas/biography.schema';
import type { AiProvider } from './ai-provider.interface';
import type { BiographyAttempt } from './biography-attempt.interface';
import type { BiographyContext } from './biography-context.interface';
import { biographyPrompt } from './biography-prompt.helper';
import type { BiographyRunOptions } from './biography-run-options.interface';
import type { BiographySampling } from './biography-sampling.interface';
import type { EnrichItem } from './enrich-item.interface';
import { copiedRun } from './evidence.helper';
import { factCheckPrompt } from './fact-check.prompt.helper';
import type { FactCheckResult } from './fact-check-result.type';
import { numberCorpus, resolveEvidence } from './numbered-corpus.helper';
import { OLLAMA_SEED } from './ollama.const';
import { BIOGRAPHY_PROMPT_VERSION, FACT_CHECK_PROMPT_VERSION } from './prompt-version.const';
import { runFactCheck } from './run-fact-check.service';
import { biographyJsonSchema } from './structured-output.helper';

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

/**
 * One model call (structured output: claims cite sentence IDs) + deterministic validation, recorded in
 * ai_invocations. The code inserts the cited sentence as the literal evidence quote; a quote text is resolved by the
 * tolerant comparison. `attempt` keeps the input hash unique (attempt 1 is the update-mode key).
 */
const generateBiography = async (c: BiographyContext, attempt: number, hints: string[], sampling: BiographySampling): Promise<BiographyAttempt> => {
  const { db, provider, item, corpus } = c;
  const started = Date.now();
  let output: unknown = null;
  let error: string | null = null;
  let tokens = { tokensIn: 0, tokensOut: 0 };
  try {
    const r = await provider.generate(biographyPrompt(item.name, corpus, hints), { schema: biographyJsonSchema(corpus.ids), ...sampling });
    output = r.output;
    tokens = { tokensIn: r.tokensIn, tokensOut: r.tokensOut };
  } catch (e) {
    error = String((e as Error).message ?? e);
  }
  const parsed = BiographyOutputSchema.safeParse(output);
  // Evidence may come from the article OR from the database facts (already verified, with their own provenance).
  const checked = parsed.success
    ? parsed.data.claims.map((claim) => {
        const evidence = resolveEvidence(corpus, claim.evidence);
        return { text: claim.text, evidence_id: evidence.id, evidence_quote: evidence.quote ?? claim.evidence, literal: evidence.quote !== null };
      })
    : [];
  const verified = checked.filter((x) => x.literal).length;
  // Level 2: at least 2 literal quotes and ≥ 2/3 of them; the unverified ones are shown to the reviewer as such.
  const literal = parsed.success && verified >= 2 && verified * 3 >= checked.length * 2;
  // Level 3 (deterministic): the bio must not be a copy of the source (no 12-word run taken verbatim).
  const run = parsed.success ? copiedRun(parsed.data.bio_en, item.sourceText) : null;
  const copied = run !== null;
  const level: BiographyAttempt['level'] = !parsed.success ? 0 : literal && !copied ? 3 : literal ? 2 : 1;
  const invocationId = uuidv7();
  const inputHash = createHash('sha256').update(`${BIOGRAPHY_PROMPT_VERSION}#${attempt}\n${item.sourceText}`).digest('hex');
  await db.insert(aiInvocations).values({
    id: invocationId,
    createdVia: 'system:enrich',
    modelId: c.modelId,
    promptVersionId: c.promptId,
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
    evidence: checked.map((x) => x.evidence_quote),
  });
  return {
    valid: parsed.success,
    checked,
    level,
    copied,
    copiedRun: run,
    invocationId,
    output,
    error,
    tokens,
    bio: parsed.success ? { bio_en: parsed.data.bio_en, bio_pt: parsed.data.bio_pt, bio_es: parsed.data.bio_es } : null,
  };
};

/** Independent second stage: the biography proposal is re-checked claim by claim; the answer itself is audited too. */
const checkFacts = async (c: BiographyContext, attempt: BiographyAttempt): Promise<FactCheckResult> => {
  const { db, provider, item, corpus } = c;
  const claims = attempt.checked.map((x) => ({ text: x.text, evidence_id: x.evidence_id, evidence_quote: x.evidence_quote }));
  const factInputHash = createHash('sha256')
    .update(`${FACT_CHECK_PROMPT_VERSION}\n${item.sourceText}\n${JSON.stringify(claims)}`)
    .digest('hex');
  const started = Date.now();
  const record = (fact: FactCheckResult, error: string | null) =>
    db.insert(aiInvocations).values({
      id: uuidv7(),
      createdVia: 'system:enrich',
      modelId: c.modelId,
      promptVersionId: c.factPromptId,
      task: 'fact-check',
      inputRef: `${item.sourceUrl}#${item.sectionKey}`,
      inputHash: factInputHash,
      output: 'output' in fact ? fact.output : null,
      tokensIn: fact.tokensIn,
      tokensOut: fact.tokensOut,
      latencyMs: Date.now() - started,
      estimatedCost: 0,
      status: error ? 'error' : 'ok',
      error,
      validationLevel: fact.status === 'supported' ? 4 : 3,
      evidence: 'evidence' in fact ? fact.evidence.filter((e): e is string => e !== null) : [],
    });
  try {
    const fact = await runFactCheck(provider, claims, corpus);
    await record(fact, fact.status === 'invalid' ? 'Fact-check output did not match the required schema' : null);
    return fact;
  } catch (factError) {
    const fact: FactCheckResult = { status: 'invalid', tokensIn: 0, tokensOut: 0 };
    await record(fact, String((factError as Error).message ?? factError));
    return fact;
  }
};

/**
 * One candidate: generate, validate, fact-check, with targeted regenerations. A bio that copies a 12-word run is
 * regenerated once with that run named (rewrite); an unsupported fact-check, an invalid answer or too few literal
 * quotes get one regeneration (T1.7). Returns the accepted attempt, or the best proposal for the exception queue.
 */
const runCandidate = async (c: BiographyContext, nextAttempt: () => number, sampling: BiographySampling) => {
  let hints: string[] = [];
  let rewritten = false;
  let retried = false;
  let best: BiographyAttempt | null = null;
  let calls = 0;
  for (;;) {
    calls++;
    const a = await generateBiography(c, nextAttempt(), hints, sampling);
    if (a.valid && (!best || a.level >= best.level)) best = a;
    if (a.valid && a.level === 3) {
      const fact = await checkFacts(c, a);
      if (fact.status === 'supported') return { attempt: a, accepted: true, calls };
      best = { ...a, level: 2 }; // fact-check failed: at most the exception queue
      if (retried) break;
      retried = true;
      hints = [
        fact.status === 'invalid'
          ? 'the previous claims could not be validated; cite for each claim the one sentence that states it.'
          : `the sentences you cited do not state these claims: ${fact.unsupported.map((t) => `"${t}"`).join('; ')}. Drop them or restate them exactly as their sentence says.`,
      ];
    } else if (a.valid && a.level === 2 && a.copiedRun) {
      if (rewritten) break;
      rewritten = true;
      hints = [
        `your previous bio_en copied this run of words from SOURCE: "${a.copiedRun}". Rewrite bio_en (and its translations) completely in your own words so that no 12 consecutive words match SOURCE.`,
      ];
    } else {
      if (retried) break;
      retried = true;
      hints = [a.valid ? 'cite for each claim the ID of the one sentence that states it.' : 'the previous answer did not match the JSON schema.'];
    }
  }
  return { attempt: best, accepted: false, calls };
};

/** Runs the Biography Enricher; the proposal reaches the human queue only when the fact-check supports every claim. */
export const runBiography = async (db: Database, provider: AiProvider | null, items: EnrichItem[], options: BiographyRunOptions = {}) => {
  const candidates = Math.min(3, Math.max(1, Math.trunc(options.candidates ?? Number(process.env.BIOGRAPHY_CANDIDATES ?? 1)) || 1));
  if (!provider) return { skipped: true, invocations: 0, unchanged: 0, accepted: 0, proposals: 0, rejected: 0 };
  const modelId = seedId('ai_model', provider.provider, provider.model, provider.version);
  await db
    .insert(aiModels)
    .values({ id: modelId, createdVia: 'system:enrich', provider: provider.provider, name: provider.model, version: provider.version })
    .onConflictDoNothing();
  const factPromptId = seedId('prompt', FACT_CHECK_PROMPT_VERSION);
  await db
    .insert(promptVersions)
    .values({
      id: factPromptId,
      createdVia: 'system:enrich',
      task: 'fact-check',
      version: FACT_CHECK_PROMPT_VERSION,
      templateHash: createHash('sha256')
        .update(factCheckPrompt([], numberCorpus('', '')))
        .digest('hex'),
    })
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
        .update(biographyPrompt('', numberCorpus('', '')))
        .digest('hex'),
    })
    .onConflictDoNothing();
  let proposals = 0;
  let rejected = 0;
  let accepted = 0;
  let unchanged = 0;
  let invocations = 0;
  for (const item of items) {
    // Same prompt over the same text was already answered: no new call (Phase 13 §1.2 update mode).
    const inputHash = createHash('sha256').update(`${BIOGRAPHY_PROMPT_VERSION}#1\n${item.sourceText}`).digest('hex');
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
    const c: BiographyContext = { db, provider, modelId, promptId, factPromptId, item, corpus: numberCorpus(item.sourceText, item.facts ?? '') };
    let counter = 0;
    let attempt: BiographyAttempt | null = null;
    let passed = false;
    for (let k = 1; k <= candidates && !passed; k++) {
      // Candidate 1 is greedy (temperature 0, fixed seed); pilot-only extra candidates sample with another seed.
      const r = await runCandidate(c, () => ++counter, k === 1 ? {} : { seed: OLLAMA_SEED + k, temperature: 0.7 });
      invocations += r.calls;
      passed = r.accepted;
      if (r.attempt && (passed || !attempt || r.attempt.level > attempt.level)) attempt = r.attempt;
    }
    const bio = attempt?.bio;
    if (!attempt || !bio) {
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
      `biography|${item.entityId}|${bio.bio_en}`,
      {
        type: 'biography',
        en: bio.bio_en,
        pt: bio.bio_pt,
        es: bio.bio_es,
        claims: attempt.checked,
        copied: attempt.copied,
        level: attempt.level,
      },
      provider.model,
      BIOGRAPHY_PROMPT_VERSION,
      attempt.tokens,
      attempt.invocationId,
    );
    // Phase 13 §1.1: level 3 with a supported fact-check is applied automatically; anything else waits for review.
    if (passed && attempt.level === 3 && queueId) {
      const applied = await applyBiography(new BaseRepository(db), queueId, {
        approvedBy: null,
        reason: 'auto-accepted: schema, literal quotes, original text, fact-check supported',
        invocationId: attempt.invocationId,
      });
      await db
        .update(aiExtractionQueue)
        .set({ status: applied ? 'approved' : 'pending', reviewNote: applied ? 'auto-accepted (validation level 3)' : 'blocked by a curated bio: review' })
        .where(eq(aiExtractionQueue.id, queueId));
      if (applied) accepted++;
      else proposals++;
    } else {
      proposals++;
      if (attempt.level < 2) rejected++;
    }
  }
  return { skipped: false, invocations, unchanged, accepted, proposals, rejected };
};
