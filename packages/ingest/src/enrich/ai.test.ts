import { aiExtractionQueue, aiInvocations, createDatabase, type DatabaseHandle } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { type AiProvider, aiReport, quoteExists, quoteSupports, runEnrichment } from './ai';

const SOURCE = 'Edson Arantes do Nascimento, known as Pelé, won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.';
const fake = (output: unknown): AiProvider => ({ provider: 'fake', model: 'fake-1', version: '1', generate: async () => ({ output, tokensIn: 100, tokensOut: 20 }) });

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
    const r = await runEnrichment(h.db, fake({ facts: [
      { field: 'title', value: 'FIFA World Cup', year: 1958, evidence_quote: 'won the FIFA World Cup in 1958, 1962 and 1970' },
      { field: 'title', value: 'Copa América', year: 1959, evidence_quote: 'he also won the Copa América in 1959 for Brazil' },
    ] }), [{ entityId: '00000000-0000-7000-8000-000000000001', name: 'Pelé', sourceText: SOURCE, sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9', sectionKey: 'lead' }]);
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
    const r = await runEnrichment(h.db, fake({ nope: true }), [{ entityId: '00000000-0000-7000-8000-000000000002', name: 'X', sourceText: SOURCE, sourceUrl: 'https://en.wikipedia.org/wiki/X', sectionKey: 'lead' }]);
    expect(r.proposals).toBe(0);
  });
});

import { aiExtractionQueue as queueTable } from '@was/db';
import { BaseRepository, athleteTranslations, athletes, championTiers, fieldProvenance } from '@was/db';
import { eq as eqOp } from 'drizzle-orm';

import { copiesSource, runBiography } from './ai';

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
  const item = { entityId: '', name: 'Pelé', sourceText: SOURCE, sourceUrl: 'https://en.wikipedia.org/wiki/Pel%C3%A9', sectionKey: 'article', facts: 'titles: FIFA World Cup 1958' };
  const bio = (en: string, quote: string) => ({ bio_en: en, bio_pt: `${en} (pt)`, bio_es: `${en} (es)`, claims: [{ text: 'world cups', evidence_quote: quote }, { text: 'nickname', evidence_quote: 'Edson Arantes do Nascimento, known as Pelé' }] });

  it('auto-accepts an original bio whose claims quote the source literally (Fase 13 §1.1)', async () => {
    const r = await runBiography(h2.db, fake(bio('Pelé is a Brazilian footballer who lifted three world titles with his national team.', 'won the FIFA World Cup in 1958, 1962 and 1970')), [item]);
    expect(r).toMatchObject({ accepted: 1, proposals: 0, rejected: 0 });
    const [q] = await h2.db.select().from(queueTable).where(eqOp(queueTable.sectionKey, 'biography'));
    expect(q).toMatchObject({ status: 'approved', resultJson: { type: 'biography', copied: false, level: 3 } });
    const bios = await h2.db.select().from(athleteTranslations).where(eqOp(athleteTranslations.athleteId, item.entityId));
    expect(bios.map((b) => b.locale).sort()).toEqual(['en', 'es', 'pt-BR']);
    const [prov] = await h2.db.select().from(fieldProvenance).where(eqOp(fieldProvenance.entityId, item.entityId));
    expect(prov).toMatchObject({ reviewStatus: 'auto_accepted', extractionMethod: 'ai', approvedBy: null, isCurrent: true });
  });

  it('rejects invented quotes; flags copied text', async () => {
    const invented = { bio_en: 'Pelé is a Brazilian footballer who lifted several world titles in his long career.', bio_pt: 'x'.repeat(50), bio_es: 'y'.repeat(50), claims: [{ text: 'a', evidence_quote: 'he won five World Cups for Brazil' }, { text: 'b', evidence_quote: 'he scored two thousand goals in total' }] };
    expect((await runBiography(h2.db, fake(invented), [{ ...item, sourceText: `${SOURCE} (revised)` }])).rejected).toBe(1);
    expect(copiesSource('known as Pelé, won the FIFA World Cup in 1958, 1962 and 1970 with Brazil.', SOURCE)).toBe(true);
  });
});
