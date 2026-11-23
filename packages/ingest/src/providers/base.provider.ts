import type { InformationKind, Observation } from '@was/shared';
import { chunk, retryWithBackoff } from '@was/shared';

import { RetryableFetchError } from '../http/retryable-fetch.error';
import type { FetchedJson } from '../interfaces/fetched-json.interface';
import type { ParserRef } from '../interfaces/parser-ref.interface';
import type { RegisteredProvider } from '../interfaces/registered-provider.interface';
import type { IngestContext } from './ingest-context.interface';

/**
 * Base of every ingestion provider: reads permitted sources through `ctx.document` (safe fetch + document store) and
 * writes observations only (never canonical tables, A01). Subclasses declare `key`, `parser`, how raw params become
 * options and `run()`. Shared here: observation writing, batching (MediaWiki APIs take 50 titles/ids per call) and
 * fetching with `Retry-After` retries.
 */
export abstract class BaseProvider<Opts> implements RegisteredProvider {
  abstract readonly key: string;
  abstract readonly parser: ParserRef;
  /** Items per API call in `batch()`. */
  protected readonly batchSize: number = 50;
  /** Attempts per document when the source answers 429/503 with `Retry-After`. */
  protected readonly fetchAttempts: number = 4;

  /** Collects and observes; returns human report lines. */
  abstract run(ctx: IngestContext, opts: Opts): Promise<string[]>;

  /** Raw params (CLI flags, queued job params) → typed options. */
  protected abstract parseOptions(params: Record<string, unknown>): Opts;

  runWith(ctx: IngestContext, params: Record<string, unknown>): Promise<string[]> {
    return this.run(ctx, this.parseOptions(params));
  }

  /** Writes one observation attributed to this provider and parser. */
  protected observe(
    ctx: IngestContext,
    documentId: string,
    recordKey: string,
    kind: InformationKind,
    observation: Observation,
  ): Promise<{ id: string; isNew: boolean }> {
    return ctx.observe(documentId, this.key, this.parser, recordKey, kind, observation);
  }

  protected batch<T>(items: readonly T[]): T[][] {
    return chunk(items, this.batchSize);
  }

  /** Stored document of `url`, retrying when the source asks to wait (`Retry-After`). `null` = not found / offline miss. */
  protected document(ctx: IngestContext, source: string, url: string): Promise<{ text: string; documentId: string } | null> {
    return retryWithBackoff(() => ctx.document(source, url), {
      attempts: this.fetchAttempts,
      retryAfterMs: (error) => (error instanceof RetryableFetchError ? error.retryAfterMs : undefined),
      onRetry: (_error, waitMs) => ctx.log(`${source}: rate limited, waiting ${Math.round(waitMs / 1000)} s (Retry-After)`),
    });
  }

  /** `document()` parsed as JSON. */
  protected async fetchJson<T>(ctx: IngestContext, source: string, url: string): Promise<FetchedJson<T> | null> {
    const doc = await this.document(ctx, source, url);
    return doc ? { data: JSON.parse(doc.text) as T, documentId: doc.documentId } : null;
  }
}
