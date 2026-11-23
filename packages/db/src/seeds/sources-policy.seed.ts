// Source policy (handoff v3 §5.1–§5.2): licenses, crawl/retention policy and allowed hosts per source, and the
// initial SoT rules (source authority per information kind). Licenses verified on 2026-11-19 (doc 23).
import { InformationKind } from '@was/shared';
import { eq } from 'drizzle-orm';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import { licenses, sourceAuthorities } from '../tables/provenance.table';
import { sources } from '../tables/source.table';
import type { Database } from '../types/database.type';

const LICENSES = [
  {
    slug: 'cc0',
    name: 'CC0 1.0 (public domain dedication)',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    requiresAttribution: 0,
    shareAlike: 0,
    commercialUse: 1,
  },
  {
    slug: 'cc-by-sa-4.0',
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    requiresAttribution: 1,
    shareAlike: 1,
    commercialUse: 1,
  },
  {
    slug: 'cc-by-nc-sa-4.0',
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    requiresAttribution: 1,
    shareAlike: 1,
    commercialUse: 0,
  },
  {
    slug: 'per-file',
    name: 'Per file (Wikimedia Commons)',
    url: 'https://commons.wikimedia.org/wiki/Commons:Licensing',
    requiresAttribution: 1,
    shareAlike: 0,
    commercialUse: 1,
  },
  {
    slug: 'copy-with-credit',
    name: 'Copy allowed with acknowledgement (all rights reserved)',
    url: null,
    requiresAttribution: 1,
    shareAlike: 0,
    commercialUse: 0,
  },
  { slug: 'all-rights-reserved', name: 'All rights reserved', url: null, requiresAttribution: 1, shareAlike: 0, commercialUse: 0 },
] as const;

type Policy = {
  crawlPolicy: 'allowed' | 'api_only' | 'link_only' | 'forbidden';
  retentionPolicy: 'metadata_only' | 'evidence_excerpts' | 'full_payload';
  license: string;
  hosts: string[];
  minIntervalMs?: number;
};
/** Policy by source slug; sources not listed stay link_only/metadata_only (the default). */
const POLICIES: Record<
  string,
  Policy & {
    create?: { name: string; baseUrl: string; originKind: 'official' | 'community' | 'historians' | 'proprietary' | 'unknown'; commercialUse: string };
  }
> = {
  wikidata: {
    crawlPolicy: 'api_only',
    retentionPolicy: 'full_payload',
    license: 'cc0',
    hosts: ['www.wikidata.org'],
    minIntervalMs: 3000,
    create: { name: 'Wikidata', baseUrl: 'https://www.wikidata.org', originKind: 'community', commercialUse: 'yes (CC0)' },
  },
  'wikipedia-en': {
    crawlPolicy: 'api_only',
    retentionPolicy: 'evidence_excerpts',
    license: 'cc-by-sa-4.0',
    hosts: ['en.wikipedia.org'],
    minIntervalMs: 3000,
    create: {
      name: 'Wikipedia (English)',
      baseUrl: 'https://en.wikipedia.org',
      originKind: 'community',
      commercialUse: 'yes, with attribution and share-alike (facts only)',
    },
  },
  'wikipedia-pt': {
    crawlPolicy: 'api_only',
    retentionPolicy: 'evidence_excerpts',
    license: 'cc-by-sa-4.0',
    hosts: ['pt.wikipedia.org'],
    minIntervalMs: 3000,
    create: {
      name: 'Wikipédia (português)',
      baseUrl: 'https://pt.wikipedia.org',
      originKind: 'community',
      commercialUse: 'yes, with attribution and share-alike (facts only)',
    },
  },
  commons: {
    crawlPolicy: 'api_only',
    retentionPolicy: 'metadata_only',
    license: 'per-file',
    hosts: ['commons.wikimedia.org', 'upload.wikimedia.org'],
    minIntervalMs: 1000,
    create: { name: 'Wikimedia Commons', baseUrl: 'https://commons.wikimedia.org', originKind: 'community', commercialUse: 'per file' },
  },
  fjelstul: {
    crawlPolicy: 'allowed',
    retentionPolicy: 'full_payload',
    license: 'cc-by-sa-4.0',
    hosts: ['raw.githubusercontent.com', 'api.github.com'],
    minIntervalMs: 1000,
    create: {
      name: 'Fjelstul World Cup Database (© 2023 Joshua C. Fjelstul, Ph.D.)',
      baseUrl: 'https://github.com/jfjelstul/worldcup',
      originKind: 'historians',
      commercialUse: 'yes, with attribution and share-alike',
    },
  },
  'rsssf-brazil': { crawlPolicy: 'link_only', retentionPolicy: 'metadata_only', license: 'copy-with-credit', hosts: ['www.rsssf.org'] },
  olympedia: { crawlPolicy: 'link_only', retentionPolicy: 'metadata_only', license: 'all-rights-reserved', hosts: [] },
  fbref: { crawlPolicy: 'forbidden', retentionPolicy: 'metadata_only', license: 'all-rights-reserved', hosts: [] },
  transfermarkt: { crawlPolicy: 'forbidden', retentionPolicy: 'metadata_only', license: 'all-rights-reserved', hosts: [] },
  boxrec: { crawlPolicy: 'forbidden', retentionPolicy: 'metadata_only', license: 'all-rights-reserved', hosts: [] },
  hltv: { crawlPolicy: 'link_only', retentionPolicy: 'metadata_only', license: 'all-rights-reserved', hosts: [] },
  'ioc-library': {
    crawlPolicy: 'forbidden',
    retentionPolicy: 'metadata_only',
    license: 'all-rights-reserved',
    hosts: [],
    create: { name: 'IOC Olympic World Library (anti-bot: not crawled)', baseUrl: 'https://library.olympics.com', originKind: 'official', commercialUse: 'no' },
  },
  ibjjf: {
    crawlPolicy: 'forbidden',
    retentionPolicy: 'metadata_only',
    license: 'all-rights-reserved',
    hosts: [],
    create: { name: 'IBJJF (results site; scraping forbidden, link only)', baseUrl: 'https://ibjjf.com', originKind: 'official', commercialUse: 'no' },
  },
  'worldcups-ai': {
    crawlPolicy: 'link_only',
    retentionPolicy: 'metadata_only',
    license: 'cc-by-nc-sa-4.0',
    hosts: [],
    create: {
      name: 'WorldCups.ai (CC BY-NC-SA: not used as data)',
      baseUrl: 'https://www.worldcups.ai',
      originKind: 'historians',
      commercialUse: 'no (non-commercial license)',
    },
  },
};

