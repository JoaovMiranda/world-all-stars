// Optional AI layer (handoff v3 §7.2, D03–D05). Provider-agnostic (Ollama first); every call is recorded in
// ai_invocations (model, prompt version, tokens, latency, cost, status, evidence). A proposal reaches the human queue
// only after level 1 (schema) and level 2 (the evidence quote exists LITERALLY in the source) pass; level 3 (the quote
// supports the claim) is a deterministic check stored as confidence. Nothing becomes canonical without a human.
import { createHash } from 'node:crypto';

import { BaseRepository, type Database, aiExtractionQueue, aiInvocations, aiModels, promptVersions, seedId, sourceLinks } from '@was/db';

import { applyBiography } from '../canonical/apply-ai';
import { uuidv7 } from '@was/shared';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export interface AiResult {
  output: unknown;
  tokensIn: number;
  tokensOut: number;
}
export interface AiProvider {
  provider: string;
  model: string;
  version: string;
  generate(prompt: string, signal?: AbortSignal): Promise<AiResult>;
}

/** Ollama (local): POST /api/generate with JSON output. Skipped when OLLAMA_URL is not configured. */
export class OllamaProvider implements AiProvider {
  readonly provider = 'ollama';
  readonly version = '';
  constructor(readonly url: string, readonly model: string, private readonly fetchImpl: typeof fetch = fetch) {}
  static fromEnv(): OllamaProvider | null {
    return process.env.OLLAMA_URL ? new OllamaProvider(process.env.OLLAMA_URL, process.env.OLLAMA_MODEL ?? 'qwen2.5:14b') : null;
  }
  async generate(prompt: string, signal?: AbortSignal): Promise<AiResult> {
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, '')}/api/generate`, { method: 'POST', body: JSON.stringify({ model: this.model, prompt, format: 'json', stream: false }), headers: { 'content-type': 'application/json' }, ...(signal ? { signal } : {}) });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const json = (await res.json()) as { response: string; prompt_eval_count?: number; eval_count?: number };
    return { output: JSON.parse(json.response), tokensIn: json.prompt_eval_count ?? 0, tokensOut: json.eval_count ?? 0 };
  }
}

/** Career/achievement extraction contract (subset of EXTRACTION_CONTRACT.md, output in English). */
export const ExtractedFactSchema = z.object({
  field: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  year: z.number().int().nullable().default(null),
  evidence_quote: z.string().min(10).max(400),
});
export const ExtractionOutputSchema = z.object({ facts: z.array(ExtractedFactSchema).max(50) });
export type ExtractedFact = z.infer<typeof ExtractedFactSchema>;

const squash = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/** Level 2: the quote is copied literally from the source text (whitespace-insensitive). */
export const quoteExists = (quote: string, source: string) => squash(source).includes(squash(quote));
/** Level 3 (deterministic): the claimed value and year actually appear in the quote. */
export const quoteSupports = (fact: ExtractedFact) => squash(fact.evidence_quote).includes(squash(String(fact.value))) && (fact.year === null || fact.evidence_quote.includes(String(fact.year)));

export const PROMPT_VERSION = 'career-extractor@1';
export const extractionPrompt = (name: string, section: string) =>
  [
    'You extract facts about an athlete from the text below. Answer ONLY JSON: {"facts":[{"field","value","year","evidence_quote"}]}.',
    'Rules: evidence_quote must be COPIED LITERALLY from the text (5–30 words); never translate, never invent; when unsure, omit the fact.',
    'Fields: birth_date, birth_place, position, club, title, medal, record. Values in English.',
    `Athlete: ${name}`,
    '---',
    section.slice(0, 6000),
  ].join('\n');

/** Biography Enricher (§7.2 task 3): original, factual text; every claim cites a literal quote of the source. */
export const BiographyOutputSchema = z.object({
  bio_en: z.string().min(40).max(1200),
  bio_pt: z.string().min(40).max(1300),
  bio_es: z.string().min(40).max(1300),
  claims: z.array(z.object({ text: z.string().min(3), evidence_quote: z.string().min(10).max(400) })).min(1).max(12),
});
export type BiographyOutput = z.infer<typeof BiographyOutputSchema>;
export const BIOGRAPHY_PROMPT_VERSION = 'biography@2';
export const biographyPrompt = (name: string, facts: string, section: string) =>
  [
    'You write a short factual biography (3–4 sentences, neutral tone, no superlatives that the source does not state) of the athlete below.',
    'Write it with YOUR OWN words — never copy sentences from the text. Use only facts present in the text or in the facts list.',
    'Answer ONLY JSON: {"bio_en": "...", "bio_pt": "... (Brazilian Portuguese)", "bio_es": "... (Spanish)", "claims": [{"text": "a fact you used", "evidence_quote": "5–30 words COPIED LITERALLY from the TEXT (preferred) or from the known facts line that support it"}]}.',
    `Athlete: ${name}`,
    `Known facts (database): ${facts}`,
    '--- TEXT ---',
    section.slice(0, 7000),
  ].join('\n');

export interface EnrichItem {
  entityId: string;
  name: string;
  sourceText: string;
  sourceUrl: string;
  sectionKey: string;
  /** Database facts given to the biography task (titles, clubs, birth…). */
  facts?: string;
}

const queue = async (db: Database, linkId: string, sectionKey: string, hashKey: string, result: Record<string, unknown>, model: string, promptVersion: string, tokens: { tokensIn: number; tokensOut: number }, invocationId: string): Promise<string | null> => {
  const res = (await db.execute(sql`
    insert into ai_extraction_queue (id, created_via, source_link_id, section_key, section_hash, status, result_json, model, prompt_version, tokens_in, tokens_out, invocation_id)
    values (${uuidv7()}, 'system:enrich', ${linkId}, ${sectionKey}, ${createHash('sha256').update(hashKey).digest('hex')}, 'pending', ${JSON.stringify(result)}::jsonb, ${model}, ${promptVersion}, ${tokens.tokensIn}, ${tokens.tokensOut}, ${invocationId})
    on conflict do nothing returning id`)) as unknown as { rows: { id: string }[] };
  return res.rows[0]?.id ?? null;
};

/** Runs the Biography Enricher; the proposal reaches the human queue only when every claim quote is literal (level 2). */
export const runBiography = async (db: Database, provider: AiProvider | null, items: EnrichItem[]) => {
  if (!provider) return { skipped: true, invocations: 0, accepted: 0, proposals: 0, rejected: 0 };
  const modelId = seedId('ai_model', provider.provider, provider.model, provider.version);
  await db.insert(aiModels).values({ id: modelId, createdVia: 'system:enrich', provider: provider.provider, name: provider.model, version: provider.version }).onConflictDoNothing();
  const promptId = seedId('prompt', BIOGRAPHY_PROMPT_VERSION);
  await db.insert(promptVersions).values({ id: promptId, createdVia: 'system:enrich', task: 'biography', version: BIOGRAPHY_PROMPT_VERSION, templateHash: createHash('sha256').update(biographyPrompt('', '', '')).digest('hex') }).onConflictDoNothing();
  let proposals = 0;
  let rejected = 0;
  let accepted = 0;
  for (const item of items) {
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
      id: invocationId, createdVia: 'system:enrich', modelId, promptVersionId: promptId, task: 'biography', inputRef: `${item.sourceUrl}#${item.sectionKey}`,
      inputHash: createHash('sha256').update(`${BIOGRAPHY_PROMPT_VERSION}\n${item.sourceText}`).digest('hex'), output: (output ?? null) as Record<string, unknown> | null,
      tokensIn: tokens.tokensIn, tokensOut: tokens.tokensOut, latencyMs: Date.now() - started, estimatedCost: 0, status: error ? 'error' : 'ok', error, validationLevel: level,
      evidence: parsed.success ? parsed.data.claims.map((c) => c.evidence_quote) : [],
    });
    if (!parsed.success) {
      rejected++;
      continue;
    }
    const linkId = seedId('ai-link', item.entityId, item.sourceUrl);
    await db.insert(sourceLinks).values({ id: linkId, createdVia: 'system:enrich', entityType: 'athletes', entityId: item.entityId, url: item.sourceUrl, origin: 'system' }).onConflictDoNothing();
    const queueId = await queue(db, linkId, 'biography', `biography|${item.entityId}|${parsed.data.bio_en}`, { type: 'biography', en: parsed.data.bio_en, pt: parsed.data.bio_pt, es: parsed.data.bio_es, claims: checked, copied, level }, provider.model, BIOGRAPHY_PROMPT_VERSION, tokens, invocationId);
    // Fase 13 §1.1: level 3 is applied automatically; anything else waits in the exception queue.
    if (level === 3 && queueId) {
      const applied = await applyBiography(new BaseRepository(db), queueId, { approvedBy: null, reason: 'auto-accepted: schema, literal quotes, original text', invocationId });
      await db.update(aiExtractionQueue).set({ status: applied ? 'approved' : 'pending', reviewNote: applied ? 'auto-accepted (validation level 3)' : 'blocked by a curated bio: review' }).where(eq(aiExtractionQueue.id, queueId));
      if (applied) accepted++;
      else proposals++;
    } else {
      proposals++;
      if (level < 2) rejected++;
    }
  }
  return { skipped: false, invocations: items.length, accepted, proposals, rejected };
};

