import type { ProtoRow } from '../types/proto-row.type';

/** The HTML prototype's simulated database (plan/front-prototype/mock). */
export interface ProtoDb {
  tables: Record<string, ProtoRow[]>;
  all(table: string): ProtoRow[];
  get(table: string, id: string | null): ProtoRow | null;
}
