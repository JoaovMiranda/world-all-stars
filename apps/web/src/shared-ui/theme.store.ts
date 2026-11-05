import { useSyncExternalStore } from 'react';

import type { ThemeName } from './theme.const';
import { getEffectiveTheme } from './theme.helper';

/** Effective theme as an external store: notifies on manual toggle (<html data-theme>) and on OS changes. */
export const themeStore = {
  get: getEffectiveTheme,
  subscribe(listener: () => void): () => void {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const observer = new MutationObserver(listener);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    media.addEventListener('change', listener);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', listener);
    };
  },
};

export const useEffectiveTheme = (): ThemeName => useSyncExternalStore(themeStore.subscribe, themeStore.get);
