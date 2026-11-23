import type { Encoding } from './encoding.type';

/** Picks brotli over gzip when the client accepts it (q=0 means refused). */
export const pickEncoding = (acceptEncoding: string | undefined): Encoding | null => {
  if (!acceptEncoding) return null;
  const accepted = new Set(
    acceptEncoding
      .split(',')
      .map((part) => part.trim().split(';'))
      .filter(([, q]) => !q || Number.parseFloat(q.split('=')[1] ?? '1') > 0)
      .map(([name = '']) => name.trim().toLowerCase()),
  );
  if (accepted.has('br')) return 'br';
  if (accepted.has('gzip') || accepted.has('*')) return 'gzip';
  return null;
};
