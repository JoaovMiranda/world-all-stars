export interface LocaleSources {
  /** `?locale=` (API only). */
  query?: string | null | undefined;
  /** `x-was-locale` (the web client's current language). */
  header?: string | null | undefined;
  /** `was_locale` cookie (the visitor's saved choice). */
  cookie?: string | null | undefined;
  acceptLanguage?: string | null | undefined;
}
