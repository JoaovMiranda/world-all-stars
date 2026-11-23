import type { ingestionJobItems } from '@was/db';

/** One ingestion_job_items row. */
export type JobItem = typeof ingestionJobItems.$inferSelect;
