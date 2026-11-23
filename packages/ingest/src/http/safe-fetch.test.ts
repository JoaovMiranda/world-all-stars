import { describe, expect, it } from 'vitest';

import { FetchRefusedError } from './fetch-refused.error';
import { isPrivateAddress } from './private-address.helper';
import { SafeFetcher } from './safe-fetcher';

const policy = { allowedHosts: ['en.wikipedia.org', '*.wikimedia.org'], minIntervalMs: 0 };
const publicDns = async () => ['185.15.59.224'];
const fetcherWith = (responses: Record<string, Response>, resolve = publicDns) =>
  new SafeFetcher({
    resolve,
    sleep: async () => undefined,
    fetchImpl: (async (url: URL) => responses[url.href] ?? new Response('nope', { status: 404 })) as typeof fetch,
  });

describe('safe fetch (G04)', () => {
  it('classifies private and reserved addresses', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.0.10',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:10.0.0.1',
    ])
      expect(isPrivateAddress(ip), ip).toBe(true);
    for (const ip of ['185.15.59.224', '8.8.8.8', '2620:0:862:ed1a::1']) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it('refuses http, hosts outside the allowlist, credentials and hosts resolving to private IPs', async () => {
    const f = fetcherWith({});
    await expect(f.get('http://en.wikipedia.org/wiki/X', policy)).rejects.toThrow(FetchRefusedError);
    await expect(f.get('https://evil.example.com/', policy)).rejects.toThrow(/allowlist/);
    await expect(f.get('https://user:pw@en.wikipedia.org/', policy)).rejects.toThrow(/credentials/);
    await expect(fetcherWith({}, async () => ['10.0.0.5']).get('https://en.wikipedia.org/wiki/X', policy)).rejects.toThrow(/private/);
    await expect(f.get('https://169.254.169.254/latest/meta-data', { ...policy, allowedHosts: ['169.254.169.254'] })).rejects.toThrow(/private/);
  });

  it('re-validates every redirect hop and caps redirects', async () => {
    const f = fetcherWith({ 'https://en.wikipedia.org/a': new Response(null, { status: 302, headers: { location: 'https://internal.example/x' } }) });
    await expect(f.get('https://en.wikipedia.org/a', policy)).rejects.toThrow(/allowlist/);
    const loop = new SafeFetcher({
      resolve: publicDns,
      sleep: async () => undefined,
      fetchImpl: (async () => new Response(null, { status: 301, headers: { location: 'https://en.wikipedia.org/a' } })) as typeof fetch,
    });
    await expect(loop.get('https://en.wikipedia.org/a', policy)).rejects.toThrow(/redirects/);
  });

  it('enforces the size cap and the allowed content types', async () => {
    const big = new SafeFetcher({
      resolve: publicDns,
      maxBytes: 10,
      fetchImpl: (async () => new Response('x'.repeat(100), { headers: { 'content-type': 'text/plain' } })) as typeof fetch,
    });
    await expect(big.get('https://en.wikipedia.org/a', policy)).rejects.toThrow(/larger/);
    const binary = fetcherWith({ 'https://en.wikipedia.org/a': new Response('MZ', { headers: { 'content-type': 'application/octet-stream' } }) });
    await expect(binary.get('https://en.wikipedia.org/a', policy)).rejects.toThrow(/content type/);
    const ok = fetcherWith({ 'https://en.wikipedia.org/a': new Response('{"a":1}', { headers: { 'content-type': 'application/json' } }) });
    expect((await ok.get('https://en.wikipedia.org/a', policy)).bytes.toString()).toBe('{"a":1}');
  });

  it('turns 429 into a retryable error with Retry-After', async () => {
    const f = fetcherWith({ 'https://en.wikipedia.org/a': new Response('slow down', { status: 429, headers: { 'retry-after': '7' } }) });
    await expect(f.get('https://en.wikipedia.org/a', policy)).rejects.toMatchObject({ retryAfterMs: 7000 });
  });
});
