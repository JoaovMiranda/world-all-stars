import type { CachedPage } from './cached-page.interface';

/**
 * In-process LRU of anonymous pages (production only). Entries live `ttlMs` and the whole cache is dropped on any
 * database write (BaseRepository onWrite), so a page never outlives the data it shows for more than the TTL of a
 * write-free period. Keyed by locale + path + search (pageCacheKey: the same URL renders in pt-BR, en or es).
 */
export class HtmlCache {
  private readonly entries = new Map<string, CachedPage>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 300,
  ) {}

  get enabled(): boolean {
    return this.ttlMs > 0;
  }

  get(key: string, now = Date.now()): CachedPage | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    this.entries.delete(key);
    if (hit.expiresAt <= now) return undefined;
    this.entries.set(key, hit); // most recently used last
    return hit;
  }

  set(key: string, page: Omit<CachedPage, 'expiresAt'>, now = Date.now()): void {
    if (!this.enabled) return;
    this.entries.delete(key);
    this.entries.set(key, { ...page, expiresAt: now + this.ttlMs });
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value as string);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
