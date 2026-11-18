import { type RefObject, useEffect } from 'react';

import { prefersReducedMotion } from './motion.helper';

type Callback = () => void;

let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, Callback>();

function fire(target: Element): void {
  const cb = callbacks.get(target);
  observer?.unobserve(target);
  callbacks.delete(target);
  cb?.();
}

/**
 * Safety net: a jump (End key, anchor link, scrollbar drag) can carry an element from below the screen to above it
 * without ever intersecting, so the observer never fires. On scroll, anything already passed is revealed too.
 */
let scrollFrame = 0;
function onScroll(): void {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    for (const el of [...callbacks.keys()]) if (el.getBoundingClientRect().top < window.innerHeight) fire(el);
  });
}

/** One IntersectionObserver (and one scroll listener) for the whole page, cheaper than one per element. */
function observe(element: Element, onEnter: Callback): () => void {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) fire(entry.target);
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  callbacks.set(element, onEnter);
  observer.observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}

/** Reveals already played on this page load, by `pathname#name`: going back does not replay them. */
const played = new Set<string>();

/** True when the element is already (at least partly) on screen or above it. */
const isOnOrAboveScreen = (el: Element) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

/**
 * Scroll reveal. Only elements BELOW the fold at hydration get `data-reveal="pending"` (hidden by CSS); they switch to
 * `"in"` once 15% is visible and to `"done"` after the transition, so no transition lingers on them.
 * - SSR, no JS, reduced motion or already on screen: nothing is ever hidden (no flash, no waiting — Doherty).
 * - `name` makes it play once per page: after going back, the section is simply there.
 * - `stagger`: direct children get `--i` for the cascade delay.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, { name, stagger = false, settleMs = 1600 }: { name?: string | undefined; stagger?: boolean; settleMs?: number } = {}): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    const key = name ? `${window.location.pathname}#${name}` : null;
    if ((key && played.has(key)) || isOnOrAboveScreen(el)) return;

    if (stagger) Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty('--i', String(i)));
    el.dataset.reveal = 'pending';
    let timer = 0;
    const stop = observe(el, () => {
      if (key) played.add(key);
      // Next frame, so the browser has painted the hidden state and the transition runs.
      requestAnimationFrame(() => {
        el.dataset.reveal = 'in';
        timer = window.setTimeout(() => (el.dataset.reveal = 'done'), settleMs);
      });
    });
    return () => {
      stop();
      window.clearTimeout(timer);
      if (el.dataset.reveal === 'pending') delete el.dataset.reveal;
    };
  }, [ref, name, stagger, settleMs]);
}

/**
 * Runs `onEnter` once when the element scrolls into view (immediately if it already is). For count-ups and other
 * one-shot effects; never with reduced motion.
 */
export function useInViewOnce(ref: RefObject<Element | null>, onEnter: () => void): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    return observe(el, onEnter);
    // onEnter is intentionally read once: a re-render must not restart the effect.
  }, [ref]);
}
