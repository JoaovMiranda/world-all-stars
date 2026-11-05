import { createHash } from 'node:crypto';

/** Deterministic uuid (name-based, v5 layout) for seed rows without a natural key: re-running the seed upserts them. */
export const seedId = (...parts: (string | number)[]): string => {
  const hex = createHash('sha1').update(parts.join(':')).digest('hex');
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
};
