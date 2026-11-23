import type { SourceUsageStatus } from '../enums/source-usage-status.enum';

export type SourceUrlError = 'invalid_url' | 'not_https' | 'forbidden_host' | 'rejected_source';

export type SourceUrlCheck =
  | { ok: true; url: string; source: { name: string; usageStatus: SourceUsageStatus } | null; note: string | null }
  | { ok: false; error: SourceUrlError; message: string };
