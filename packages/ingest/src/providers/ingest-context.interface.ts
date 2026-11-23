import type { Database } from '@was/db';
import type { InformationKind, Observation } from '@was/shared';

import type { FetchPolicy } from '../http/fetch-policy.interface';
import type { SafeFetcher } from '../http/safe-fetcher';
import type { WikiPage } from './wiki-page.interface';

/** What every provider gets: database, safe fetcher, source policies, Wikipedia client and observation writer. */
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
  document(
    sourceSlug: string,
    url: string,
    opts?: { revisionId?: string | null; cacheFile?: string | null },
  ): Promise<{ text: string; documentId: string } | null>;
  wiki(title: string, lang?: string): Promise<WikiPage | null>;
  observe(
    documentId: string,
    provider: string,
    parser: { key: string; version: string },
    recordKey: string,
    kind: InformationKind,
    observation: Observation,
  ): Promise<{ id: string; isNew: boolean }>;
}
