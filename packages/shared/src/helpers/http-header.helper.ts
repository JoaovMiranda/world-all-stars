import { APP_COOKIE_NAMES, AUTH_COOKIE_PREFIX } from '../consts/http-header.const';

const AUTH_COOKIE = new RegExp(`^(__Secure-|__Host-)?${AUTH_COOKIE_PREFIX}\\.`);

/** True for a first-party cookie that personalizes the page (app cookie or Better Auth cookie). */
export const isPersonalCookieName = (name: string): boolean => APP_COOKIE_NAMES.includes(name) || AUTH_COOKIE.test(name);
