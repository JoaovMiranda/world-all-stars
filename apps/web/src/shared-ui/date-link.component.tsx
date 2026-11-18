import { type IsoDate, monthDayOfIso } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';

import { formatDate, formatDayMonth } from './format.helper';
import { UI_MESSAGES } from './ui-text.const';

interface DateLinkProps {
  date: IsoDate;
  /** Text to show (default dd/mm/yyyy). */
  children?: string;
}

/** Every date is a link to its "Hoje na história" day (doc 09: aspect calendar_days). */
export function DateLink({ date, children }: DateLinkProps) {
  const ui = useText(UI_MESSAGES);
  return (
    <Link className="date-link" to="/on-this-day/$md" params={{ md: monthDayOfIso(date) }} title={ui.onThisDay(formatDayMonth(date))}>
      {children ?? formatDate(date)}
    </Link>
  );
}
