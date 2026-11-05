import { FIXTURE_MODE_VALUES, FixtureMode } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { FIXTURE_MODE_PARAM, FIXTURE_MODE_STORAGE_KEY } from './data-layer.const';

const isMode = (v: unknown): v is FixtureMode => FIXTURE_MODE_VALUES.includes(v as FixtureMode);
const listeners = new Set<() => void>();

const readInitial = (): FixtureMode => {
  const fromUrl = new URLSearchParams(window.location.search).get(FIXTURE_MODE_PARAM);
  if (isMode(fromUrl)) {
    try {
      sessionStorage.setItem(FIXTURE_MODE_STORAGE_KEY, fromUrl);
    } catch {
      /* storage blocked */
    }
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(FIXTURE_MODE_STORAGE_KEY);
    if (isMode(stored)) return stored;
  } catch {
    /* storage blocked */
  }
  return FixtureMode.Sample;
};

let current: FixtureMode = readInitial();

/** Global fixture mode (`?fixture=sample|empty|loading|error`, kept for the tab session). Default: sample. */
export const fixtureModeStore = {
  get: (): FixtureMode => current,
  set(mode: FixtureMode): void {
    if (mode === current) return;
    current = mode;
    try {
      sessionStorage.setItem(FIXTURE_MODE_STORAGE_KEY, mode);
    } catch {
      /* storage blocked */
    }
    const url = new URL(window.location.href);
    url.searchParams.set(FIXTURE_MODE_PARAM, mode);
    window.history.replaceState(window.history.state, '', url);
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useFixtureMode = (): FixtureMode => useSyncExternalStore(fixtureModeStore.subscribe, fixtureModeStore.get);
