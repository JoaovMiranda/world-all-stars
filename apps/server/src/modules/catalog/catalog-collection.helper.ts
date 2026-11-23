/** Memoizes a one-argument function (cache per argument, for the lifetime of the snapshot). */
export const memo = <K, V>(fn: (k: K) => V) => {
  const cache = new Map<K, V>();
  return (k: K): V => {
    if (!cache.has(k)) cache.set(k, fn(k));
    return cache.get(k) as V;
  };
};
