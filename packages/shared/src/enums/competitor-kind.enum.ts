/** Who can receive results and recognitions (competitor-first, handoff v3 §1). */
export const CompetitorKind = {
  Person: 'person',
  Team: 'team',
  Group: 'group',
} as const;
export type CompetitorKind = (typeof CompetitorKind)[keyof typeof CompetitorKind];
export const COMPETITOR_KIND_VALUES = Object.values(CompetitorKind) as [CompetitorKind, ...CompetitorKind[]];
