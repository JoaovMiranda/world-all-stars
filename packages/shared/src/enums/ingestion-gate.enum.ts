/** Gate of the ingestion pipeline that skipped an item before the AI extractor (doc 11). */
export const IngestionGate = {
  Unchanged: 'unchanged',
  Noise: 'noise',
  Parser: 'parser',
  Duplicate: 'duplicate',
  Budget: 'budget',
} as const;
export type IngestionGate = (typeof IngestionGate)[keyof typeof IngestionGate];
export const INGESTION_GATE_VALUES = Object.values(IngestionGate) as [IngestionGate, ...IngestionGate[]];
