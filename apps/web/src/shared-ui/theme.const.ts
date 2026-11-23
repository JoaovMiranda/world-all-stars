import { APP_COOKIE } from '@was/shared';
import type { ThemeName } from './theme-name.type';

/** Cookie of the manual theme override: the server renders <html data-theme> from it (no flash). */
export const THEME_COOKIE = APP_COOKIE.theme;
/** Legacy localStorage key (before SSR): migrated to the cookie once, then removed. */
export const THEME_STORAGE_KEY = 'was-theme';
export const THEMES = ['light', 'dark'] as const;
export const isThemeName = (value: unknown): value is ThemeName => THEMES.includes(value as ThemeName);
