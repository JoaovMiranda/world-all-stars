import { useSyncExternalStore } from 'react';

import { getBoot } from '@/app/request-scope';

import { writeCookie } from './cookie.helper';
import { MOTION_COOKIE, MOTION_REDUCED } from './motion-preference.const';

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
