/** One JSON Patch (RFC 6902) operation on a top-level field. */
export type JsonPatchOp = { op: 'add' | 'remove' | 'replace'; path: string; value?: unknown };

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const pointer = (key: string): string => `/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;

/** Top-level JSON Patch from `before` to `after` (entity_versions.diff, doc 03). `before` null = creation. */
export const jsonPatchDiff = (before: Record<string, unknown> | null, after: Record<string, unknown>): JsonPatchOp[] => {
  const ops: JsonPatchOp[] = [];
  const prev = before ?? {};
  for (const [key, value] of Object.entries(after)) {
    if (!(key in prev)) ops.push({ op: 'add', path: pointer(key), value });
    else if (!same(prev[key], value)) ops.push({ op: 'replace', path: pointer(key), value });
  }
  for (const key of Object.keys(prev)) if (!(key in after)) ops.push({ op: 'remove', path: pointer(key) });
  return ops;
};
