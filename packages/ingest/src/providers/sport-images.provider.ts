// Provider `sport-images` (handoff T4.4): for every sport with a Wikidata item, the item's image (P18) and its Commons
// metadata (author, license, file page), read through the safe fetcher under the `wikidata` / `commons` source
// policies (api_only). Only CC0 / public domain / CC BY / CC BY-SA files are kept. Observes one `evidence` per image;
// the CLI (`pnpm ingest sport-images`) writes the result to data/content/sport-images.json, which the seed links to
// the sport page (media_links + the sport's `image` section). Not in PROVIDERS: the canonical writer has nothing to do.
import { active, type SportImage, type SportImageMiss, type SportImagesFile, sports, sportTranslations } from '@was/db';
import { commonsApiUrl, InformationKind, isoDate, type WikidataEntity, wikidataApiUrl } from '@was/shared';
import { inArray } from 'drizzle-orm';

import type { CommonsImageInfo } from '../interfaces/commons-image-info.interface';
import { BaseProvider } from './base.provider';
import type { IngestContext } from './ingest-context.interface';
import { commonsFileKey, imageCandidates, isSportImage, itemMatchesSport, itemName, pickSportImage } from './sport-image.helper';
import { SPORT_IMAGES_PROVIDER } from './sport-images.const';
import type { SportImagesOptions } from './sport-images-options.interface';
import { licenseCounts } from './sport-images-review.helper';

/** Thumbnail width asked from Commons (a pre-rendered step; the page asks the proxy for the size it shows). */
const THUMB_WIDTH = '1280';

export class SportImagesProvider extends BaseProvider<SportImagesOptions> {
  readonly key = SPORT_IMAGES_PROVIDER;
  readonly parser = { key: 'sport-images', version: '1' };
  protected override readonly fetchAttempts = 5;

  protected parseOptions(params: Record<string, unknown>): SportImagesOptions {
    const only = params.only;
    return {
      only: Array.isArray(only) ? only.map(String) : typeof only === 'string' ? only.split(',') : undefined,
      limit: params.limit ? Number(params.limit) : undefined,
    };
  }

  async run(ctx: IngestContext, opts: SportImagesOptions = {}): Promise<string[]> {
    const file = await this.collect(ctx, opts);
    return [
      `sport-images: ${file.images.length} images, ${file.missing.length} sports without a suitable image`,
      ...licenseCounts(file).map(([license, n]) => `  ${license}: ${n}`),
    ];
  }

  /** Collects (and observes) the image of every sport; the result is what data/content/sport-images.json holds. */
  async collect(ctx: IngestContext, opts: SportImagesOptions = {}): Promise<SportImagesFile> {
    const rows = await ctx.db
      .select({ id: sports.id, slug: sports.slug, qid: sports.wikidataQid, wikipediaUrl: sports.wikipediaUrl })
      .from(sports)
      .where(active(sports));
    const list = rows
      .filter((s) => !opts.only || opts.only.includes(s.slug))
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .slice(0, opts.limit ?? rows.length);
    // Curated names only (en, pt-BR): some es names were copied from the label of a wrong item.
    const names = new Map<string, string[]>();
    for (const t of await ctx.db
      .select({ sportId: sportTranslations.sportId, name: sportTranslations.name })
      .from(sportTranslations)
      .where(active(sportTranslations, inArray(sportTranslations.locale, ['en', 'pt-BR']))))
      names.set(t.sportId, [...(names.get(t.sportId) ?? []), t.name]);
    const qids = [...new Set(list.map((s) => s.qid).filter((q): q is string => !!q && /^Q\d+$/.test(q)))];

    const entities = new Map<string, WikidataEntity>();
    const entityDocument = new Map<string, string>();
    for (const group of this.batch(qids)) {
      const url = wikidataApiUrl({
        action: 'wbgetentities',
        ids: group.join('|'),
        props: 'claims|sitelinks|labels',
        sitefilter: 'enwiki|ptwiki|eswiki',
        languages: 'en|pt|pt-br|es',
        format: 'json',
      });
      const doc = await this.fetchJson<{ entities?: Record<string, WikidataEntity> }>(ctx, 'wikidata', url);
      if (!doc) continue;
      for (const e of Object.values(doc.data.entities ?? {})) {
        entities.set(e.id, e);
        entityDocument.set(e.id, doc.documentId);
      }
    }

    // A QID that is not this sport (another article, another label) is a wrong item: its image would be wrong too.
    const mismatched = new Set(
      list
        .filter((s) => s.qid && !itemMatchesSport(entities.get(s.qid), s.wikipediaUrl, [s.slug.replaceAll('-', ' '), ...(names.get(s.id) ?? [])]))
        .map((s) => s.slug),
    );
    const candidates = new Map(list.map((s) => [s.slug, s.qid && !mismatched.has(s.slug) ? imageCandidates(entities.get(s.qid)) : []]));
    const files = [...new Set([...candidates.values()].flat().map(commonsFileKey))];
    const infos = new Map<string, CommonsImageInfo>();
    for (const group of this.batch(files)) {
      const url = commonsApiUrl({
        action: 'query',
        titles: group.map((f) => `File:${f}`).join('|'),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: THUMB_WIDTH,
        format: 'json',
      });
      const doc = await this.fetchJson<{ query?: { pages?: Record<string, { title: string; imageinfo?: CommonsImageInfo[] }> } }>(ctx, 'commons', url);
      for (const page of Object.values(doc?.data.query?.pages ?? {})) {
        const info = page.imageinfo?.[0];
        if (info) infos.set(commonsFileKey(page.title), info);
      }
    }

    const images: SportImage[] = [];
    const missing: SportImageMiss[] = [];
    for (const s of list) {
      if (mismatched.has(s.slug)) {
        const item = itemName(entities.get(s.qid!), s.wikipediaUrl);
        missing.push({ sport: s.slug, qid: s.qid, reason: `Wikidata item is "${item}", not this sport (${s.wikipediaUrl ?? 'names'}): check the QID` });
        continue;
      }
      const picked = pickSportImage(s.slug, s.qid, candidates.get(s.slug) ?? [], infos);
      if (!isSportImage(picked)) {
        missing.push(picked);
        continue;
      }
      images.push(picked);
      const documentId = entityDocument.get(picked.qid);
      if (documentId)
        await this.observe(ctx, documentId, `${picked.qid}:sport_image`, InformationKind.Image, {
          contract: 'evidence',
          record: {
            informationKind: InformationKind.Image,
            field: `sport:${picked.sport}:image`,
            value: { original: picked.file, value: JSON.stringify(picked), unit: null },
            evidence: { quote: null, section: picked.qid },
          },
        });
    }
    return { generatedAt: isoDate(new Date())!, source: 'Wikidata (P18, CC0) + Wikimedia Commons (per-file license)', images, missing };
  }
}
