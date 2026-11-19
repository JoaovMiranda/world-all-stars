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
