import type { ProtoDb } from './proto-db.interface';
import type { ProtoSchema } from './proto-schema.interface';

/** What the prototype loader (node:vm) returns. */
export interface Prototype {
  schema: ProtoSchema;
  api: Record<string, (...args: unknown[]) => unknown>;
  db: ProtoDb;
  catalog: {
    governance: Record<string, { name: string; summary: string }>;
    orgKinds: Record<string, [string, string]>;
    prizeForms: Record<string, string>;
  };
  collectionRuns: Record<string, unknown>[];
  collectedSports: { sport: string; reason_pt: string; facts: Record<string, unknown>[] }[];
  slugRedirects: { table: string; oldSlug: string; newSlug: string; id: string }[];
}
