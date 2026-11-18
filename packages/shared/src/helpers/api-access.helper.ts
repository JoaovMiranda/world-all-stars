import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import { API_ERROR_MESSAGES } from '../consts/api-error-messages.const';
import { ApiAccess } from '../enums/api-access.enum';
import { ApiErrorCode } from '../enums/api-error-code.enum';
import { SessionKind } from '../enums/session-kind.enum';
import type { ApiErrorBody } from '../schemas/api-error.schema';

/**
 * Access rule of a contract (`access`) for a session: null when allowed, else the HTTP status + error body.
 * Same rule on the server (auth middleware) and in the web fixtures.
 */
export const accessDenial = (access: ApiAccess, kind: SessionKind, banned = false, locale: Locale = DEFAULT_LOCALE): { status: 401 | 403; body: ApiErrorBody } | null => {
  const m = textFor(API_ERROR_MESSAGES, locale);
  if (access === ApiAccess.Public) return null;
  if (kind === SessionKind.Anon) return { status: 401, body: { error: ApiErrorCode.Auth, message: m.signIn } };
  if (banned) return { status: 403, body: { error: ApiErrorCode.Banned, message: m.banned } };
  if (access === ApiAccess.Admin && kind !== SessionKind.Admin) return { status: 403, body: { error: ApiErrorCode.Forbidden, message: m.forbidden } };
  return null;
};
