/**
 * Object built from [key, value] pairs with its keys in jsonb storage order (shorter key first, then bytewise; first
 * value wins), so maps assembled from rows serialize exactly as a jsonb column of the same pairs would.
 */
export const jsonbOrderedObject = (pairs: readonly (readonly [string, string])[]): Record<string, string> => {
  const seen = new Map<string, string>();
  for (const [key, value] of pairs) if (!seen.has(key)) seen.set(key, value);
  const bytes = (key: string) => Buffer.from(key, 'utf8');
  return Object.fromEntries([...seen].sort(([a], [b]) => bytes(a).length - bytes(b).length || Buffer.compare(bytes(a), bytes(b))));
};
