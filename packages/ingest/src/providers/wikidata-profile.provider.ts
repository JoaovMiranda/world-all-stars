// Provider `wikidata-profile` (handoff v3 §6.5): the PROFILE of every athlete with a QID, from Wikidata (CC0) and
// Wikimedia Commons (photo by link only, with author and license): short description (en/pt-BR/es), full name, birth
// place, death, height, position, clubs with periods, career span and photo. Writes `evidence` observations; the
// canonical writer fills only empty fields (curated data wins; a different value opens a conflict).
import { active, entityExternalIds } from '@was/db';
import { InformationKind } from '@was/shared';
import { eq } from 'drizzle-orm';

import type { IngestContext } from './context';

export const WIKIDATA_PROFILE_PROVIDER = 'wikidata-profile';
const PARSER = { key: 'wikidata-profile', version: '1' };
const LANGS = ['en', 'pt', 'es'] as const;

type Snak = { mainsnak: { datavalue?: { value: unknown } }; qualifiers?: Record<string, { datavalue?: { value: unknown } }[]> };
interface WdEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Snak[]>;
}

const value = <T>(s: Snak | undefined) => s?.mainsnak.datavalue?.value as T | undefined;
const itemId = (s: Snak | undefined) => value<{ id?: string }>(s)?.id;
const time = (v: { time?: string; precision?: number } | undefined) => (v?.time ? { year: Number(v.time.replace(/^\+/, '').slice(0, 4)), date: (v.precision ?? 0) >= 11 ? v.time.replace(/^\+/, '').slice(0, 10) : null } : null);
const qualTime = (s: Snak, p: string) => time(s.qualifiers?.[p]?.[0]?.datavalue?.value as { time?: string; precision?: number } | undefined);

