import countries from 'i18n-iso-countries';

const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

/** pt-BR name of a country from its ISO 3166-1 numeric code (world-atlas `id`); falls back to the atlas name. */
export const countryNameFromNumeric = (isoNumeric: string | number | undefined, fallback: string): string => {
  if (isoNumeric === undefined) return fallback;
  const alpha2 = countries.numericToAlpha2(String(isoNumeric).padStart(3, '0'));
  if (!alpha2) return fallback;
  try {
    return regionNames.of(alpha2) ?? fallback;
  } catch {
    return fallback;
  }
};
