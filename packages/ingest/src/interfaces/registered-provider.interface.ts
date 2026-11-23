import type { IngestContext } from '../providers/context';

/** Type-erased view of a provider, as stored in the `ProviderRegistry` (CLI, job queue and admin runner). */
export interface RegisteredProvider {
  readonly key: string;
  /** Parses raw job/CLI params into the provider's options and runs it; returns report lines. */
  runWith(ctx: IngestContext, params: Record<string, unknown>): Promise<string[]>;
}
