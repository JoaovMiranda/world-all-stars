import { useCallback } from 'react';

import type { ThemeName } from './theme.const';
import { getEffectiveTheme, setManualTheme } from './theme.helper';
import { useEffectiveTheme } from './theme.store';

/** Current theme + toggle. Follows OS changes until the user picks a theme manually. */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const theme = useEffectiveTheme();
  const toggle = useCallback(() => setManualTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}
