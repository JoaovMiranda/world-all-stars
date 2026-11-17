/** Cookie of the manual theme override: the server renders <html data-theme> from it (no flash). */
export const THEME_COOKIE = 'was-theme';
/** Legacy localStorage key (before SSR): migrated to the cookie once, then removed. */
export const THEME_STORAGE_KEY = 'was-theme';
export const THEMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];
export const isThemeName = (value: unknown): value is ThemeName => THEMES.includes(value as ThemeName);
