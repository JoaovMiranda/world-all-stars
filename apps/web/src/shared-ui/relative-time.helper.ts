import { getBoot } from '@/app/request-scope';
import { currentFormat } from '@/i18n/use-format.hook';

/** "today", "yesterday", "3 days ago" (up to 30 days), then the date, in the current language. `now` = instant of the page load. */
export const formatRelativeDay = (isoDateTime: string, now: Date = new Date(getBoot().now)): string => currentFormat().relativeDay(isoDateTime, now);
