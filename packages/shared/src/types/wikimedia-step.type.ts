import type { WIKIMEDIA_STEPS } from '../consts/commons-image.const';

/** A thumbnail width Wikimedia pre-renders and caches. */
export type WikimediaStep = (typeof WIKIMEDIA_STEPS)[number];
