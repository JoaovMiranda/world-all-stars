import { createFormatters, type Formatters } from '@was/shared';

import { getBoot } from '@/app/request-scope';

import { localeStore, useLocale } from './locale.store';

/** Formatters (dates, numbers, relative time, collator, country names) of the current language and APP_TIME_ZONE. */
export const useFormat = (): Formatters => createFormatters(useLocale(), getBoot().timeZone);

/** Same, outside React (helpers, loaders): reads the locale at call time. */
export const currentFormat = (): Formatters => createFormatters(localeStore.get(), getBoot().timeZone);
