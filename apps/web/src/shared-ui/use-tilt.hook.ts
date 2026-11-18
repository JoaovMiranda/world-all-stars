import { type RefObject, useEffect } from 'react';

import { prefersReducedMotion } from './motion.helper';

/**
 * Solid drawing: tilts the element toward the mouse (perspective rotateX/Y) and moves a specular highlight with it.
 * Writes `--tilt-x`, `--tilt-y` (deg) and `--spec-x`, `--spec-y` (%) on the element and `data-tilting` while hovered;
 * the look lives in CSS (`.tilt`, `.tilt-spec`). Only for a precise hovering pointer (no touch) and never with
 * reduced motion. Browser-only (effect), so SSR renders the flat element.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, maxDeg = 6): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let last: { x: number; y: number } | null = null;
    const apply = () => {
      frame = 0;
      if (!last) return;
      const r = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (last.x - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (last.y - r.top) / r.height));
      el.style.setProperty('--tilt-x', `${((0.5 - py) * 2 * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${((px - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--spec-x', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--spec-y', `${(py * 100).toFixed(1)}%`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      last = { x: event.clientX, y: event.clientY };
      el.setAttribute('data-tilting', '');
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      last = null;
      cancelAnimationFrame(frame);
      frame = 0;
      el.removeAttribute('data-tilting');
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, maxDeg]);
}
