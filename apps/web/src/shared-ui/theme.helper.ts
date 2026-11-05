import { THEME_STORAGE_KEY, THEMES, type ThemeName } from './theme.const';

const isThemeName = (value: unknown): value is ThemeName => THEMES.includes(value as ThemeName);

/** Theme in effect: manual override on <html data-theme>, otherwise the OS preference. */
export const getEffectiveTheme = (): ThemeName => {
  const forced = document.documentElement.dataset.theme;
  if (isThemeName(forced)) return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Applies a manual theme and persists it (storage may be blocked: ignore). */
export const setManualTheme = (theme: ThemeName): void => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode / blocked storage */
  }
};
