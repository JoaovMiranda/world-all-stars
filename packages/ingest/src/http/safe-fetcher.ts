// Polite and SSRF-safe fetch for ingestion workers (handoff v3 §6.4, G04).
// HTTPS only · host allowlist per source · DNS resolved and private/loopback/link-local/metadata ranges refused on
// EVERY hop · at most 3 redirects, each re-validated · size cap · allowed content types · timeout · per-host interval
// · Retry-After / 429 backoff · disk cache. The User-Agent never carries personal data.
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import fs from 'node:fs';
import { isIP } from 'node:net';
import path from 'node:path';

import type { FetchPolicy } from './fetch-policy.interface';
import { FetchRefusedError } from './fetch-refused.error';
import type { FetchedDocument } from './fetched-document.interface';
import { INGEST_USER_AGENT } from './ingest-user-agent.const';
import { isPrivateAddress } from './private-address.helper';
import { RetryableFetchError } from './retryable-fetch.error';
import type { SafeFetchOptions } from './safe-fetch-options.interface';

const ALLOWED_TYPES = [/^text\//, /^application\/(json|xml|x-wiki|csv)/, /\+json/, /\+xml/];

const hostAllowed = (host: string, allowed: readonly string[]) =>
  allowed.some((h) => (h.startsWith('*.') ? host === h.slice(2) || host.endsWith(h.slice(1)) : host === h));

export class SafeFetcher {
  private readonly lastRequest = new Map<string, number>();
  private readonly opts: Required<Omit<SafeFetchOptions, 'cacheDir'>> & { cacheDir: string | null };

  constructor(options: SafeFetchOptions = {}) {
    this.opts = {
      cacheDir: options.cacheDir ?? null,
      maxBytes: options.maxBytes ?? 10 * 1024 * 1024,
      timeoutMs: options.timeoutMs ?? 30_000,
      maxRedirects: options.maxRedirects ?? 3,
      fetchImpl: options.fetchImpl ?? fetch,
      resolve: options.resolve ?? (async (host) => (await lookup(host, { all: true })).map((a) => a.address)),
      sleep: options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
      now: options.now ?? Date.now,
    };
  }

  /** Validates protocol, host and resolved addresses of one hop (throws FetchRefusedError). */
  async validate(url: URL, policy: FetchPolicy): Promise<void> {
    if (url.protocol !== 'https:') throw new FetchRefusedError(url.href, 'only https is allowed');
    if (url.username || url.password) throw new FetchRefusedError(url.href, 'credentials in URL');
    const host = url.hostname.toLowerCase();
    if (!hostAllowed(host, policy.allowedHosts)) throw new FetchRefusedError(url.href, `host ${host} not in the source allowlist`);
    const addresses = isIP(host) ? [host] : await this.opts.resolve(host);
    if (!addresses.length || addresses.some(isPrivateAddress)) throw new FetchRefusedError(url.href, 'resolves to a private or reserved address');
  }

  private cacheFile(url: string) {
    return this.opts.cacheDir ? path.join(this.opts.cacheDir, `${createHash('sha1').update(url).digest('hex')}.bin`) : null;
  }

  async get(rawUrl: string, policy: FetchPolicy): Promise<FetchedDocument> {
    const cache = this.cacheFile(rawUrl);
    if (cache && fs.existsSync(cache)) {
      const meta = JSON.parse(fs.readFileSync(`${cache}.json`, 'utf8')) as { finalUrl: string; status: number; contentType: string | null };
      return { url: rawUrl, ...meta, bytes: fs.readFileSync(cache), fromCache: true };
    }
    let url = new URL(rawUrl);
    for (let hop = 0; hop <= this.opts.maxRedirects; hop++) {
      await this.validate(url, policy);
      await this.pace(url.hostname, policy.minIntervalMs);
      const res = await this.request(url);
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) throw new FetchRefusedError(url.href, 'redirect without location');
        url = new URL(location, url);
        continue;
      }
      if (res.status === 429 || res.status === 503) {
        const retry = Number(res.headers.get('retry-after')) || 15;
        throw new RetryableFetchError(url.href, res.status, retry * 1000);
      }
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && !ALLOWED_TYPES.some((t) => t.test(contentType)))
        throw new FetchRefusedError(url.href, `content type ${contentType} not allowed`);
      const bytes = await this.readCapped(res, url.href);
      const doc = { url: rawUrl, finalUrl: url.href, status: res.status, contentType, bytes, fromCache: false };
      if (cache && res.ok) {
        fs.mkdirSync(path.dirname(cache), { recursive: true });
        fs.writeFileSync(cache, bytes);
        fs.writeFileSync(`${cache}.json`, JSON.stringify({ finalUrl: doc.finalUrl, status: doc.status, contentType }));
      }
      return doc;
    }
    throw new FetchRefusedError(rawUrl, `more than ${this.opts.maxRedirects} redirects`);
  }

  private async pace(host: string, minIntervalMs: number) {
    const last = this.lastRequest.get(host);
    const wait = last === undefined ? 0 : last + minIntervalMs - this.opts.now();
    if (wait > 0) await this.opts.sleep(wait);
    this.lastRequest.set(host, this.opts.now());
  }

  private async request(url: URL): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    try {
      return await this.opts.fetchImpl(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': INGEST_USER_AGENT, 'Accept-Encoding': 'gzip' },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async readCapped(res: Response, url: string): Promise<Buffer> {
    const declared = Number(res.headers.get('content-length'));
    if (declared > this.opts.maxBytes) throw new FetchRefusedError(url, `body larger than ${this.opts.maxBytes} bytes`);
    const reader = res.body?.getReader();
    if (!reader) return Buffer.alloc(0);
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > this.opts.maxBytes) {
        await reader.cancel();
        throw new FetchRefusedError(url, `body larger than ${this.opts.maxBytes} bytes`);
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
}
