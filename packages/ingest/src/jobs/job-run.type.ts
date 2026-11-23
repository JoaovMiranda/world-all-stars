import type { ingestionRuns } from '@was/db';

/** One ingestion_runs row (a job). */
export type JobRun = typeof ingestionRuns.$inferSelect;
