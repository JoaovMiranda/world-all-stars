import { z } from 'zod';

import { INGESTION_RUN_STATUS_VALUES } from '../enums/ingestion-run-status.enum';
import { SOURCE_ORIGIN_KIND_VALUES } from '../enums/source-origin-kind.enum';
import { SOURCE_USAGE_STATUS_VALUES } from '../enums/source-usage-status.enum';
import { IsoDateSchema } from './iso-date.schema';

export const IngestionRunSchema = z.object({
  id: z.string().min(1),
  jobKey: z.string().min(1),
  mode: z.string().min(1),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  status: z.enum(INGESTION_RUN_STATUS_VALUES),
  checked: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
});
export type IngestionRun = z.infer<typeof IngestionRunSchema>;

/** One source of the registry with license, usage status and collected links (doc 09 P14). */
export const SourceOverviewSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.url(),
  license: z.string(),
  originKind: z.enum(SOURCE_ORIGIN_KIND_VALUES),
  commercialUse: z.string().min(1),
  usageStatus: z.enum(SOURCE_USAGE_STATUS_VALUES),
  usageNote: z.string().nullable(),
  links: z.array(
    z.object({
      url: z.url(),
      entity: z.string().min(1),
      revision: z.string().nullable(),
      checked: IsoDateSchema.nullable(),
      status: z.string().nullable(),
      athlete: z.string().nullable(),
    }),
  ),
  athletes: z.array(z.string()),
  fields: z.number().int().nonnegative(),
  achievements: z.number().int().nonnegative(),
  lastRun: IngestionRunSchema.nullable(),
});
export type SourceOverview = z.infer<typeof SourceOverviewSchema>;
export const SourcesResponseSchema = z.array(SourceOverviewSchema);
