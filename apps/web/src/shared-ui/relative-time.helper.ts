import { formatDate } from './format.helper';

const LOCALE = 'pt-BR';
const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const DAY_MS = 864e5;
/** Beyond this many days the absolute date reads better than "há 45 dias". */
const MAX_RELATIVE_DAYS = 30;

/** "hoje", "ontem", "há 3 dias" (up to 30 days), then dd/mm/yyyy. Input: ISO datetime. */
export const formatRelativeDay = (isoDateTime: string, now: Date = new Date()): string => {
  const days = Math.floor((now.getTime() - new Date(isoDateTime).getTime()) / DAY_MS);
  return days < MAX_RELATIVE_DAYS ? rtf.format(-Math.max(days, 0), 'day') : formatDate(isoDateTime.slice(0, 10));
};
