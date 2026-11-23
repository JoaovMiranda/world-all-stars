/** Thumbnail widths Wikimedia pre-renders and caches (other widths may be throttled or refused). */
export const WIKIMEDIA_STEPS = [60, 120, 250, 330, 500, 960, 1280] as const;

/** Path prefix of the image proxy (apps/server/src/web/image-proxy.route.ts). */
export const IMAGE_PROXY_PREFIX = '/img/wm';
