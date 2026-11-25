import type { ATTRIBUTED_SOURCES } from './attributed-sources.const';

/** A source with a required visible credit (key of ATTRIBUTED_SOURCES). */
export type AttributedSourceKey = keyof typeof ATTRIBUTED_SOURCES;
