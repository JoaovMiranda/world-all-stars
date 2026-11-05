import { type IsoDate, toIsoDate, fromIsoDate } from '@was/shared';
import { addMonths, startOfMonth } from 'date-fns';
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
  const selectDay = useCallback((day: Date) => setSelected(toIsoDate(day)), []);

  return { month, selected, goToMonth, goToToday, selectDay };
}
