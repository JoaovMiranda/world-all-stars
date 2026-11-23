import type { AttributeValue } from './attribute-value.type';

/** One piece of evidence (result, recognition grant, squad membership, title holding…) with its version. */
export interface RankingEvidence {
  id: string;
  version: number;
  kind: string;
  competitorId: string;
  attributes: Record<string, AttributeValue>;
}
