import { getBoot } from '@/app/request-scope';

import { readCookie, writeCookie } from './cookie.helper';
import { isThemeName, THEME_COOKIE, THEME_STORAGE_KEY } from './theme.const';
import type { ThemeName } from './theme-name.type';

/** Theme in effect (browser): manual override on <html data-theme>, otherwise the OS preference. */
export const getEffectiveTheme = (): ThemeName => {
  const forced = document.documentElement.dataset.theme;
  if (isThemeName(forced)) return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Theme the server rendered with (cookie), used while hydrating so markup matches; light when unknown. */
export const getServerTheme = (): ThemeName => getBoot().theme ?? 'light';

/** Applies a manual theme and persists it in the cookie the server reads (first paint already themed). */
export const setManualTheme = (theme: ThemeName): void => {
  document.documentElement.dataset.theme = theme;
  writeCookie(THEME_COOKIE, theme);
};

/** After hydration: moves a pre-SSR localStorage theme to the cookie (once). */
export const migrateLegacyTheme = (): void => {
  try {
    const legacy = localStorage.getItem(THEME_STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
    if (isThemeName(legacy) && !readCookie(document.cookie, THEME_COOKIE)) setManualTheme(legacy);
  } catch {
    /* storage blocked */
  }
};
