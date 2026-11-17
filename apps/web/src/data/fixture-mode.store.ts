import type { FixtureMode } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { getBoot } from '@/app/request-scope';
import { writeCookie } from '@/shared-ui/cookie.helper';

import { FIXTURE_MODE_COOKIE, FIXTURE_MODE_PARAM } from './data-layer.const';

const listeners = new Set<() => void>();

/**
 * Global fixture mode (`?fixture=sample|empty|loading|error`, kept in a cookie until the browser closes).
 * The server resolves it per request (boot); the browser starts from the same value and switches it here.
 */
export const fixtureModeStore = {
  get: (): FixtureMode => getBoot().fixtureMode,
  set(mode: FixtureMode): void {
    const boot = getBoot();
    if (mode === boot.fixtureMode) return;
    boot.fixtureMode = mode;
    writeCookie(FIXTURE_MODE_COOKIE, mode, 'session');
    const url = new URL(window.location.href);
    url.searchParams.set(FIXTURE_MODE_PARAM, mode);
    window.history.replaceState(window.history.state, '', url);
    listeners.forEach((l) => l());
  },
  /** After hydration: a `?fixture=` in the URL becomes the cookie (survives SPA navigation and reloads). */
  persist(): void {
    writeCookie(FIXTURE_MODE_COOKIE, getBoot().fixtureMode, 'session');
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useFixtureMode = (): FixtureMode => useSyncExternalStore(fixtureModeStore.subscribe, fixtureModeStore.get, fixtureModeStore.get);