/** Profile facts of one entity (pure: exported for tests). */
export const profileFacts = (e: WdEntity) => {
  const c = e.claims ?? {};
  const height = value<{ amount?: string; unit?: string }>(c.P2048?.[0]);
  const heightCm = height?.amount ? Math.round(Number(height.amount) * (height.unit?.endsWith('Q11573') ? 100 : 1)) : null;
  return {
    qid: e.id,
    description: Object.fromEntries(LANGS.map((l) => [l, e.descriptions?.[l]?.value ?? null])) as Record<(typeof LANGS)[number], string | null>,
    fullName: value<{ text?: string }>(c.P1477?.[0])?.text ?? null,
    birthPlace: itemId(c.P19?.[0]) ?? null,
    death: time(value(c.P570?.[0])),
    heightCm: heightCm && heightCm > 100 && heightCm < 250 ? heightCm : null,
    position: itemId(c.P413?.[0]) ?? null,
    image: value<string>(c.P18?.[0]) ?? null,
    careerStart: time(value(c.P2031?.[0]))?.year ?? null,
    careerEnd: time(value(c.P2032?.[0]))?.year ?? null,
    clubs: (c.P54 ?? []).flatMap((s) => {
      const id = itemId(s);
      return id ? [{ qid: id, from: qualTime(s, 'P580')?.year ?? null, to: qualTime(s, 'P582')?.year ?? null }] : [];
    }),
  };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runWikidataProfile = async (ctx: IngestContext, opts: { limit?: number | undefined } = {}) => {
  const people = (await ctx.db.select({ entityId: entityExternalIds.entityId, qid: entityExternalIds.externalId }).from(entityExternalIds).where(active(entityExternalIds, eq(entityExternalIds.provider, 'wikidata'))))
    .filter((p) => /^Q\d+$/.test(p.qid))
    .slice(0, opts.limit ?? 5000);
  const get = async (source: string, url: string) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await ctx.document(source, url);
      } catch (error) {
        const wait = (error as { retryAfterMs?: number }).retryAfterMs;
        if (!wait || attempt === 4) throw error;
        ctx.log(`${source}: rate limited, waiting ${Math.round(wait / 1000)} s`);
        await sleep(wait);
      }
    }
    return null;
  };
  const entities = new Map<string, WdEntity>();
  const fetchEntities = async (ids: string[], props: string) => {
    for (let i = 0; i < ids.length; i += 50) {
      const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props, languages: LANGS.join('|'), format: 'json' })}`;
      const doc = await get('wikidata', url);
      if (!doc) continue;
      for (const e of Object.values((JSON.parse(doc.text) as { entities?: Record<string, WdEntity> }).entities ?? {})) entities.set(e.id, { ...e, ...{ docId: doc.documentId } });
    }
  };
  await fetchEntities(people.map((p) => p.qid), 'labels|descriptions|claims');
  const facts = people.flatMap((p) => {
    const e = entities.get(p.qid);
    return e ? [{ person: p, f: profileFacts(e), documentId: (e as unknown as { docId: string }).docId }] : [];
  });
  // Labels (en/pt/es) of the places, positions and clubs referenced by the profiles.
  const refs = [...new Set(facts.flatMap(({ f }) => [f.birthPlace, f.position, ...f.clubs.map((c) => c.qid)].filter((x): x is string => !!x)))].filter((q) => !entities.has(q));
  await fetchEntities(refs, 'labels');
  const labels = (q: string | null) => (q ? Object.fromEntries(LANGS.map((l) => [l, entities.get(q)?.labels?.[l]?.value ?? null])) : null);
  // Photo metadata (author, license, thumbnail) from Commons: link only, nothing stored.
  const images = [...new Set(facts.map(({ f }) => f.image).filter((x): x is string => !!x))];
  const commons = new Map<string, { url: string; thumb: string; page: string; author: string | null; license: string | null }>();
  for (let i = 0; i < images.length; i += 50) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: 'query', titles: images.slice(i, i + 50).map((n) => `File:${n}`).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '500', format: 'json' })}`;
    const doc = await get('commons', url);
    if (!doc) continue;
    const pages = (JSON.parse(doc.text) as { query?: { pages?: Record<string, { title: string; imageinfo?: { url: string; thumburl?: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }> } }).query?.pages ?? {};
    for (const pg of Object.values(pages)) {
      const info = pg.imageinfo?.[0];
      if (!info) continue;
      const strip = (s?: string) => (s ? s.replace(/<[^>]+>/g, '').trim() : null);
      commons.set(pg.title.replace(/^File:/, '').replaceAll('_', ' '), { url: info.url, thumb: info.thumburl ?? info.url, page: info.descriptionurl, author: strip(info.extmetadata?.Artist?.value), license: strip(info.extmetadata?.LicenseShortName?.value) });
    }
  }
  let observed = 0;
  for (const { person, f, documentId } of facts) {
    const put = async (field: string, v: unknown) => {
      if (v === null || v === undefined) return;
      const text = typeof v === 'string' ? v : JSON.stringify(v);
      await ctx.observe(documentId, WIKIDATA_PROFILE_PROVIDER, PARSER, `${f.qid}:${field}`, InformationKind.Biography, {
        contract: 'evidence',
        record: { informationKind: InformationKind.Biography, field: `${person.entityId}:${field}`, value: { original: text, value: typeof v === 'number' ? v : text, unit: null }, evidence: { quote: null, section: f.qid } },
      });
      observed++;
    };
    if (Object.values(f.description).some(Boolean)) await put('bio', f.description);
    await put('full_name', f.fullName);
    if (f.birthPlace) await put('birth_place', { qid: f.birthPlace, names: labels(f.birthPlace) });
    await put('death_date', f.death?.date ?? null);
    await put('death_year', f.death?.year ?? null);
    await put('height_cm', f.heightCm);
    if (f.position) await put('position', { qid: f.position, names: labels(f.position) });
    await put('career_start', f.careerStart);
    await put('career_end', f.careerEnd);
    for (const c of f.clubs) await put(`club:${c.qid}:${c.from ?? ''}`, { ...c, names: labels(c.qid) });
    const img = f.image ? commons.get(f.image.replaceAll('_', ' ')) : null;
    if (img) await put('photo', img);
  }
  return [`wikidata-profile: ${facts.length} profiles, ${commons.size} photos with license metadata, ${observed} facts observed`];
};
