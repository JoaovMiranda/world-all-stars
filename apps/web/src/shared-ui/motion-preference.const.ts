import { APP_COOKIE } from '@was/shared';

/**
 * "Pausar animações" (WCAG 2.2.2 Pause, Stop, Hide and 2.3.3): an in-page switch that freezes every non-essential
 * animation, on top of the OS `prefers-reduced-motion`. Stored in a cookie so the server renders
 * <html data-motion="reduced"> and the first paint is already still (no flash of motion).
 */
export const MOTION_COOKIE = APP_COOKIE.motion;

export const MOTION_REDUCED = 'reduced';
