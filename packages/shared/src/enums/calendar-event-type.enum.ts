/** Calendar entries: competition editions and sport observance days. */
export const CalendarEventType = {
  Competition: 'competition',
  Observance: 'observance',
} as const;
export type CalendarEventType = (typeof CalendarEventType)[keyof typeof CalendarEventType];
export const CALENDAR_EVENT_TYPE_VALUES = Object.values(CalendarEventType) as [CalendarEventType, ...CalendarEventType[]];
