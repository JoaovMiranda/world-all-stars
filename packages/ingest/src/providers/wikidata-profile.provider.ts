// Provider `wikidata-profile` (handoff v3 §6.5): the PROFILE of every athlete with a QID, from Wikidata (CC0) and
// Wikimedia Commons (photo by link only, with author and license): short description (en/pt-BR/es), full name, birth
// place, death, height, position, clubs with periods, career span and photo. Writes `evidence` observations; the
// canonical writer fills only empty fields (curated data wins; a different value opens a conflict).
import { active, entityExternalIds } from '@was/db';
import { commonsApiUrl, InformationKind, type WikidataEntity, type WikidataStatement, wikidataApiUrl } from '@was/shared';
import { eq } from 'drizzle-orm';

import { BaseProvider } from './base.provider';
import type { IngestContext } from './ingest-context.interface';
import { WIKIDATA_PROFILE_PROVIDER } from './wikidata-profile.const';
import type { WikidataProfileOptions } from './wikidata-profile-options.interface';

const LANGS = ['en', 'pt', 'es'] as const;

const value = <T>(s: WikidataStatement | undefined) => s?.mainsnak.datavalue?.value as T | undefined;
const itemId = (s: WikidataStatement | undefined) => value<{ id?: string }>(s)?.id;
const time = (v: { time?: string; precision?: number } | undefined) =>
  v?.time ? { year: Number(v.time.replace(/^\+/, '').slice(0, 4)), date: (v.precision ?? 0) >= 11 ? v.time.replace(/^\+/, '').slice(0, 10) : null } : null;
const qualTime = (s: WikidataStatement, p: string) => time(s.qualifiers?.[p]?.[0]?.datavalue?.value as { time?: string; precision?: number } | undefined);

/** Profile facts of one entity (pure: exported for tests). */
export const profileFacts = (e: WikidataEntity) => {
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

export class WikidataProfileProvider extends BaseProvider<WikidataProfileOptions> {
  readonly key = WIKIDATA_PROFILE_PROVIDER;
  readonly parser = { key: 'wikidata-profile', version: '1' };
  /** Wikidata/Commons may ask to wait several times in a large run. */
  protected override readonly fetchAttempts = 5;

  protected parseOptions(params: Record<string, unknown>): WikidataProfileOptions {
    return { limit: params.limit ? Number(params.limit) : undefined };
  }

  async run(ctx: IngestContext, opts: WikidataProfileOptions = {}): Promise<string[]> {
    const people = (
      await ctx.db
        .select({ entityId: entityExternalIds.entityId, qid: entityExternalIds.externalId })
        .from(entityExternalIds)
        .where(active(entityExternalIds, eq(entityExternalIds.provider, 'wikidata')))
    )
      .filter((p) => /^Q\d+$/.test(p.qid) && (!opts.entityIds || opts.entityIds.has(p.entityId)))
      .slice(0, opts.limit ?? 5000);
    const entities = new Map<string, WikidataEntity>();
    const documentOf = new Map<string, string>();
    const fetchEntities = async (ids: string[], props: string) => {
      for (const group of this.batch(ids)) {
        const url = wikidataApiUrl({ action: 'wbgetentities', ids: group.join('|'), props, languages: LANGS.join('|'), format: 'json' });
        const doc = await this.fetchJson<{ entities?: Record<string, WikidataEntity> }>(ctx, 'wikidata', url);
        if (!doc) continue;
        for (const e of Object.values(doc.data.entities ?? {})) {
          entities.set(e.id, e);
          documentOf.set(e.id, doc.documentId);
        }
      }
    };
    await fetchEntities(
      people.map((p) => p.qid),
      'labels|descriptions|claims',
    );
    const facts = people.flatMap((p) => {
      const e = entities.get(p.qid);
      return e ? [{ person: p, f: profileFacts(e), documentId: documentOf.get(p.qid)! }] : [];
    });
    // Labels (en/pt/es) of the places, positions and clubs referenced by the profiles.
    const refs = [...new Set(facts.flatMap(({ f }) => [f.birthPlace, f.position, ...f.clubs.map((c) => c.qid)].filter((x): x is string => !!x)))].filter(
      (q) => !entities.has(q),
    );
    await fetchEntities(refs, 'labels');
    const labels = (q: string | null) => (q ? Object.fromEntries(LANGS.map((l) => [l, entities.get(q)?.labels?.[l]?.value ?? null])) : null);
    // Photo metadata (author, license, thumbnail) from Commons: link only, nothing stored.
    const images = [...new Set(facts.map(({ f }) => f.image).filter((x): x is string => !!x))];
    const commons = new Map<string, { url: string; thumb: string; page: string; author: string | null; license: string | null }>();
    for (const group of this.batch(images)) {
      const url = commonsApiUrl({
        action: 'query',
        titles: group.map((n) => `File:${n}`).join('|'),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '500',
        format: 'json',
      });
      const doc = await this.fetchJson<{
        query?: {
          pages?: Record<
            string,
            { title: string; imageinfo?: { url: string; thumburl?: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }
          >;
        };
      }>(ctx, 'commons', url);
      if (!doc) continue;
      const pages = doc.data.query?.pages ?? {};
      for (const pg of Object.values(pages)) {
        const info = pg.imageinfo?.[0];
        if (!info) continue;
        const strip = (s?: string) => (s ? s.replace(/<[^>]+>/g, '').trim() : null);
        commons.set(pg.title.replace(/^File:/, '').replaceAll('_', ' '), {
          url: info.url,
          thumb: info.thumburl ?? info.url,
          page: info.descriptionurl,
          author: strip(info.extmetadata?.Artist?.value),
          license: strip(info.extmetadata?.LicenseShortName?.value),
        });
      }
    }
    let observed = 0;
    for (const { person, f, documentId } of facts) {
      const put = async (field: string, v: unknown) => {
        if (v === null || v === undefined) return;
        const text = typeof v === 'string' ? v : JSON.stringify(v);
        await this.observe(ctx, documentId, `${f.qid}:${field}`, InformationKind.Biography, {
          contract: 'evidence',
          record: {
            informationKind: InformationKind.Biography,
            field: `${person.entityId}:${field}`,
            value: { original: text, value: typeof v === 'number' ? v : text, unit: null },
            evidence: { quote: null, section: f.qid },
          },
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
  }
}

/** Runs the provider (kept for callers and tests that predate the registry). */
export const runWikidataProfile = (ctx: IngestContext, opts: WikidataProfileOptions = {}): Promise<string[]> => new WikidataProfileProvider().run(ctx, opts);
