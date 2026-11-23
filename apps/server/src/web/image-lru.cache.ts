import type { CachedImage } from './cached-image.type';

/** Byte-bounded LRU (Map keeps insertion order: re-inserting on read makes it most recent). */
export class ImageLru {
  private readonly items = new Map<string, CachedImage>();
  private bytes = 0;
  constructor(private readonly budget: number) {}
  get(key: string): CachedImage | undefined {
    const hit = this.items.get(key);
    if (hit) {
      this.items.delete(key);
      this.items.set(key, hit);
    }
    return hit;
  }
  set(key: string, value: CachedImage): void {
    if (value.body.byteLength > this.budget) return;
    this.items.delete(key);
    this.items.set(key, value);
    this.bytes += value.body.byteLength;
    for (const [k, v] of this.items) {
      if (this.bytes <= this.budget) break;
      this.items.delete(k);
      this.bytes -= v.body.byteLength;
    }
  }
}
