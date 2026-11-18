/** Imperative motion helpers. Browser-only: call them from effects or event handlers, never during render (SSR). */

/** Durations and curves mirrored from the theme tokens (packages/shared/src/theme/theme.css), for the Web Animations API. */
export const MOTION = {
  dur1: 90,
  dur2: 160,
  dur3: 240,
  dur4: 420,
  easeOut: 'cubic-bezier(.2, .8, .2, 1)',
  easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
  easeSnap: 'cubic-bezier(.3, 1.4, .5, 1)',
  easeAnticip: 'cubic-bezier(.6, -.28, .735, .045)',
} as const;

/** True when the user asked for reduced motion: OS setting or the in-page "Pausar animações" switch (false on the server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Plays a one-shot animation and resolves when it ends. With reduced motion (or no element/WAAPI) it does nothing
 * and resolves immediately, so callers can always `await` it before navigating or swapping state.
 */
export function animateOnce(
  element: Element | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {},
): Promise<void> {
  if (!element || typeof element.animate !== 'function' || prefersReducedMotion()) return Promise.resolve();
  const animation = element.animate(keyframes, { duration: MOTION.dur3, easing: MOTION.easeOut, ...options });
  const finished = animation.finished.then(
    () => undefined,
    () => undefined,
  );
  // Never hold the caller (e.g. a navigation) longer than planned: a throttled tab can stretch the frames.
  const planned = (typeof options.duration === 'number' ? options.duration : MOTION.dur3) + (options.delay ?? 0) + 80;
  return Promise.race([finished, new Promise<void>((resolve) => window.setTimeout(resolve, planned))]);
}
