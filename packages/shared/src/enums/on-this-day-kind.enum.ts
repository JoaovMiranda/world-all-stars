/** Kinds of milestones shown in "Hoje na história". */
export const OnThisDayKind = {
  Birth: 'birth',
  Death: 'death',
  Title: 'title',
  Record: 'record',
  Career: 'career',
} as const;
export type OnThisDayKind = (typeof OnThisDayKind)[keyof typeof OnThisDayKind];
export const ON_THIS_DAY_KIND_VALUES = Object.values(OnThisDayKind) as [OnThisDayKind, ...OnThisDayKind[]];
