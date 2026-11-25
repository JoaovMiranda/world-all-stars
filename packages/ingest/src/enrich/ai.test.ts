import { aiExtractionQueue, aiInvocations, createDatabase, type DatabaseHandle } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AiProvider } from './ai-provider.interface';
import { aiReport } from './ai-report.helper';
import { quoteExists, quoteSupports } from './evidence.helper';
import { runEnrichment } from './run-enrichment.service';

const SOURCE = 'Edson Arantes do Nascimento, known as Pelé, won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.';
const fake = (output: unknown): AiProvider => ({
  provider: 'fake',
  model: 'fake-1',
  version: '1',
  generate: async (prompt) => ({
    output: prompt.includes('Validate each proposed biography claim')
      ? {
          claims: [
            { text: 'world cups', status: 'supported', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
            { text: 'nickname', status: 'supported', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' },
          ],
        }
      : output,
    tokensIn: 100,
    tokensOut: 20,
  }),
});

describe('AI layer (D03/D04)', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
  });
  afterAll(() => h.close());

  it('level 2 needs the literal quote; level 3 needs the value inside the quote', () => {
    expect(quoteExists('won the FIFA World Cup in  1958', SOURCE)).toBe(true);
    expect(quoteExists('won five World Cups', SOURCE)).toBe(false);
    expect(quoteSupports({ field: 'title', value: 'FIFA World Cup', year: 1958, evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' })).toBe(true);
    expect(quoteSupports({ field: 'title', value: 'Copa América', year: 1958, evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' })).toBe(false);
  });

  it('without a provider the pipeline goes on (skipped)', async () => {
    expect((await runEnrichment(h.db, null, [])).skipped).toBe(true);
  });

  it('records every invocation; only facts with a literal quote reach the human queue (never canonical)', async () => {
    const r = await runEnrichment(
      h.db,
      fake({
        facts: [
          { field: 'title', value: 'FIFA World Cup', year: 1958, evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
          { field: 'title', value: 'Copa América', year: 1959, evidence_quote: 'he also won the Copa América in 1959 for Brazil' },
        ],
      }),
      [
        {
          entityId: '00000000-0000-7000-8000-000000000001',
          name: 'Pelé',
          sourceText: SOURCE,
          sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9',
          sectionKey: 'lead',
        },
      ],
    );
    expect(r).toMatchObject({ invocations: 1, proposals: 1, rejected: 1 });
    const [inv] = await h.db.select().from(aiInvocations);
    expect(inv).toMatchObject({ status: 'ok', tokensIn: 100, tokensOut: 20, validationLevel: 1 });
    const queued = await h.db.select().from(aiExtractionQueue);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.status).toBe('pending');
    const report = await aiReport(h.db);
    expect(report[0]).toMatchObject({ provider: 'fake', model: 'fake-1', calls: 1, tokens: 120 });
  });

  it('invalid JSON from the model is level 0: recorded, nothing queued', async () => {
    const r = await runEnrichment(h.db, fake({ nope: true }), [
      { entityId: '00000000-0000-7000-8000-000000000002', name: 'X', sourceText: SOURCE, sourceUrl: 'https://en.wikipedia.org/wiki/X', sectionKey: 'lead' },
    ]);
    expect(r.proposals).toBe(0);
  });
});

import { athletes, athleteTranslations, BaseRepository, championTiers, fieldProvenance, aiExtractionQueue as queueTable } from '@was/db';
import { eq as eqOp } from 'drizzle-orm';

import { biographyPrompt } from './biography-prompt.helper';
import { copiesSource } from './evidence.helper';
import { numberCorpus } from './numbered-corpus.helper';
import { runBiography } from './run-biography.service';
import { runFactCheck } from './run-fact-check.service';

describe('Biography Enricher (§7.2 task 3)', () => {
  let h2: DatabaseHandle;
  beforeAll(async () => {
    h2 = await createDatabase({ pgliteDataDir: 'memory://' });
    await h2.migrate();
    const repo = new BaseRepository(h2.db);
    const actor = { userId: null, name: 'test', via: 'system:canonical' } as const;
    const [tier] = await h2.db.select().from(championTiers).limit(1);
    const tierId = tier?.id ?? (await repo.insert(championTiers, { slug: 'champion', sortOrder: 1 } as never, actor)).id;
    item.entityId = (await repo.insert(athletes, { slug: 'pele', knownAs: 'Pelé', status: 'unknown', championTierId: tierId } as never, actor)).id;
  });
  afterAll(() => h2.close());
  const item = {
    entityId: '',
    name: 'Pelé',
    sourceText: SOURCE,
    sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9',
    sectionKey: 'article',
    facts: 'titles: FIFA World Cup 1958',
  };
  const bio = (en: string, quote: string) => ({
    bio_en: en,
    bio_pt: `${en} (pt)`,
    bio_es: `${en} (es)`,
    claims: [
      { text: 'world cups', evidence_quote: quote },
      { text: 'nickname', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' },
    ],
  });

  it('auto-accepts an original bio whose claims quote the source literally (Phase 13 §1.1)', async () => {
    const r = await runBiography(
      h2.db,
      fake(bio('Pelé is a Brazilian footballer who lifted three world titles with his national team.', 'won the FIFA World Cup in 1958, 1962 and 1970')),
      [item],
    );
    expect(r).toMatchObject({ accepted: 1, proposals: 0, rejected: 0 });
    const [q] = await h2.db.select().from(queueTable).where(eqOp(queueTable.sectionKey, 'biography'));
    expect(q).toMatchObject({ status: 'approved', resultJson: { type: 'biography', copied: false, level: 3 } });
    const bios = await h2.db.select().from(athleteTranslations).where(eqOp(athleteTranslations.athleteId, item.entityId));
    expect(bios.map((b) => b.locale).sort()).toEqual(['en', 'es', 'pt-BR']);
    const [prov] = await h2.db.select().from(fieldProvenance).where(eqOp(fieldProvenance.entityId, item.entityId));
    expect(prov).toMatchObject({ reviewStatus: 'auto_accepted', extractionMethod: 'ai', approvedBy: null, isCurrent: true });
  });

  it('rejects invented quotes; flags copied text', async () => {
    const invented = {
      bio_en: 'Pelé is a Brazilian footballer who lifted several world titles in his long career.',
      bio_pt: 'x'.repeat(50),
      bio_es: 'y'.repeat(50),
      claims: [
        { text: 'a', evidence_quote: 'he won five World Cups for Brazil' },
        { text: 'b', evidence_quote: 'he scored two thousand goals in total' },
      ],
    };
    expect((await runBiography(h2.db, fake(invented), [{ ...item, sourceText: `${SOURCE} (revised)` }])).rejected).toBe(1);
    expect(copiesSource('known as Pelé, won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.', SOURCE)).toBe(true);
  });
});

describe('biography prompt rules (T1.6)', () => {
  const prompt = biographyPrompt('Pelé', numberCorpus(SOURCE, 'titles: FIFA World Cup 1958'));

  it('numbers SOURCE and FACTS, asks for sentence IDs (never quotes), at most 6 claims, the schema and no 12-word run', () => {
    expect(prompt).toContain('Write only the ID in "evidence", never quoted text');
    expect(prompt).toContain('at most 6 claims');
    expect(prompt).toContain('{"claims":[{"text":"string","evidence":"S1"}],"bio_en":"string","bio_pt":"string","bio_es":"string"}');
    expect(prompt).toContain('must not reuse any run of 12 consecutive words from SOURCE');
    expect(prompt).toContain(`--- SOURCE ---\n[S1] ${SOURCE}`);
    expect(prompt).toContain('--- FACTS ---\n[F1] titles: FIFA World Cup 1958');
  });

  it('flags a reused run of 12 words, ignoring case and whitespace, but not an 11-word run', () => {
    const twelve = 'Edson Arantes do Nascimento, known as Pelé, won the FIFA World Cup';
    const eleven = 'Edson Arantes do Nascimento, known as Pelé, won the FIFA World';
    expect(copiesSource(`Born in Brazil, ${twelve.toUpperCase().replace(/ /g, '  ')} three times.`, SOURCE)).toBe(true);
    expect(copiesSource(`${eleven} trophy three times.`, SOURCE)).toBe(false);
  });
});

describe('Fact validator stage (T1.7)', () => {
  let h3: DatabaseHandle;
  let entityId = '';
  beforeAll(async () => {
    h3 = await createDatabase({ pgliteDataDir: 'memory://' });
    await h3.migrate();
    const repo = new BaseRepository(h3.db);
    const actor = { userId: null, name: 'test', via: 'system:canonical' } as const;
    const [tier] = await h3.db.select().from(championTiers).limit(1);
    const tierId = tier?.id ?? (await repo.insert(championTiers, { slug: 'champion', sortOrder: 1 } as never, actor)).id;
    entityId = (await repo.insert(athletes, { slug: 'pele-retry', knownAs: 'Pelé', status: 'unknown', championTierId: tierId } as never, actor)).id;
  });
  afterAll(() => h3.close());

  const proposal = (en: string) => ({
    bio_en: en,
    bio_pt: `${en} pt`,
    bio_es: `${en} es`,
    claims: [
      { text: 'world cups', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
      { text: 'nickname', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' },
    ],
  });

  it('regenerates the biography once when a claim is unsupported, then auto-accepts', async () => {
    let factCalls = 0;
    const provider: AiProvider = {
      provider: 'fake',
      model: 'fake-retry',
      version: '1',
      async generate(prompt) {
        if (prompt.includes('Validate each proposed biography claim')) {
          factCalls++;
          return {
            output: {
              claims: [
                { text: 'world cups', status: 'supported', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
                { text: 'nickname', status: factCalls > 1 ? 'supported' : 'unsupported', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' },
              ],
            },
            tokensIn: 1,
            tokensOut: 1,
          };
        }
        return { output: proposal('The striker collected three world titles across three different decades of his career.'), tokensIn: 1, tokensOut: 1 };
      },
    };
    const r = await runBiography(h3.db, provider, [
      { entityId, name: 'Pelé', sourceText: SOURCE, sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9', sectionKey: 'retry-ok', facts: '' },
    ]);
    expect(r).toMatchObject({ accepted: 1, proposals: 0 });
    expect(factCalls).toBe(2);
    const logged = await h3.db.select().from(aiInvocations);
    expect(logged.filter((i) => i.task === 'biography')).toHaveLength(2);
    const factLog = logged.filter((i) => i.task === 'fact-check');
    expect(factLog.map((i) => i.validationLevel).sort()).toEqual([3, 4]);
    expect(factLog.every((i) => i.status === 'ok')).toBe(true);
  });

  it('leaves the proposal in the exception queue when the regenerated text also fails', async () => {
    const provider: AiProvider = {
      provider: 'fake',
      model: 'fake-retry',
      version: '1',
      async generate(prompt) {
        if (prompt.includes('Validate each proposed biography claim'))
          return {
            output: {
              claims: [
                { text: 'world cups', status: 'unsupported', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
                { text: 'nickname', status: 'unsupported', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' },
              ],
            },
            tokensIn: 1,
            tokensOut: 1,
          };
        return { output: proposal('A forward who became a reference for a whole generation of Brazilian players.'), tokensIn: 1, tokensOut: 1 };
      },
    };
    const r = await runBiography(h3.db, provider, [
      {
        entityId,
        name: 'Pelé',
        sourceText: `${SOURCE} Yet another source text.`,
        sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9',
        sectionKey: 'retry-queue',
        facts: '',
      },
    ]);
    expect(r).toMatchObject({ accepted: 0, proposals: 1, rejected: 0 });
    const queued = await h3.db.select().from(queueTable).where(eqOp(queueTable.sectionKey, 'biography'));
    expect(queued.some((q) => q.status === 'pending')).toBe(true);
  });

  it('a copied bio stays at level 2: queued for review, never fact-checked', async () => {
    let factCalls = 0;
    const provider: AiProvider = {
      provider: 'fake',
      model: 'fake-copy',
      version: '1',
      async generate(prompt) {
        if (prompt.includes('Validate each proposed biography claim')) factCalls++;
        return { output: proposal(`Born in Brazil, ${SOURCE}`), tokensIn: 1, tokensOut: 1 };
      },
    };
    const r = await runBiography(h3.db, provider, [
      { entityId, name: 'Pelé', sourceText: `${SOURCE} Copied.`, sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9', sectionKey: 'copied', facts: '' },
    ]);
    expect(r).toMatchObject({ accepted: 0, proposals: 1, rejected: 0 });
    expect(factCalls).toBe(0);
    const queued = await h3.db.select().from(queueTable).where(eqOp(queueTable.sectionKey, 'biography'));
    const copied = queued.filter((q) => (q.resultJson as { copied?: boolean }).copied);
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({ status: 'pending', resultJson: { copied: true, level: 2 } });
  });

  it('an unusable regeneration sends the first proposal to the exception queue', async () => {
    let bioCalls = 0;
    const provider: AiProvider = {
      provider: 'fake',
      model: 'fake-bad-retry',
      version: '1',
      async generate(prompt) {
        if (prompt.includes('Validate each proposed biography claim'))
          return {
            output: { claims: [{ text: 'world cups', status: 'unsupported', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' }] },
            tokensIn: 1,
            tokensOut: 1,
          };
        bioCalls++;
        return {
          output: bioCalls === 1 ? proposal('A forward whose three world titles spanned twelve years of international play.') : { nope: true },
          tokensIn: 1,
          tokensOut: 1,
        };
      },
    };
    const r = await runBiography(h3.db, provider, [
      { entityId, name: 'Pelé', sourceText: `${SOURCE} Bad retry.`, sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9', sectionKey: 'bad-retry', facts: '' },
    ]);
    expect(r).toMatchObject({ accepted: 0, proposals: 1, rejected: 0 });
    expect(bioCalls).toBe(2);
  });

  it('the fact-check answer is audited: a non-literal quote counts as unsupported, a bad shape as invalid', async () => {
    const answer = (output: unknown): AiProvider => ({
      provider: 'fake',
      model: 'fake-fc',
      version: '1',
      generate: async () => ({ output, tokensIn: 1, tokensOut: 1 }),
    });
    const claims = [{ text: 'world cups', evidence_id: null, evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' }];
    const corpus = numberCorpus(SOURCE, '');
    const invented = { claims: [{ text: 'world cups', status: 'supported', evidence_quote: 'he won five World Cups with Brazil' }] };
    expect((await runFactCheck(answer(invented), claims, corpus)).status).toBe('unsupported');
    expect((await runFactCheck(answer({ claims: [] }), claims, corpus)).status).toBe('invalid');
    const literal = { claims: [{ text: 'world cups', status: 'supported', evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' }] };
    expect((await runFactCheck(answer(literal), claims, corpus)).status).toBe('supported');
  });
});
