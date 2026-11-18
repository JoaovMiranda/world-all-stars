import { type IsoDate, toIsoDate, fromIsoDate } from '@was/shared';
import { addMonths, isSameMonth, startOfMonth } from 'date-fns';
import { useCallback, useState } from 'react';

/** Month navigation + selected day of the home calendar. */
export function useMonthCalendar(today: IsoDate) {
  const [month, setMonth] = useState(() => startOfMonth(fromIsoDate(today)));
  const [selected, setSelected] = useState<IsoDate>(today);

  const goToMonth = useCallback((delta: number) => setMonth((m) => addMonths(m, delta)), []);
  const goToToday = useCallback(() => {
    setMonth(startOfMonth(fromIsoDate(today)));
    setSelected(today);
  }, [today]);
  // Selecting a day of another month (arrow keys across the edge) brings that month into view.
  const selectDay = useCallback((day: Date) => {
    setSelected(toIsoDate(day));
    setMonth((m) => (isSameMonth(m, day) ? m : startOfMonth(day)));
  }, []);

  return { month, selected, goToMonth, goToToday, selectDay };
}
