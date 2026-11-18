import { FIXTURE_MODE_VALUES, FixtureMode, type IsoDate, LOCALE_COOKIE, SESSION_KIND_VALUES, SessionKind, resolveLocale } from '@was/shared';

import { FIXTURE_MODE_COOKIE, FIXTURE_MODE_PARAM } from '@/data/data-layer.const';
import { SESSION_COOKIE, SESSION_URL_PARAM } from '@/session/session.const';
import { readCookie } from '@/shared-ui/cookie.helper';
import { THEME_COOKIE, isThemeName } from '@/shared-ui/theme.const';

import type { Boot } from './request-scope';

const isMode = (v: unknown): v is FixtureMode => FIXTURE_MODE_VALUES.includes(v as FixtureMode);
const isKind = (v: unknown): v is SessionKind => SESSION_KIND_VALUES.includes(v as SessionKind);

/** YYYY-MM-DD of an instant in a IANA time zone (en-CA formats as ISO). */
export const isoDateIn = (instant: Date, timeZone: string): IsoDate =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant) as IsoDate;

export interface BootRequest {
  url: URL;
  cookie: string | null;
  timeZone: string;
  publicUrl: string;
  acceptLanguage?: string | null;
  now?: Date;
}

/**
 * Server: what the page load starts with. Fixture mode = `?fixture=` → cookie → sample; session = `?as=` → cookie →
 * anon (the same rule the simulated auth provider applies to API calls); theme = cookie; locale = cookie →
 * Accept-Language → pt-BR (the same rule the API applies).
 */
export const resolveBoot = ({ url, cookie, timeZone, publicUrl, acceptLanguage, now = new Date() }: BootRequest): Boot => {
  const modeParam = url.searchParams.get(FIXTURE_MODE_PARAM);
  const modeCookie = readCookie(cookie, FIXTURE_MODE_COOKIE);
  const kindParam = url.searchParams.get(SESSION_URL_PARAM);
  const kindCookie = readCookie(cookie, SESSION_COOKIE);
  const theme = readCookie(cookie, THEME_COOKIE);
  return {
    fixtureMode: isMode(modeParam) ? modeParam : isMode(modeCookie) ? modeCookie : FixtureMode.Sample,
    sessionKind: isKind(kindParam) ? kindParam : isKind(kindCookie) ? kindCookie : SessionKind.Anon,
    today: isoDateIn(now, timeZone),
    now: now.toISOString(),
    timeZone,
    publicUrl: publicUrl.replace(/\/+$/, ''),
    theme: isThemeName(theme) ? theme : null,
    locale: resolveLocale({ cookie: readCookie(cookie, LOCALE_COOKIE), acceptLanguage }),
  };
};
