import type { Actor } from '@was/db';

/** Actor of the writes applied from AI enrichment. */
export const AI_ACTOR: Actor = { userId: null, name: 'ai enrichment', via: 'system:enrich' };
