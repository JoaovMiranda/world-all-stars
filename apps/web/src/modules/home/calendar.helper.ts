import { type IsoDate, toIsoDate } from '@was/shared';
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

export interface CalendarCell {
  date: Date;
  iso: IsoDate;
  inMonth: boolean;
}

/** Cells of a month grid starting on Monday (whole weeks, 35 or 42 cells). */
export const buildMonthGrid = (month: Date): CalendarCell[] => {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const cells: CalendarCell[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    cells.push({ date: d, iso: toIsoDate(d), inMonth: d.getMonth() === month.getMonth() });
  }
  return cells;
};
