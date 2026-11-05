/**
 * UUID v7 (RFC 9562): 48-bit Unix ms timestamp + random bits, so ids sort by creation time (doc 03).
 * Uses Web Crypto (`globalThis.crypto`), available in browsers and Node: no Node import in shared.
 */
/** Web Crypto, typed locally: shared compiles without DOM or Node types. */
const webCrypto = (globalThis as unknown as { crypto: { getRandomValues<T extends Uint8Array>(array: T): T } }).crypto;

export const uuidv7 = (now: number = Date.now()): string => {
  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  let ts = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Canonical textual UUID (any version). */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_REGEX.test(value);
