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
