/** Status of a competition edition in the calendar. */
export const CompetitionStatus = {
  Scheduled: 'scheduled',
  Ongoing: 'ongoing',
  Finished: 'finished',
} as const;
export type CompetitionStatus = (typeof CompetitionStatus)[keyof typeof CompetitionStatus];
export const COMPETITION_STATUS_VALUES = Object.values(CompetitionStatus) as [CompetitionStatus, ...CompetitionStatus[]];
