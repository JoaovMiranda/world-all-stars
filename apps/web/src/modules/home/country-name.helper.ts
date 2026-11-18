import countries from 'i18n-iso-countries';

import { currentFormat } from '@/i18n/use-format.hook';

/** Name of a country in the current language from its ISO 3166-1 numeric code (world-atlas `id`); falls back to the atlas name. */
export const countryNameFromNumeric = (isoNumeric: string | number | undefined, fallback: string): string => {
  if (isoNumeric === undefined) return fallback;
  const alpha2 = countries.numericToAlpha2(String(isoNumeric).padStart(3, '0'));
  return alpha2 ? currentFormat().country(alpha2, fallback) : fallback;
};
