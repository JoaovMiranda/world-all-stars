/** localStorage key of the manual theme override (also read by the inline script in index.html). */
export const THEME_STORAGE_KEY = 'was-theme';
export const THEMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];
