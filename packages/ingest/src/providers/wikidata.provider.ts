// Provider `wikidata` (handoff v3 §6.5): enriches people that already have a Wikipedia title — QID through the
// enwiki SITELINK (never built from the name), birth date (P569), gender (P21). CC0, batches of 50, polite.
// Writes `evidence` observations; the canonical writer applies them under the SoT rules (Wikidata = birth, ids).
import { type Database, active, athletes, entityExternalIds } from '@was/db';
import { InformationKind } from '@was/shared';
import { and, eq } from 'drizzle-orm';

import type { IngestContext } from './context';

export const WIKIDATA_PROVIDER = 'wikidata';
const PARSER = { key: 'wikidata-entity', version: '1' };
const GENDER: Record<string, 'male' | 'female'> = { Q6581097: 'male', Q6581072: 'female', Q1052281: 'female', Q2449503: 'male' };

interface WdEntity {
  id: string;
  sitelinks?: { enwiki?: { title: string } };
  claims?: Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
}

/** Facts of one entity (pure: exported for tests with a fixture). */
export const wikidataFacts = (e: WdEntity) => {
  const time = (e.claims?.P569?.[0]?.mainsnak.datavalue?.value as { time?: string; precision?: number } | undefined) ?? undefined;
  const birth = time?.time && (time.precision ?? 0) >= 11 ? time.time.replace(/^\+/, '').slice(0, 10) : null;
  const birthYear = time?.time ? Number(time.time.replace(/^\+/, '').slice(0, 4)) : null;
  const genderId = (e.claims?.P21?.[0]?.mainsnak.datavalue?.value as { id?: string } | undefined)?.id;
  return { qid: e.id, title: e.sitelinks?.enwiki?.title ?? null, birthDate: birth, birthYear, gender: genderId ? (GENDER[genderId] ?? null) : null };
};

/** Titles of people without a QID yet (the work list). */
export const peopleToEnrich = async (db: Database, limit = 500) => {
  const titles = await db.select({ entityId: entityExternalIds.entityId, title: entityExternalIds.externalId }).from(entityExternalIds).where(active(entityExternalIds, eq(entityExternalIds.provider, 'wikipedia_en')));
  const qids = new Set((await db.select({ id: entityExternalIds.entityId }).from(entityExternalIds).where(active(entityExternalIds, eq(entityExternalIds.provider, 'wikidata')))).map((r) => r.id));
  const people = new Set((await db.select({ id: athletes.id }).from(athletes).where(and(active(athletes)))).map((r) => r.id));
  return titles.filter((t) => people.has(t.entityId) && !qids.has(t.entityId)).slice(0, limit);
};

export const runWikidata = async (ctx: IngestContext, opts: { limit?: number | undefined } = {}) => {
  const todo = await peopleToEnrich(ctx.db, opts.limit ?? 500);
  let found = 0;
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: 'wbgetentities', sites: 'enwiki', titles: batch.map((b) => b.title).join('|'), props: 'sitelinks|claims', sitefilter: 'enwiki', redirects: 'yes', format: 'json' })}`;
    let doc: Awaited<ReturnType<IngestContext['document']>> = null;
    for (let attempt = 0; attempt < 4 && !doc; attempt++) {
      try {
        doc = await ctx.document('wikidata', url);
      } catch (error) {
        const wait = (error as { retryAfterMs?: number }).retryAfterMs;
        if (!wait || attempt === 3) throw error;
        ctx.log(`wikidata: rate limited, waiting ${Math.round(wait / 1000)} s (Retry-After)`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    if (!doc) continue;
    const entities = Object.values((JSON.parse(doc.text) as { entities?: Record<string, WdEntity> }).entities ?? {}).filter((e) => e.id?.startsWith('Q'));
    for (const e of entities) {
      const f = wikidataFacts(e);
      const person = batch.find((b) => b.title === f.title);
      if (!person) continue;
      found++;
      const evidence = (field: string, value: string | number | null) =>
        value !== null &&
        ctx.observe(doc.documentId, WIKIDATA_PROVIDER, PARSER, `${f.qid}:${field}`, field === 'wikidata' ? InformationKind.ExternalId : field === 'gender' ? InformationKind.Identity : InformationKind.Birth, {
          contract: 'evidence',
          record: { informationKind: field === 'wikidata' ? InformationKind.ExternalId : field === 'gender' ? InformationKind.Identity : InformationKind.Birth, field: `${person.entityId}:${field}`, value: { original: String(value), value, unit: null }, evidence: { quote: null, section: f.qid } },
        });
      await evidence('wikidata', f.qid);
      await evidence('birth_date', f.birthDate);
      await evidence('birth_year', f.birthYear);
      await evidence('gender', f.gender);
    }
  }
  return [`wikidata: ${todo.length} people looked up, ${found} resolved through enwiki sitelinks`];
};
