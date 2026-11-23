/** Groups `items` by `key`, keeping insertion order inside each group. */
export const groupBy = <T, K>(items: Iterable<T>, key: (item: T) => K): Map<K, T[]> => {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = out.get(k);
    if (list) list.push(item);
    else out.set(k, [item]);
  }
  return out;
};

/** Map from `id` to item (a later duplicate id wins). */
export const indexById = <T extends { id: K }, K = string>(items: Iterable<T>): Map<K, T> => {
  const out = new Map<K, T>();
  for (const item of items) out.set(item.id, item);
  return out;
};

/** Items with a distinct `key`, keeping the first occurrence and the original order. */
export const uniqueBy = <T, K>(items: Iterable<T>, key: (item: T) => K): T[] => {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
};
