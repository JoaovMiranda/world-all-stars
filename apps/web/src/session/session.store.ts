import { SESSION_KIND_VALUES, SessionKind } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { getBoot } from '@/app/request-scope';
import { readCookie, writeCookie } from '@/shared-ui/cookie.helper';

import { SESSION_COOKIE, SESSION_STORAGE_KEY, SESSION_URL_PARAM } from './session.const';

const isKind = (v: unknown): v is SessionKind => SESSION_KIND_VALUES.includes(v as SessionKind);
const listeners = new Set<() => void>();

/**
 * Simulated session (no real auth yet, docs 17/20): anon · reader · admin, kept in the `was_session` cookie so the
 * server renders the same profile. `?as=` overrides it for one page load.
 */
export const sessionStore = {
  get: (): SessionKind => getBoot().sessionKind,
  set(kind: SessionKind): void {
    const boot = getBoot();
    if (kind === boot.sessionKind) return;
    boot.sessionKind = kind;
    writeCookie(SESSION_COOKIE, kind);
    listeners.forEach((l) => l());
  },
  /** After hydration: moves a pre-SSR localStorage choice to the cookie (once). */
  migrateLegacy(): void {
    try {
      const legacy = localStorage.getItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      const url = new URL(window.location.href);
      if (isKind(legacy) && !readCookie(document.cookie, SESSION_COOKIE) && !url.searchParams.has(SESSION_URL_PARAM)) sessionStore.set(legacy);
    } catch {
      /* storage blocked */
    }
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useSessionKind = (): SessionKind => useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get);