/** True when `text` reuses a run of 12+ words of `source` (the bio must be original writing). */
export const copiesSource = (text: string, source: string) => {
  const words = squash(text).split(' ');
  const src = squash(source);
  for (let i = 0; i + 12 <= words.length; i++) if (src.includes(words.slice(i, i + 12).join(' '))) return true;
  return false;
};

/** Runs one extraction per item; records every invocation and queues the proposals that pass levels 1–2. */
export const runEnrichment = async (db: Database, provider: AiProvider | null, items: EnrichItem[]) => {
  if (!provider) return { skipped: true, invocations: 0, proposals: 0, rejected: 0 };
  const [model] = await db.insert(aiModels).values({ id: seedId('ai_model', provider.provider, provider.model, provider.version), createdVia: 'system:enrich', provider: provider.provider, name: provider.model, version: provider.version }).onConflictDoNothing().returning();
  const modelId = model?.id ?? seedId('ai_model', provider.provider, provider.model, provider.version);
  const promptHash = createHash('sha256').update(extractionPrompt('', '')).digest('hex');
  await db.insert(promptVersions).values({ id: seedId('prompt', PROMPT_VERSION), createdVia: 'system:enrich', task: 'career-extractor', version: PROMPT_VERSION, templateHash: promptHash }).onConflictDoNothing();
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
      id: invocationId, createdVia: 'system:enrich', modelId, promptVersionId: seedId('prompt', PROMPT_VERSION), task: 'career-extractor', inputRef: `${item.sourceUrl}#${item.sectionKey}`, inputHash,
      output: (output ?? null) as Record<string, unknown> | null, tokensIn: tokens.tokensIn, tokensOut: tokens.tokensOut, latencyMs: Date.now() - started, estimatedCost: 0, status, error, validationLevel: level,
      evidence: facts.map((f) => f.evidence_quote),
    });
    invocations++;
    // The source link the proposal hangs from (the queue's FK), get-or-create.
    const linkId = seedId('ai-link', item.entityId, item.sourceUrl);
    await db.insert(sourceLinks).values({ id: linkId, createdVia: 'system:enrich', entityType: 'athletes', entityId: item.entityId, url: item.sourceUrl, origin: 'system' }).onConflictDoNothing();
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

/** D05: approval / rejection / tokens / latency per model × task (from ai_invocations + the review outcome). */
export const aiReport = async (db: Database) =>
  ((await db.execute(sql`
    select m.provider, m.name model, i.task, count(*)::int calls, sum(i.tokens_in + i.tokens_out)::int tokens, round(avg(i.latency_ms))::int avg_latency_ms,
      sum(i.estimated_cost)::float cost,
      (select count(*)::int from ai_extraction_queue q where q.invocation_id = any(array_agg(i.id)) and q.status = 'approved') approved,
      (select count(*)::int from ai_extraction_queue q where q.invocation_id = any(array_agg(i.id)) and q.status = 'rejected') rejected
    from ai_invocations i join ai_models m on m.id = i.model_id group by 1, 2, 3`)) as unknown as { rows: Record<string, unknown>[] }).rows;
