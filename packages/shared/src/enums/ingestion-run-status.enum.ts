/** Outcome of an ingestion run. */
export const IngestionRunStatus = {
  Running: 'running',
  Success: 'success',
  Partial: 'partial',
  Failed: 'failed',
} as const;
export type IngestionRunStatus = (typeof IngestionRunStatus)[keyof typeof IngestionRunStatus];
export const INGESTION_RUN_STATUS_VALUES = Object.values(IngestionRunStatus) as [IngestionRunStatus, ...IngestionRunStatus[]];
