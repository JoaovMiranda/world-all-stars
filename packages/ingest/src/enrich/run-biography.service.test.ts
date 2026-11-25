import { aiExtractionQueue, aiInvocations, athletes, BaseRepository, championTiers, createDatabase, type DatabaseHandle } from '@was/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AiCallOptions } from './ai-call-options.interface';
import type { AiProvider } from './ai-provider.interface';
import { runBiography } from './run-biography.service';

const SOURCE =
  'Edson Arantes do Nascimento, better known as Pelé, was a Brazilian professional footballer who played as a forward. He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil. He played for Santos from 1956 to 1974.';
const ORIGINAL = 'A forward from Brazil, Pelé lifted three world titles and spent nearly two decades at Santos.';
const COPIED = 'He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil, playing as a forward.';
const bio = (en: string) => ({
  claims: [
    { text: 'three World Cups', evidence: 'S2' },
    { text: 'played for Santos', evidence: 'S3' },
  ],
  bio_en: en,
  bio_pt: `${en} (pt)`,
  bio_es: `${en} (es)`,
});
const supported = {
  claims: [
    { claim: 'C1', evidence: 'S2', status: 'supported' },
    { claim: 'C2', evidence: 'S3', status: 'supported' },
  ],
};

/** Fake model: `answer(prompt, n)` gives the n-th biography; fact-checks answer `fact`. Records prompts and options. */
const fakeModel = (answer: (prompt: string, n: number) => unknown, fact: unknown = supported) => {
  const bioPrompts: string[] = [];
  const bioOptions: AiCallOptions[] = [];
  const factPrompts: string[] = [];
  const provider: AiProvider = {
    provider: 'fake',
    model: 'fake-v7',
    version: '1',
    async generate(prompt, options = {}) {
      if (prompt.startsWith('Validate each proposed biography claim')) {
        factPrompts.push(prompt);
        return { output: fact, tokensIn: 1, tokensOut: 1 };
      }
      bioPrompts.push(prompt);
      bioOptions.push(options);
      return { output: answer(prompt, bioPrompts.length), tokensIn: 1, tokensOut: 1 };
    },
  };
  return { provider, bioPrompts, bioOptions, factPrompts };
};

