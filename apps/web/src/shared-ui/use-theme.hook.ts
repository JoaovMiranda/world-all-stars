import { useCallback } from 'react';

import { getEffectiveTheme, setManualTheme } from './theme.helper';
import { useEffectiveTheme } from './theme.store';
import type { ThemeName } from './theme-name.type';

/** Current theme + toggle. Follows OS changes until the user picks a theme manually. */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const theme = useEffectiveTheme();
  const toggle = useCallback(() => setManualTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}
