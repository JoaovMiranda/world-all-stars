import type { FixtureMode, IsoDate, Locale, SessionKind } from '@was/shared';
import type { ThemeName } from '@/shared-ui/theme-name.type';

/**
 * What the server decided for this page load and the client must reuse to hydrate the same markup
 * (sent with the router's dehydrated state). Times come from the server so "today" never differs.
 */
export interface Boot {
  fixtureMode: FixtureMode;
  sessionKind: SessionKind;
  /**
   * Who the API says is browsing (`kind:userId` from GET /api/session, session-identity.helper): part of every
   * personalized query key, so data of one account never shows for another after a sign-in/out.
   */
  identity: string;
  /** YYYY-MM-DD in `timeZone` (APP_TIME_ZONE on the server). */
  today: IsoDate;
  /** ISO instant of the request. */
  now: string;
  timeZone: string;
  /** Absolute origin used in canonical/og URLs (PUBLIC_URL). */
  publicUrl: string;
  /** Manual theme from the `was-theme` cookie (null = follow the OS). */
  theme: ThemeName | null;
  /** "Pause animations" from the `was-motion` cookie: <html data-motion="reduced"> on the first paint. */
  motionPaused: boolean;
  /** Interface language: `was_locale` cookie → Accept-Language → pt-BR (switchable in place: locale.store). */
  locale: Locale;
}
