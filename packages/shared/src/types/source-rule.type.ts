import type { SourceUsageStatus } from '../enums/source-usage-status.enum';

/** Entry of the source registry needed to judge a suggested link (doc 21). */
export type SourceDomainRule = { name: string; baseUrl: string; usageStatus: SourceUsageStatus };
