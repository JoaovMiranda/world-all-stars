import type { Tier } from '@was/shared';
import { MOTION } from '@/shared-ui/motion.const';
import { animateOnce, prefersReducedMotion } from '@/shared-ui/motion.helper';

/** Squash & stretch on press: flattens, stretches back and settles (≈ 240 ms). */
export function squash(element: HTMLElement | null): void {
  void animateOnce(
    element,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.06, .92)', offset: 0.3 }, { transform: 'scale(.97, 1.04)', offset: 0.65 }, { transform: 'scale(1)' }],
    { duration: MOTION.dur3, easing: MOTION.easeOut },
  );
}

/** Anticipation: the arrow dips before it jumps (▲ goes down then up; ▼ goes up then down). */
export function hop(element: Element | null, direction: 'up' | 'down'): void {
  const s = direction === 'up' ? 1 : -1;
  void animateOnce(
    element,
    [
      { transform: 'translateY(0)' },
      { transform: `translateY(${2 * s}px)`, offset: 0.25 },
      { transform: `translateY(${-5 * s}px)`, offset: 0.6 },
      { transform: 'translateY(0)' },
    ],
    { duration: MOTION.dur4, easing: MOTION.easeInOut },
  );
}

const SPARKS = 6;
const ARC_STEPS = 8;

/** Keyframes of one ◆ thrown along a parabola (moving in arcs): out at `angle`, then pulled down by gravity. */
export function arcKeyframes(angle: number, distance: number, gravity: number): Keyframe[] {
  return Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
    const t = i / ARC_STEPS;
    const x = Math.cos(angle) * distance * t;
    const y = Math.sin(angle) * distance * t + gravity * t * t;
    return {
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.round(t * 180)}deg) scale(${(1 - 0.5 * t).toFixed(2)})`,
      opacity: t < 0.6 ? 1 : (1 - t) / 0.4,
      offset: t,
    };
  });
}

/**
 * Exaggerated feedback for a registered vote: one metal sheen across the button + six ◆ in the tier colour thrown in
 * arcs. Rare, short (< 600 ms) and skipped entirely with reduced motion (the pressed state already says it worked).
 */
export function celebrateVote(button: HTMLElement | null, tier: Tier): void {
  if (!button || prefersReducedMotion()) return;
  button.classList.remove('is-celebrating');
  void button.offsetWidth; // restart the sheen if the user votes twice in a row
  button.classList.add('is-celebrating');
  window.setTimeout(() => button.classList.remove('is-celebrating'), 650);

  for (let i = 0; i < SPARKS; i++) {
    const spark = document.createElement('span');
    spark.className = 'vote-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.textContent = '◆';
    spark.style.color = `var(--tier-${tier}-fill)`;
    button.append(spark);
    // Fan upwards from -160° to -20°, with a little jitter so it never looks mechanical.
    const angle = ((-160 + (140 / (SPARKS - 1)) * i + (Math.random() * 16 - 8)) * Math.PI) / 180;
    const distance = 34 + Math.random() * 18;
    void animateOnce(spark, arcKeyframes(angle, distance, 38), { duration: 520 + Math.random() * 80, easing: 'linear' }).then(() => spark.remove());
  }
}