/** Initial SoT rules (§5.2): most specific wins, then priority. */
const AUTHORITIES: { source: string; kind: InformationKind; priority: number; justification: string }[] = [
  { source: 'wikidata', kind: InformationKind.ExternalId, priority: 10, justification: 'Wikidata is the hub of identifiers (CC0, sitelinks).' },
  { source: 'wikidata', kind: InformationKind.Birth, priority: 10, justification: 'Structured, referenced dates (P569/P19), CC0.' },
  { source: 'wikidata', kind: InformationKind.Identity, priority: 10, justification: 'QID is the most stable external identity.' },
  { source: 'wikipedia-en', kind: InformationKind.Biography, priority: 20, justification: 'Broadest coverage; facts only, text never republished.' },
  { source: 'fjelstul', kind: InformationKind.Entry, priority: 10, justification: 'Official World Cup squads 1930–2022 (CC BY-SA), curated by a researcher.' },
  { source: 'fjelstul', kind: InformationKind.Lineup, priority: 10, justification: 'Match lineups from 1970 (CC BY-SA).' },
  { source: 'wikipedia-en', kind: InformationKind.Entry, priority: 50, justification: 'Fallback for editions outside the specialized base.' },
  { source: 'wikipedia-en', kind: InformationKind.Lineup, priority: 50, justification: 'Fallback: final match reports (1930–1966, 1999, 2011, 2023, 2026).' },
  {
    source: 'wikipedia-en',
    kind: InformationKind.Result,
    priority: 50,
    justification: 'Champion tables (ADCC, IBJJF, Olympic medal lists) when no permitted official source exists.',
  },
  {
    source: 'wikipedia-en',
    kind: InformationKind.Recognition,
    priority: 50,
    justification: 'Champion and medal lists; IBJJF and IOC sites cannot be crawled.',
  },
  { source: 'commons', kind: InformationKind.Image, priority: 10, justification: 'Freely licensed images, attribution per file.' },
];

export const seedSourcesPolicy = async (db: Database): Promise<number> => {
  const licenseIds = new Map<string, string>();
  for (const l of LICENSES) licenseIds.set(l.slug, await upsertRow(db, licenses, { id: seedId('license', l.slug), createdVia: 'seed', ...l }));
  const ids = new Map<string, string>();
  for (const [slug, p] of Object.entries(POLICIES)) {
    const values = {
      slug,
      crawlPolicy: p.crawlPolicy,
      retentionPolicy: p.retentionPolicy,
      allowedHosts: p.hosts,
      minIntervalMs: p.minIntervalMs ?? 3000,
      licenseId: licenseIds.get(p.license),
    };
    const existing = (await db.select().from(sources)).find((s) => s.slug === slug && !s.deletedAt);
    if (!existing && !p.create) continue;
    if (existing) {
      await db.update(sources).set(values).where(eq(sources.id, existing.id));
      ids.set(slug, existing.id);
      continue;
    }
    ids.set(
      slug,
      await upsertRow(db, sources, {
        id: seedId('source', slug),
        createdVia: 'seed',
        ...values,
        ...p.create!,
        license: p.license,
        usageStatus: p.crawlPolicy === 'forbidden' || p.crawlPolicy === 'link_only' ? 'link_only' : 'active',
      }),
    );
  }
  for (const a of AUTHORITIES) {
    const sourceId = ids.get(a.source);
    if (sourceId)
      await upsertRow(db, sourceAuthorities, {
        id: seedId('authority', a.source, a.kind),
        createdVia: 'seed',
        sourceId,
        informationKind: a.kind,
        priority: a.priority,
        justification: a.justification,
      });
  }
  return ids.size;
};
