import type { IsoDate } from '@was/shared';

export interface CalendarCell {
  date: Date;
  iso: IsoDate;
  inMonth: boolean;
}
