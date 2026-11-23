// Fase 13 §1.4: first collection of a list produces complete profiles with no approval click, and an update right
// after calls the model 0 times. Network and model are fakes (no Wikipedia, no Ollama).
import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase } from '@was/db';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { firstCollect, updateCollect } from './collect';
import type { AiProvider } from './enrich/ai-provider.interface';
import type { SafeFetcher } from './http/safe-fetcher';
import { parseAthleteList } from './providers/athlete-list.provider';
import { createContext } from './providers/context';

const PEOPLE = ['Cafu', 'Zico', 'Ghost Person'];
const article = (t: string) =>
  `${t} is a Brazilian former professional footballer. ${t} won the FIFA World Cup with Brazil and played for many clubs over a long career in Europe and South America.`;

const fakeFetcher = (calls: string[]) =>
  ({
    async get(url: string) {
      calls.push(url);
      const u = new URL(url);
      const p = u.searchParams;
      const titles = (p.get('titles') ?? '').split('|');
      const json = (body: unknown) => ({
        url,
        finalUrl: url,
        status: 200,
        contentType: 'application/json',
        bytes: Buffer.from(JSON.stringify(body)),
        fromCache: false,
      });
      if (u.host === 'www.wikidata.org') {
        if (p.get('sites') === 'enwiki')
          return json({
            entities: Object.fromEntries(
              titles.filter((t) => t !== 'Ghost Person').map((t, i) => [`Q${100 + i}`, { id: `Q${100 + i}`, sitelinks: { enwiki: { title: t } }, claims: {} }]),
            ),
          });
        return json({
          entities: Object.fromEntries(
            (p.get('ids') ?? '').split('|').map((id) => [id, { id, descriptions: { en: { value: 'Brazilian footballer' } }, claims: {} }]),
          ),
        });
      }
      if (p.get('prop') === 'pageprops')
        return json({ query: { pages: titles.map((t) => (t === 'Ghost Person' ? { title: t, missing: true } : { title: t })) } });
      if (p.get('prop') === 'revisions') return json({ query: { pages: titles.map((t) => ({ title: t, revisions: [{ revid: 7 }] })) } });
      return json({ query: { pages: [{ title: titles[0], extract: article(titles[0]!), revisions: [{ revid: 7 }] }] } });
    },
  }) as unknown as SafeFetcher;

let modelCalls = 0;
const calledFor: string[] = [];
const model: AiProvider = {
  provider: 'fake',
  model: 'fake-1',
  version: '1',
  async generate(prompt) {
    modelCalls++;
    const name = PEOPLE.find((n) => prompt.includes(`${n} is a Brazilian`)) ?? 'Someone';
    calledFor.push(name);
    return {
      output: {
        bio_en: `${name} is remembered as a Brazilian world champion whose career crossed two continents.`,
        bio_pt: 'pt '.repeat(20),
        bio_es: 'es '.repeat(20),
        claims: [
          { text: 'world cup', evidence_quote: `${name} won the FIFA World Cup with Brazil` },
          { text: 'nationality', evidence_quote: 'is a Brazilian former professional footballer' },
        ],
      },
      tokensIn: 10,
      tokensOut: 10,
    };
  },
};

describe('autonomous collection (Fase 13)', () => {
  let h: DatabaseHandle;
  const calls: string[] = [];
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    await seedDatabase(h.db, findRepoRoot());
  }, 120_000);
  afterAll(() => h.close());
  const n = async (q: string) => ((await h.db.execute(sql.raw(q))) as unknown as { rows: { n: number }[] }).rows[0]!.n;

  it('parses names, CSV lines and Wikipedia links', () => {
    expect(parseAthleteList('name,sport\nCafu,football\nhttps://en.wikipedia.org/wiki/Zico_(footballer)\n# note', 'football')).toEqual([
      { name: 'Cafu', sport: 'football' },
      { name: 'Zico (footballer)', sport: 'football' },
    ]);
  });

  it('firstCollect: list → public profiles with an auto-accepted bio, no approval click', async () => {
    const ctx = createContext(h.db, { fetcher: fakeFetcher(calls) });
    const r = await firstCollect(ctx, model, parseAthleteList(PEOPLE.join('\n'), 'football'));
    expect(r.missing).toEqual(['Ghost Person']);
    expect(r.people).toBe(2);
    expect(r.biography).toMatchObject({ accepted: 2, proposals: 0 });
    expect(modelCalls).toBe(2);
    expect(
      await n("select count(*)::int n from competitors c join athletes a on a.id = c.id where a.slug in ('cafu','zico') and c.profile_visibility = 'public'"),
    ).toBe(2);
    expect(
      await n(
        "select count(*)::int n from field_provenance where field_name = 'short_bio' and extraction_method = 'ai' and review_status = 'auto_accepted' and created_via = 'system:enrich' and is_current",
      ),
    ).toBe(2);
    expect(await n("select count(*)::int n from ai_extraction_queue where section_key = 'biography' and status = 'pending'")).toBe(0);
  });

  it('update right after: 0 model calls (unchanged revids)', async () => {
    calledFor.length = 0;
    const r = await updateCollect(createContext(h.db, { fetcher: fakeFetcher(calls) }), model);
    // Cafu and Zico were just written from revid 7: the model is not called for them again.
    expect(calledFor.filter((x) => x === 'Cafu' || x === 'Zico')).toEqual([]);
    expect(r.skippedUnchanged).toBeGreaterThanOrEqual(2);
  });

  it('without a model: profiles are collected and marked needs_enrichment', async () => {
    const r = await firstCollect(createContext(h.db, { fetcher: fakeFetcher(calls) }), null, parseAthleteList('Zico', 'football'));
    expect(r).toMatchObject({ biography: null, needsEnrichment: 1 });
  });
});
