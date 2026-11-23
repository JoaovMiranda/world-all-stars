/** One JSON Patch (RFC 6902) operation on a top-level field. */
export type JsonPatchOp = { op: 'add' | 'remove' | 'replace'; path: string; value?: unknown };
