import type { JobItem } from './job-item.type';
import type { JobRun } from './job-run.type';

/** Processes one job item; the returned object becomes the item's checkpoint. */
export type ItemHandler = (item: JobItem, run: JobRun) => Promise<Record<string, unknown> | void>;
