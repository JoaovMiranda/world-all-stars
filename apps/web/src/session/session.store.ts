import { SESSION_KIND_VALUES, SessionKind } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { SESSION_STORAGE_KEY, SESSION_URL_PARAM } from './session.const';

const isKind = (v: unknown): v is SessionKind => SESSION_KIND_VALUES.includes(v as SessionKind);
const listeners = new Set<() => void>();

const readInitial = (): SessionKind => {
  const fromUrl = new URLSearchParams(window.location.search).get(SESSION_URL_PARAM);
  if (isKind(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (isKind(stored)) return stored;
  } catch {
    /* storage blocked */
  }
  return SessionKind.Anon;
};

let current: SessionKind = readInitial();

/** Simulated session (no real auth yet, docs 17/20): anon · reader · admin, persisted in localStorage. */
export const sessionStore = {
  get: (): SessionKind => current,
  set(kind: SessionKind): void {
    if (kind === current) return;
    current = kind;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, kind);
    } catch {
      /* storage blocked */
    }
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useSessionKind = (): SessionKind => useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
