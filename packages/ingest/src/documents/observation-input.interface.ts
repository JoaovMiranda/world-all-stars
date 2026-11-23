import type { sourceObservations } from '@was/db';

/** One parsed record to store in source_observations. */
export interface ObservationInput {
  documentId: string;
  providerKey: string;
  parserKey: string;
  parserVersion: string;
  recordKey: string;
  informationKind: (typeof sourceObservations.$inferInsert)['informationKind'];
  contract: string;
  extracted: Record<string, unknown>;
  confidence?: number;
}
