/** Index of rows by id. */
export const byId = <X extends { id: string }>(rows: X[]) => new Map(rows.map((r) => [r.id, r]));
/** Rows grouped by a key (insertion order kept). */
export const groupBy = <X, K>(rows: X[], key: (r: X) => K) => {
  const out = new Map<K, X[]>();
  for (const r of rows) {
    const k = key(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
};
/** Memoizes a one-argument function (cache per argument, for the lifetime of the snapshot). */
export const memo = <K, V>(fn: (k: K) => V) => {
  const cache = new Map<K, V>();
  return (k: K): V => {
    if (!cache.has(k)) cache.set(k, fn(k));
    return cache.get(k) as V;
  };
};
