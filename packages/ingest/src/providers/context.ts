// What every provider gets: the database, the safe fetcher bound to the source policies, a Wikipedia client and
// the observation writer. Providers never touch canonical tables (A01).
import fs from 'node:fs';
import path from 'node:path';

import { type Database, active, sources } from '@was/db';
import { findRepoRoot } from '@was/db';
import type { InformationKind, Observation } from '@was/shared';
import { eq } from 'drizzle-orm';

import { recordObservation, storeDocument } from '../documents/document-store';
import { FetchRefusedError, type FetchPolicy, SafeFetcher } from '../http/safe-fetch';

export interface WikiPage {
  title: string;
  url: string;
  revisionId: string | null;
  text: string;
  documentId: string;
}

export interface IngestContext {
  db: Database;
  fetcher: SafeFetcher;
  jobId: string | null;
  /** No network: only the local caches (tests, CI). */
  offline: boolean;
  log: (message: string) => void;
  /** Cooperative cancellation (job cancel_requested_at). */
  cancelled?: () => boolean;
  policy(sourceSlug: string): Promise<FetchPolicy>;
  /** Raw document of a permitted source (stored in source_documents; cache-first). */
  document(sourceSlug: string, url: string, opts?: { revisionId?: string | null; cacheFile?: string | null }): Promise<{ text: string; documentId: string } | null>;
  wiki(title: string, lang?: string): Promise<WikiPage | null>;
  observe(documentId: string, provider: string, parser: { key: string; version: string }, recordKey: string, kind: InformationKind, observation: Observation): Promise<{ id: string; isNew: boolean }>;
}

/** Same safe-name rule as scripts/crawler/crawl_athletes.py, so its cache serves as an offline mirror. */
export const crawlerCacheName = (title: string) => `${title.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 150)}.wiki`;

export const createContext = (db: Database, opts: { offline?: boolean; jobId?: string | null; log?: (m: string) => void; fetcher?: SafeFetcher } = {}): IngestContext => {
  const root = findRepoRoot();
  const crawlerCache = path.join(root, 'data/seeds/.cache');
  const fetcher = opts.fetcher ?? new SafeFetcher({ cacheDir: path.join(root, '.data/ingest-cache') });
  const policies = new Map<string, FetchPolicy & { crawl: string }>();
  const policy = async (slug: string) => {
    const hit = policies.get(slug);
    if (hit) return hit;
    const [s] = await db.select().from(sources).where(active(sources, eq(sources.slug, slug)));
    if (!s) throw new Error(`Unknown source ${slug}`);
    const p = { allowedHosts: s.allowedHosts, minIntervalMs: s.minIntervalMs, crawl: s.crawlPolicy };
    policies.set(slug, p);
    return p;
  };
  const log = opts.log ?? (() => undefined);

  const ctx: IngestContext = {
    db,
    fetcher,
    jobId: opts.jobId ?? null,
    offline: opts.offline ?? false,
    log,
    policy,
    async document(sourceSlug, url, o = {}) {
      const p = await policy(sourceSlug);
      if (p.crawl !== 'allowed' && p.crawl !== 'api_only') throw new FetchRefusedError(url, `source ${sourceSlug} is ${p.crawl}`);
      let bytes: Buffer | null = null;
      let status = 200;
      let contentType: string | null = url.endsWith('.csv') ? 'text/csv' : 'text/plain';
      const local = o.cacheFile ? path.join(crawlerCache, o.cacheFile) : null;
      if (local && fs.existsSync(local)) bytes = fs.readFileSync(local);
      else if (!ctx.offline) {
        const doc = await fetcher.get(url, p);
        bytes = doc.bytes;
        status = doc.status;
        contentType = doc.contentType;
        if (status === 404) return null;
      }
      if (!bytes) return null;
      const stored = await storeDocument(db, { sourceSlug, url, revisionId: o.revisionId ?? null, httpStatus: status, contentType, bytes, jobId: ctx.jobId });
      return { text: stored.text, documentId: stored.document.id };
    },
    async wiki(title, lang = 'en') {
      const sourceSlug = `wikipedia-${lang}`;
      const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
      const local = path.join(crawlerCache, 'wiki', crawlerCacheName(title));
      let text: string | null = null;
      let revisionId: string | null = null;
      let resolved = title;
      if (lang === 'en' && fs.existsSync(local)) text = fs.readFileSync(local, 'utf8');
      else if (!ctx.offline) {
        const api = `https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'revisions', rvprop: 'ids|content', rvslots: 'main', titles: title, redirects: '1', format: 'json', formatversion: '2' })}`;
        const res = await fetcher.get(api, await policy(sourceSlug));
        const json = JSON.parse(res.bytes.toString('utf8')) as { query?: { pages?: { title: string; missing?: boolean; revisions?: { revid: number; slots: { main: { content: string } } }[] }[] } };
        const pg = json.query?.pages?.[0];
        if (!pg || pg.missing || !pg.revisions?.[0]) return null;
        text = pg.revisions[0].slots.main.content;
        revisionId = String(pg.revisions[0].revid);
        resolved = pg.title;
      }
      if (text === null) return null;
      const redirect = /^\s*#REDIRECT\s*\[\[([^\]|#]+)/i.exec(text);
      if (redirect) return ctx.wiki(redirect[1]!.trim(), lang);
      const stored = await storeDocument(db, { sourceSlug, url: pageUrl, revisionId, httpStatus: 200, contentType: 'text/x-wiki', bytes: Buffer.from(text), jobId: ctx.jobId });
      return { title: resolved, url: pageUrl, revisionId, text: stored.text, documentId: stored.document.id };
    },
    async observe(documentId, provider, parser, recordKey, kind, observation) {
      const r = await recordObservation(db, {
        documentId, providerKey: provider, parserKey: parser.key, parserVersion: parser.version, recordKey, informationKind: kind,
        contract: `${observation.contract}@1`, extracted: observation as unknown as Record<string, unknown>,
      });
      return { id: r.observation.id, isNew: r.isNew };
    },
  };
  return ctx;
};
