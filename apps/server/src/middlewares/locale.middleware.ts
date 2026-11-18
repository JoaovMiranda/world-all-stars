import { LOCALE_COOKIE, LOCALE_HEADER, LOCALE_QUERY_PARAM, resolveLocale } from '@was/shared';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';

import type { HonoEnv } from '../http/app-context.type';

/**
 * Language of an API request (doc 12 i18n): `?locale=` → `x-was-locale` (the web client's current language) →
 * `was_locale` cookie → Accept-Language → pt-BR. Labels, validation errors and translated content follow it.
 */
export const localeMiddleware = (): MiddlewareHandler<HonoEnv> => async (c, next) => {
  const locale = resolveLocale({
    query: c.req.query(LOCALE_QUERY_PARAM),
    header: c.req.header(LOCALE_HEADER),
    cookie: getCookie(c, LOCALE_COOKIE),
    acceptLanguage: c.req.header('accept-language'),
  });
  c.set('locale', locale);
  c.header('Content-Language', locale);
  c.header('Vary', `Accept-Language, Cookie, ${LOCALE_HEADER}`, { append: true });
  await next();
};
