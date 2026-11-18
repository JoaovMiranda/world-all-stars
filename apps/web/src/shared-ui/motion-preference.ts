import { APP_COOKIE } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { getBoot } from '@/app/request-scope';

import { writeCookie } from './cookie.helper';

/**
 * "Pausar animações" (WCAG 2.2.2 Pause, Stop, Hide and 2.3.3): an in-page switch that freezes every non-essential
 * animation, on top of the OS `prefers-reduced-motion`. Stored in a cookie so the server renders
 * <html data-motion="reduced"> and the first paint is already still (no flash of motion).
 */
export const MOTION_COOKIE = APP_COOKIE.motion;
export const MOTION_REDUCED = 'reduced';

const isPaused = (): boolean => document.documentElement.dataset.motion === MOTION_REDUCED;

export const setMotionPaused = (paused: boolean): void => {
  if (paused) document.documentElement.dataset.motion = MOTION_REDUCED;
  else delete document.documentElement.dataset.motion;
  writeCookie(MOTION_COOKIE, paused ? MOTION_REDUCED : 'full');
};

const subscribePaused = (listener: () => void): (() => void) => {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => observer.disconnect();
};

/** The in-page switch only (what the toggle shows). */
export const useMotionPaused = (): boolean => useSyncExternalStore(subscribePaused, isPaused, () => getBoot().motionPaused);

const subscribeReduced = (listener: () => void): (() => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', listener);
  const stop = subscribePaused(listener);
  return () => {
    media.removeEventListener('change', listener);
    stop();
  };
};
const isReduced = (): boolean => isPaused() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** OS preference OR the in-page switch: what JS-driven motion (globe spin, spotlight…) must respect, live. */
export const useReducedMotion = (): boolean => useSyncExternalStore(subscribeReduced, isReduced, () => getBoot().motionPaused);
