import { InformationKind, type Observation } from '@was/shared';
import { describe, expect, it, vi } from 'vitest';

import { RetryableFetchError } from '../http/retryable-fetch.error';
import { BaseProvider } from './base.provider';
import type { IngestContext } from './ingest-context.interface';
import { ProviderRegistry } from './provider.registry';

interface ProbeOptions {
  limit: number;
}

class ProbeProvider extends BaseProvider<ProbeOptions> {
  readonly key = 'probe';
  readonly parser = { key: 'probe-parser', version: '1' };
  protected override readonly batchSize = 2;
  protected override readonly fetchAttempts = 3;

  protected parseOptions(params: Record<string, unknown>): ProbeOptions {
    return { limit: params.limit ? Number(params.limit) : 10 };
  }

  async run(ctx: IngestContext, opts: ProbeOptions): Promise<string[]> {
    const ids = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].slice(0, opts.limit);
    let observed = 0;
    for (const group of this.batch(ids)) {
      const doc = await this.fetchJson<{ ids: string[] }>(ctx, 'wikidata', `https://example.test/?ids=${group.join('|')}`);
      if (!doc) continue;
      for (const id of doc.data.ids) {
        await this.observe(ctx, doc.documentId, id, InformationKind.ExternalId, { contract: 'evidence' } as unknown as Observation);
        observed++;
      }
    }
    return [`probe: ${observed} observed`];
  }
}

const fakeContext = (document: IngestContext['document']) => {
  const observe = vi.fn(async () => ({ id: 'obs', isNew: true }));
  const log = vi.fn();
  const ctx = { document, observe, log } as unknown as IngestContext;
  return { ctx, observe, log };
};

describe('BaseProvider', () => {
  it('batches, parses JSON and observes with its key and parser', async () => {
    const document = vi.fn(async (_source: string, url: string) => ({
      text: JSON.stringify({ ids: (new URL(url).searchParams.get('ids') ?? '').split('|') }),
      documentId: 'doc',
    }));
    const { ctx, observe } = fakeContext(document);
    expect(await new ProbeProvider().runWith(ctx, { limit: 5 })).toEqual(['probe: 5 observed']);
    expect(document).toHaveBeenCalledTimes(3);
    expect(observe).toHaveBeenCalledWith('doc', 'probe', { key: 'probe-parser', version: '1' }, 'Q1', InformationKind.ExternalId, expect.anything());
  });

  it('retries a document on Retry-After (429) and logs the wait', async () => {
    vi.useFakeTimers();
    const document = vi
      .fn()
      .mockRejectedValueOnce(new RetryableFetchError('https://example.test', 429, 2000))
      .mockResolvedValue({ text: '{"ids":["Q1"]}', documentId: 'doc' });
    const { ctx, log } = fakeContext(document);
    const result = new ProbeProvider().run(ctx, { limit: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(await result).toEqual(['probe: 1 observed']);
    expect(log).toHaveBeenCalledWith('wikidata: rate limited, waiting 2 s (Retry-After)');
    vi.useRealTimers();
  });

  it('does not retry other errors', async () => {
    const document = vi.fn().mockRejectedValue(new Error('refused'));
    const { ctx } = fakeContext(document);
    await expect(new ProbeProvider().run(ctx, { limit: 1 })).rejects.toThrow('refused');
    expect(document).toHaveBeenCalledTimes(1);
  });

  it('skips missing documents', async () => {
    const { ctx } = fakeContext(vi.fn(async () => null));
    expect(await new ProbeProvider().run(ctx, { limit: 3 })).toEqual(['probe: 0 observed']);
  });
});

describe('ProviderRegistry', () => {
  it('runs providers by key and rejects unknown or duplicate keys', async () => {
    const registry = new ProviderRegistry([new ProbeProvider()]);
    const { ctx } = fakeContext(vi.fn(async () => null));
    expect(registry.keys()).toEqual(['probe']);
    expect(registry.has('probe')).toBe(true);
    expect(await registry.run('probe', ctx, { limit: 1 })).toEqual(['probe: 0 observed']);
    expect(() => registry.get('nope')).toThrow('Unknown provider nope');
    expect(() => registry.register(new ProbeProvider())).toThrow('already registered');
  });
});
