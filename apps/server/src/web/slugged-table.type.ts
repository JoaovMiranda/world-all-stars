import type { athletes, sports } from '@was/db';

/** Entity tables whose pages answer old slugs with a 301. */
export type SluggedTable = typeof sports | typeof athletes;