describe('runBiography with biography@7 / fact-check@2', () => {
  let h: DatabaseHandle;
  let tierId = '';
  let n = 0;
  /** A fresh athlete per case (a second auto-accepted bio for the same athlete would be blocked as curated). */
  const item = async () => ({
    entityId: (
      await new BaseRepository(h.db).insert(athletes, { slug: `pele-v7-${n}`, knownAs: 'Pelé', status: 'unknown', championTierId: tierId } as never, {
        userId: null,
        name: 'test',
        via: 'system:canonical',
      })
    ).id,
    name: 'Pelé',
    sourceText: `${SOURCE} Run ${++n}.`,
    sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9',
    sectionKey: `v7-${n}`,
    facts: 'born 1940-10-23',
  });
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    const repo = new BaseRepository(h.db);
    const actor = { userId: null, name: 'test', via: 'system:canonical' } as const;
    const [tier] = await h.db.select().from(championTiers).limit(1);
    tierId = tier?.id ?? (await repo.insert(championTiers, { slug: 'champion', sortOrder: 1 } as never, actor)).id;
  });
  afterAll(() => h.close());

  it('cites sentence IDs under a JSON Schema; the code stores the exact sentences as evidence quotes', async () => {
    const m = fakeModel(() => bio(ORIGINAL));
    const r = await runBiography(h.db, m.provider, [await item()]);
    expect(r).toMatchObject({ accepted: 1, proposals: 0, invocations: 1 });
    const schema = m.bioOptions[0]!.schema as { properties: { claims: { maxItems: number; items: { properties: { evidence: { enum: string[] } } } } } };
    expect(schema.properties.claims.maxItems).toBe(6);
    expect(schema.properties.claims.items.properties.evidence.enum).toEqual(['S1', 'S2', 'S3', 'S4', 'F1']);
    expect(m.bioPrompts[0]).toContain('[S2] He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.');
    expect(m.factPrompts[0]).toContain('C1: three World Cups — cites [S2]: "He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil."');
    const q = await lastQueued(h);
    expect((q!.resultJson as { claims: unknown[] }).claims).toEqual([
      { text: 'three World Cups', evidence_id: 'S2', evidence_quote: 'He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.', literal: true },
      { text: 'played for Santos', evidence_id: 'S3', evidence_quote: 'He played for Santos from 1956 to 1974.', literal: true },
    ]);
  });

  it('a copied 12-word run is rewritten once (the prompt names the run) before anything is queued', async () => {
    const m = fakeModel((prompt) => bio(prompt.includes('CORRECTION: your previous bio_en copied this run') ? ORIGINAL : COPIED));
    const r = await runBiography(h.db, m.provider, [await item()]);
    expect(r).toMatchObject({ accepted: 1, proposals: 0, invocations: 2 });
    expect(m.bioPrompts[1]).toContain('copied this run of words from SOURCE: "he won the fifa world cup in 1958, 1962 and 1970 with"');
    expect(m.factPrompts).toHaveLength(1);
  });

  it('a bio still copied after the rewrite is queued at level 2, never fact-checked', async () => {
    const m = fakeModel(() => bio(COPIED));
    const r = await runBiography(h.db, m.provider, [await item()]);
    expect(r).toMatchObject({ accepted: 0, proposals: 1, rejected: 0, invocations: 2 });
    expect(m.factPrompts).toHaveLength(0);
    const q = await lastQueued(h);
    expect(q).toMatchObject({ status: 'pending', resultJson: { copied: true, level: 2 } });
  });

  it('an unsupported claim regenerates once with the claim named in the correction', async () => {
    const fact = {
      claims: [
        { claim: 'C1', evidence: 'S2', status: 'supported' },
        { claim: 'C2', evidence: 'S3', status: 'unsupported' },
      ],
    };
    const m = fakeModel(() => bio(ORIGINAL), fact);
    const r = await runBiography(h.db, m.provider, [await item()]);
    expect(r).toMatchObject({ accepted: 0, proposals: 1, invocations: 2 });
    expect(m.bioPrompts[1]).toContain('CORRECTION: the sentences you cited do not state these claims: "played for Santos"');
  });

  it('a near-literal quote text is replaced by the exact source span (tolerant comparison)', async () => {
    const m = fakeModel(() => ({
      ...bio(ORIGINAL),
      claims: [
        { text: 'three World Cups', evidence: 'he won the FIFA World Cup in 1958, 1962, and 1970 with Brazil' },
        { text: 'played for Santos', evidence: 'S3' },
      ],
    }));
    expect(await runBiography(h.db, m.provider, [await item()])).toMatchObject({ accepted: 1 });
    expect((await lastBio(h)).evidence).toEqual(['He won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.', 'He played for Santos from 1956 to 1974.']);
  });

  it('pilot-only candidates: a second candidate samples with another seed and wins when the first fails', async () => {
    const m = fakeModel((_prompt, k) => bio(k <= 2 ? COPIED : ORIGINAL));
    const r = await runBiography(h.db, m.provider, [await item()], { candidates: 2 });
    expect(r).toMatchObject({ accepted: 1, proposals: 0, invocations: 3 });
    expect(m.bioOptions[0]).not.toHaveProperty('temperature');
    expect(m.bioOptions[2]).toMatchObject({ temperature: 0.7 });
    expect(typeof m.bioOptions[2]!.seed).toBe('number');
  });
});

const lastQueued = async (h: DatabaseHandle) => {
  const rows = await h.db.select().from(aiExtractionQueue).where(eq(aiExtractionQueue.sectionKey, 'biography'));
  return rows.sort((a, b) => (a.id < b.id ? -1 : 1)).at(-1)!;
};

const lastBio = async (h: DatabaseHandle) => {
  const rows = await h.db.select().from(aiInvocations).where(eq(aiInvocations.task, 'biography'));
  return rows.sort((a, b) => (a.id < b.id ? -1 : 1)).at(-1)!;
};
